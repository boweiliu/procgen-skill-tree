import { HashMap } from '../../../lib/util/data_structures/hash';
import { Vector2 } from '../../../lib/util/geometry/vector2';
import { Vector3 } from '../../../lib/util/geometry/vector3';
import { roundToEven } from '../../../lib/util/misc';
import { squirrel3 } from '../../../lib/util/random';
import {
  randomDice,
  randomSwitch,
  randomUniform,
  randomValue,
} from '../../../lib/util/randomHelpers';
import { STARTER_AREA_RADIUS, taxicabDistance } from '../LockFactory';

type NodeContentsFactoryConfig = {};

export interface NodeContents {
  lines: NodeContentsLine[];

  condition?: NodeContentsCondition;
}

export interface NodeContentsCondition {
  type: 'SPEND';
  attribute: Attribute;
  amount: number;
}

export interface NodeContentsLine {
  amount: number;
  attribute: Attribute;
  modifier: Modifier;
}

export enum Attribute {
  RED0 = 'RED0',
  RED1 = 'RED1',
  RED2 = 'RED2',
  DEL0 = 'DEL0',
  DEL1 = 'DEL1',
  DEL2 = 'DEL2',
}

export enum Modifier {
  FLAT = 'FLAT',
  INCREASED = 'INCREASED',
}

const WEIGHTS = {
  // for any single node, what is in it
  ROOT: {
    EMPTY: 150,
    NO_SPEND: 100,
    SPEND: 0,
  },

  STARTER_AREA_ROOT: {
    EMPTY: 30,
    NO_SPEND: 100,
    SPEND: 0,
  },
  // how many different attributes are in the non-spend section
  DECISION_1: {
    SINGLE: 500,
    DOUBLE: 500,
  },
  // if we are doing a single attribute, what attribute is it going to be
  SINGLE_COLORS: {
    [Attribute.RED0]: 100,
    [Attribute.RED1]: 100,
    [Attribute.RED2]: 100,
    [Attribute.DEL0]: 10,
    [Attribute.DEL1]: 10,
    [Attribute.DEL2]: 10,
  },
  // if we are doing a single attribute, what modifier is it going to be
  SINGLE_MODIFIERS: {
    [Modifier.FLAT]: 150,
    [Modifier.INCREASED]: 100,
  },
  // same as above but in the starting region
  STARTER_AREA_SINGLE_MODIFIERS: {
    [Modifier.FLAT]: 400,
    [Modifier.INCREASED]: 100,
  },
};

export class NodeContentsFactory {
  public config: NodeContentsFactoryConfig;

  private clusterCenterData: HashMap<Vector3, any>;

  constructor(config: NodeContentsFactoryConfig) {
    this.config = config;
    this.clusterCenterData = new HashMap();
  }

  private createSingle(args: {
    seed: number;
    location: Vector3;
  }): NodeContentsLine {
    const attribute = randomValue<typeof Attribute>({
      seed: args.seed,
      weights: WEIGHTS.SINGLE_COLORS,
    });

    const modifier = randomValue<typeof Modifier>({
      seed: args.seed + 1,
      weights:
        taxicabDistance(args.location.pairXY()) <= STARTER_AREA_RADIUS
          ? WEIGHTS.STARTER_AREA_SINGLE_MODIFIERS
          : WEIGHTS.SINGLE_MODIFIERS,
    });

    let amount = 0;
    if (modifier === Modifier.FLAT) {
      amount =
        2 *
        randomDice({
          seed: args.seed + 2,
          formula: '2d4',
          plus: 7,
        });
    } else {
      amount = randomUniform({
        seed: args.seed + 2,
        min: 4,
        max: 7,
        increment: 0.5,
        inclusive: true,
      });
    }

    return {
      attribute: Attribute[attribute],
      amount,
      modifier: Modifier[modifier],
    };
  }

