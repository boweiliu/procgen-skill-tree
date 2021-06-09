import {
  Attribute,
  Modifier,
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

export const AttributeDescriptionMap = {
  [Attribute.RED0]: 'Red',
  [Attribute.RED1]: 'Green',
  [Attribute.RED2]: 'Blue',
  [Attribute.DEL0]: 'Offense',
  [Attribute.DEL1]: 'Defense',
  [Attribute.DEL2]: 'Magic',
};

export const ModifierSymbolMap = {
  [Modifier.FLAT]: '+',
  [Modifier.INCREASED]: '%',
};
export const ModifierDescriptionMap = {
  [Modifier.FLAT]: 'flat',
  [Modifier.INCREASED]: 'increased',
};

export function nodeContentsLineToString(line: NodeContentsLine): string {
  if (line.modifier === Modifier.FLAT) {
    return `+${line.amount} ${AttributeDescriptionMap[line.attribute]}`;
  } else {
    return `${line.amount}% increased ${
      AttributeDescriptionMap[line.attribute]
    }`;
  }
}

export function nodeContentsConditionToString(
  condition: NodeContentsCondition
): string {
  return `SPEND: ${condition.amount} ${
    AttributeDescriptionMap[condition.attribute]
  }`;
}
