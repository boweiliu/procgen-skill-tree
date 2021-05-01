import { Vector2 } from '../../../lib/util/geometry/vector2';
import { Vector3 } from '../../../lib/util/geometry/vector3';

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
}

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
    return {
      lines: [
        {
          amount: 10,
          attribute: Attribute.RED,
          modifier: Modifier.FLAT,
        },
        {
          amount: 2,
          attribute: Attribute.RED,
          modifier: Modifier.INCREASED,
        },
      ],
      condition: {
        type: 'SPEND',
        amount: 12,
        attribute: Attribute.GREEN,
      },
    };
  }
}
