import React from 'react';
import { GameState } from '../../../data/GameState';
import { Attribute } from '../../../game/worldGen/nodeContents/NodeContentsFactory';
import {
  AttributesSorted,
  AttributeSymbolMap,
} from '../../../game/worldGen/nodeContents/NodeContentsRendering';
import { computeAttributeModifierStats } from './StatsTab';

export const QuestsTab = React.memo(QuestsTabComponent);

function QuestsTabComponent(props: { gameState: GameState }) {
  const attributeStats = computeAttributeModifierStats({
    gameState: props.gameState,
  });

  // find max attribute and its value
  let maxAttribute!: Attribute;
  let maxValue!: number;
  AttributesSorted.map((attribute) => {
    return { attribute, stats: attributeStats[attribute] };
  }).forEach(({ attribute, stats }) => {
    const { total } = stats;
    if (maxValue === undefined || total > maxValue) {
      maxAttribute = attribute;
      maxValue = total;
    }
  });

  // find second largest
  let secondMaxAttribute!: Attribute;
  let secondMaxValue!: number;
  AttributesSorted.map((attribute) => {
    return { attribute, stats: attributeStats[attribute] };
  }).forEach(({ attribute, stats }) => {
    const { total } = stats;
    if (attribute === maxAttribute) return;
    if (secondMaxValue === undefined || total > secondMaxValue) {
      secondMaxAttribute = attribute;
      secondMaxValue = total;
    }
  });

  const questCompleted = maxValue >= 1000 && secondMaxValue >= 400;

  return (
    <>
      <div>Quests info</div>
      <br></br>
      <div className="tab-content-body">
        <div>Ultimate goal:</div>
        <ol>
          <li>
            <div>1000 of any attribute:</div>
            <br></br>
            <div>
              Progress: <meter value={maxValue} min={0} max={1000}></meter>{' '}
              {maxValue + ' ' + AttributeSymbolMap[maxAttribute] + ' / 1000'}
            </div>
            <br></br>
          </li>
          <li>
            <div>400 of any other attribute:</div>
            <br></br>
            <div>
              Progress: <meter value={secondMaxValue} min={0} max={400}></meter>{' '}
              {secondMaxValue +
                ' ' +
                AttributeSymbolMap[secondMaxAttribute] +
                ' / 400'}
            </div>
            <br></br>
            {questCompleted ? <div>YOU WIN!!!</div> : false}
          </li>
        </ol>
        <div>Other goals: WIP</div>
      </div>
    </>
  );
}
