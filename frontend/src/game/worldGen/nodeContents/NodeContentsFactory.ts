import { Vector2 } from '../../../lib/util/geometry/vector2';
import { Vector3 } from '../../../lib/util/geometry/vector3';
import { INTMAX32, squirrel3 } from '../../../lib/util/random';

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
  RED = 'RED',
  GREEN = 'GREEN',
  BLUE = 'BLUE',
  DEL0 = 'DEL0',
  DEL1 = 'DEL1',
  DEL2 = 'DEL2',
}

export const AttributeSymbolMap = {
  [Attribute.RED]: '🔴',
  [Attribute.GREEN]: '🟢',
  [Attribute.BLUE]: '🔵',
  [Attribute.DEL0]: '⚔️',
  [Attribute.DEL1]: '🛡️',
  [Attribute.DEL2]: '✨',
};

export enum Modifier {
  FLAT = 'FLAT',
  INCREASED = 'INCREASED',
}

const WEIGHTS = {
  DECISION_0: {
    EMPTY: 800,
    NO_SPEND: 100,
    SPEND: 10,
  },
  DECISION_1: {
    SINGLE: 500,
    DOUBLE: 100,
  },
};

function randomSwitch<T>(args: {
  randInt: number;
  weights: { [k: string]: number };
  behaviors: { [k: string]: (randInt: number) => T };
}): T {
  const { randInt, weights, behaviors } = args;
  const p = randInt / INTMAX32;
  const newRandInt = squirrel3(randInt);
  const weightTotal = Object.values(weights).reduce((pv, cv) => pv + cv);
  let unusedWeight = p * weightTotal;
  for (const [key, weight] of Object.entries(weights)) {
    if (unusedWeight <= weight) {
      // use key
      return behaviors[key](newRandInt);
    } else {
      unusedWeight -= weight;
    }
  }
  throw Error();
}

function randomValue<T>(args: {
  randInt: number;
  weights: { [k in keyof T]: number };
}): keyof T {
  const { randInt, weights } = args;
  const p = randInt / INTMAX32;
  const weightTotal = (Object.values(weights) as number[]).reduce(
    (pv, cv) => pv + cv
  );
  let unusedWeight = p * weightTotal;
  for (const [key, weight] of Object.entries(weights) as [keyof T, number][]) {
    if (unusedWeight <= weight) {
      // use key
      return key;
    } else {
      unusedWeight -= weight;
    }
  }
  throw Error();
}

export class NodeContentsFactory {
  public config: NodeContentsFactoryConfig;

  constructor(config: NodeContentsFactoryConfig) {
    this.config = config;
  }

  private createSingle(args: { randInt: number }): NodeContentsLine {
    const attribute = randomValue<typeof Attribute>({
      randInt: args.randInt,
      weights: {
        [Attribute.RED]: 100,
        [Attribute.GREEN]: 100,
        [Attribute.BLUE]: 100,
        [Attribute.DEL0]: 10,
        [Attribute.DEL1]: 10,
        [Attribute.DEL2]: 10,
      },
    });

    return {
      attribute: Attribute[attribute],
      amount: 10,
      modifier: Modifier.FLAT,
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

  public create(args: { seed: number; location: Vector3 }): NodeContents {
    const { seed, location } = args;
    if (location.equals(Vector3.Zero)) {
      return {
        lines: [],
      };
    }

    return randomSwitch<NodeContents>({
      randInt: squirrel3(
        seed +
          location.x +
          location.y +
          squirrel3(seed + location.x + location.z)
      ),
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
              [Attribute.RED]: 100,
              [Attribute.GREEN]: 100,
              [Attribute.BLUE]: 100,
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
  }
}
