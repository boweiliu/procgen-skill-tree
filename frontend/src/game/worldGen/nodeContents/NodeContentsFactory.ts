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

export class NodeContentsFactory {
  public config: NodeContentsFactoryConfig;

  constructor(config: NodeContentsFactoryConfig) {
    this.config = config;
  }

  public create(args: { seed: number; location: Vector3 }): NodeContents {
    if (args.location.equals(Vector3.Zero)) {
      return {
        lines: [],
      };
    }

    let id = squirrel3(
      args.seed +
        args.location.x +
        args.location.y +
        squirrel3(args.seed + args.location.x + args.location.z)
    );
    let p = id / INTMAX32;
    if (p < 0.8) {
      // probability of empty node
      return {
        lines: [],
      };
    } else if (p < 0.9) {
      // no COST
      id = squirrel3(id);
      p = id / INTMAX32;
      if (p < 0.75) {
        // probability of single
        return {
          lines: [
            {
              amount: 10,
              attribute: Attribute.RED,
              modifier: Modifier.FLAT,
            },
          ],
        };
      } else {
        // probability of double
        return {
          lines: [
            {
              amount: 10,
              attribute: Attribute.DEL0,
              modifier: Modifier.FLAT,
            },
            {
              amount: 2,
              attribute: Attribute.GREEN,
              modifier: Modifier.INCREASED,
            },
          ],
        };
      }
    } else {
      // COST{
      return {
        lines: [
          {
            amount: 10,
            attribute: Attribute.BLUE,
            modifier: Modifier.FLAT,
          },
          {
            amount: 2,
            attribute: Attribute.DEL2,
            modifier: Modifier.INCREASED,
          },
        ],
        condition: {
          type: 'SPEND',
          amount: 12,
          attribute: Attribute.DEL1,
        },
      };
    }
  }
}
