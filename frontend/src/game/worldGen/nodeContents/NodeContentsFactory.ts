import { HashMap } from '../../../lib/util/data_structures/hash';
import { Vector2 } from '../../../lib/util/geometry/vector2';
import { Vector3 } from '../../../lib/util/geometry/vector3';
import { squirrel3 } from '../../../lib/util/random';
import {
  randomDice,
  randomSwitch,
  randomUniform,
  randomValue,
} from '../../../lib/util/randomHelpers';

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
  DECISION_0: {
    EMPTY: 150,
    NO_SPEND: 100,
    SPEND: 0,
  },
  // how many different attributes are in the non-spend section
  DECISION_1: {
    SINGLE: 500,
    DOUBLE: 0,
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
    [Modifier.FLAT]: 100,
    [Modifier.INCREASED]: 75,
  },
};

export class NodeContentsFactory {
  public config: NodeContentsFactoryConfig;

  private clusterCenterData: HashMap<Vector3, any>;

  constructor(config: NodeContentsFactoryConfig) {
    this.config = config;
    this.clusterCenterData = new HashMap();
  }

  private createSingle(args: { randInt: number }): NodeContentsLine {
    const attribute = randomValue<typeof Attribute>({
      randInt: args.randInt,
      weights: WEIGHTS.SINGLE_COLORS,
    });

    const modifier = randomValue<typeof Modifier>({
      randInt: squirrel3(args.randInt),
      weights: WEIGHTS.SINGLE_MODIFIERS,
    });

    let amount = 0;
    if (modifier === Modifier.FLAT) {
      amount = randomDice({
        randInt: squirrel3(args.randInt + 1),
        formula: '2d6',
        plus: 8,
      });
    } else {
      amount = randomUniform({
        randInt: squirrel3(args.randInt + 2),
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

  private createNoSpend(args: { randInt: number }): NodeContents {
    return randomSwitch<NodeContents>({
      randInt: args.randInt,
      weights: WEIGHTS.DECISION_1,
      behaviors: {
        SINGLE: (randInt) => {
          return {
            lines: [this.createSingle({ randInt })],
          };
        },
        DOUBLE: (randInt) => {
          return {
            lines: [
              this.createSingle({ randInt }),
              this.createSingle({ randInt: squirrel3(randInt) }),
            ],
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
    let clusterCenter: Vector3 | null;
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

    // hardcode the starting cluster to be empty
    if (clusterCenter.equals(Vector3.Zero)) {
      return {
        lines: [],
      };
    }

    const result = randomSwitch<NodeContents>({
      randInt: squirrel3(seed + Vector3ToSeed(clusterCenter)),
      weights: WEIGHTS.DECISION_0,
      behaviors: {
        EMPTY: (randInt: number) => {
          return {
            lines: [],
          };
        },
        NO_SPEND: (randInt: number) => {
          return this.createNoSpend({ randInt });
        },
        SPEND: (randInt: number) => {
          const base = this.createNoSpend({ randInt });

          const attribute = randomValue<typeof Attribute>({
            randInt,
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