  private createDouble(args: {
    seed: number;
    location: Vector3;
  }): NodeContentsLine[] {
    const modifier = randomValue<typeof Modifier>({
      seed: args.seed + 1,
      weights:
        taxicabDistance(args.location.pairXY()) <= STARTER_AREA_RADIUS
          ? WEIGHTS.STARTER_AREA_SINGLE_MODIFIERS
          : WEIGHTS.SINGLE_MODIFIERS,
    });

    let amount1: number, amount2: number;
    if (modifier === Modifier.FLAT) {
      // [18-30] = [9-15] * 2
      amount1 =
        2 *
        randomDice({
          seed: args.seed + 2,
          formula: '2d4',
          plus: 7,
        });
      amount2 =
        amount1 / 2 +
        randomUniform({
          seed: args.seed + 3,
          min: -2,
          max: 2,
          inclusive: true,
        });
    } else {
      // [4.5-7.5] = [9-15]/2
      amount1 =
        0.5 *
        randomDice({
          seed: args.seed + 2,
          formula: '2d4',
          plus: 7,
        });
      // [2-4] but usually 3
      amount2 =
        roundToEven(amount1) / 2 +
        randomUniform({
          seed: args.seed + 3,
          min: 0.5,
          max: 0.5,
          inclusive: true,
        });
    }

    const attribute1 = randomValue<typeof Attribute>({
      seed: args.seed,
      weights: WEIGHTS.SINGLE_COLORS,
    });

    // guarantee distinct attributes
    const attribute2 = randomValue<typeof Attribute>({
      seed: args.seed,
      weights: { ...WEIGHTS.SINGLE_COLORS, [attribute1]: 0 },
    });

    return [
      {
        attribute: Attribute[attribute1],
        amount: amount1,
        modifier: Modifier[modifier],
      },
      {
        attribute: Attribute[attribute2],
        amount: amount2,
        modifier: Modifier[modifier],
      },
    ];
  }

  private createNoSpend(args: {
    seed: number;
    location: Vector3;
  }): NodeContents {
    const { location } = args;

    return randomSwitch<NodeContents>({
      seed: args.seed,
      weights: WEIGHTS.DECISION_1,
      behaviors: {
        SINGLE: (seed) => {
          return {
            lines: [
              this.createSingle({
                seed,
                location,
              }),
            ],
          };
        },
        DOUBLE: (seed) => {
          return {
            lines: this.createDouble({
              seed,
              location,
            }),
          };
        },
      },
    });
  }

  /**
   * Entry point.
   * @param args
   * @returns
   */
  public create(args: { seed: number; location: Vector3 }): NodeContents {
    const { seed, location } = args;

    // hardcode the starting point to be empty
    if (location.equals(Vector3.Zero)) {
      return {
        lines: [],
      };
    }

    // find the closest cluster center - a 3x3 hexagonal region
    let clusterCenter: Vector3;
    let modulo3 = location.moduloPositive(3).pairXY();
    if (
      modulo3.equals(new Vector2(1, 2)) ||
      modulo3.equals(new Vector2(2, 1))
    ) {
      // not close to any cluster centers
      clusterCenter = location;
    } else {
      clusterCenter = location.divide(3).round().multiply(3);
    }

    // don't use the cluster for the starting cluster
    if (clusterCenter.equals(Vector3.Zero)) {
      clusterCenter = location;
    }

    const result = randomSwitch<NodeContents>({
      seed: seed + Vector3ToSeed(clusterCenter),
      weights:
        taxicabDistance(args.location.pairXY()) <= STARTER_AREA_RADIUS
          ? WEIGHTS.STARTER_AREA_ROOT
          : WEIGHTS.ROOT,
      behaviors: {
        EMPTY: (randInt: number) => {
          return {
            lines: [],
          };
        },
        NO_SPEND: (seed: number) => {
          return this.createNoSpend({
            seed,
            location: clusterCenter,
          });
        },
        SPEND: (seed: number) => {
          const base = this.createNoSpend({
            seed,
            location: clusterCenter,
          });

          const attribute = randomValue<typeof Attribute>({
            seed: seed + 1,
            weights: {
              [Attribute.RED0]: 100,
              [Attribute.RED1]: 100,
              [Attribute.RED2]: 100,
              [Attribute.DEL0]: 0,
              [Attribute.DEL1]: 0,
              [Attribute.DEL2]: 0,
            },
          });

          return {
            ...base,
            condition: {
              type: 'SPEND',
              amount: 12,
              attribute: Attribute[attribute],
            },
          };
        },
      },
    });

    return result;
  }
}

export function Vector3ToSeed(v: Vector3) {
  return v.x + v.y + squirrel3(v.x + v.z);
}
