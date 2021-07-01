import { interpolateColor } from '../../../lib/util/color';
import {
  Attribute,
  Modifier,
  NodeContents,
  NodeContentsCondition,
  NodeContentsLine,
} from './NodeContentsFactory';

export const AttributeSymbolMap = {
  [Attribute.RED0]: '🔴',
  [Attribute.RED1]: '🟢',
  [Attribute.RED2]: '🔵',
  [Attribute.DEL0]: '⚔️',
  [Attribute.DEL1]: '🛡',
  [Attribute.DEL2]: '✨',
};

// TODO(bowei): enforce this is the same length using typescript
export const AttributesSorted = [
  Attribute.RED0,
  Attribute.RED1,
  Attribute.RED2,
  Attribute.DEL0,
  Attribute.DEL1,
  Attribute.DEL2,
];

// Use hue and saturation from this map; HSV value is determined by node allocation state
// Lch is actually better: see https://en.wikipedia.org/wiki/HCL_color_space
export const AttributeColorMap: { [k in Attribute | '']: number } = {
  '': 0x888888,
  [Attribute.RED0]: 0xff0000,
  [Attribute.RED1]: 0x00ff00,
  [Attribute.RED2]: 0x0000ff,
  [Attribute.DEL0]: 0x5a8f88,
  [Attribute.DEL1]: 0xffc400,
  [Attribute.DEL2]: 0xffff43,
};

export const AttributeDescriptionMap = {
  [Attribute.RED0]: 'Red',
  [Attribute.RED1]: 'Green',
  [Attribute.RED2]: 'Blue',
  [Attribute.DEL0]: 'Offense',
  [Attribute.DEL1]: 'Defense',
  [Attribute.DEL2]: 'Magic',
};

export const AttributeDescriptionReverseMap: { [k: string]: Attribute } = {
  Red: Attribute.RED0,
  Green: Attribute.RED1,
  Blue: Attribute.RED2,
  Offense: Attribute.DEL0,
  Defense: Attribute.DEL1,
  Magic: Attribute.DEL2,
};

export const ModifierSymbolMap = {
  [Modifier.FLAT]: '+',
  [Modifier.INCREASED]: '%',
};
export const ModifierDescriptionMap = {
  [Modifier.FLAT]: 'flat',
  [Modifier.INCREASED]: 'increased',
};
export const ModifierDescriptionReverseMap: { [k: string]: Modifier } = {
  flat: Modifier.FLAT,
  increased: Modifier.INCREASED,
};

export function nodeContentsLineToString(line: NodeContentsLine): string {
  const desc = AttributeDescriptionMap[line.attribute];
  const symbol = AttributeSymbolMap[line.attribute];
  if (line.modifier === Modifier.FLAT) {
    return `+${line.amount} ${symbol} (${desc})`;
  } else {
    return `${line.amount}% increased ${symbol} (${desc})`;
  }
}

export function nodeContentsConditionToString(
  condition: NodeContentsCondition
): string {
  return `SPEND: ${condition.amount} ${
    AttributeDescriptionMap[condition.attribute]
  }`;
}

export function nodeContentsToColor(nodeContents: NodeContents): number {
  if (nodeContents.lines.length === 0) {
    return AttributeColorMap[''];
  }
  const color0 = AttributeColorMap[nodeContents.lines[0].attribute];
  if (nodeContents.lines.length === 1) {
    return color0;
  }
  const color1 = AttributeColorMap[nodeContents.lines[1].attribute];
  // return 50% of the way in between the 2 colors
  return interpolateColor({ color: color0, opacity: 0.5, background: color1 });
}
