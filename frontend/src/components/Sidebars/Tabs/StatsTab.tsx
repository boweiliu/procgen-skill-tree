import React from 'react';
import { GameState } from '../../../data/GameState';
import {
  Attribute,
  Modifier,
} from '../../../game/worldGen/nodeContents/NodeContentsFactory';
import {
  AttributeDescriptionMap,
  AttributeSymbolMap,
} from '../../../game/worldGen/nodeContents/NodeContentsRendering';
import { enumKeys } from '../../../lib/util/misc';
import { UpdaterGeneratorType2 } from '../../../lib/util/updaterGenerator';

export const StatsTab = React.memo(StatsTabComponent);

// TODO(bowei): trim down the game state here
function StatsTabComponent(props: {
  gameState: GameState;
  updaters: UpdaterGeneratorType2<GameState, GameState>;
}) {
  const { gameState } = props;

  const attributeInfos = Object.fromEntries(
    enumKeys(Attribute).map((attribute) => {
      const desc = AttributeDescriptionMap[attribute];
      const symbol = AttributeSymbolMap[attribute];

      const modifiers = Object.fromEntries(
        enumKeys(Modifier).map((modifier) => {
          const amount = gameState.playerSave.allocationStatusMap
            .entries()
            .map((pair) => {
              const [location, status] = pair;
              if (!status.taken) {
                // skip nodes that are not taken === true
                return 0;
              }

              // look for nodes with attribute
              const nodeContents =
                gameState.worldGen.nodeContentsMap.get(location);
              if (
                nodeContents.lines[0]?.attribute === attribute &&
                nodeContents.lines[0]?.modifier === modifier
              ) {
                return nodeContents.lines[0].amount;
              } else if (
                nodeContents.lines[1]?.attribute === attribute &&
                nodeContents.lines[1]?.modifier === modifier
              ) {
                return nodeContents.lines[1].amount;
              } else {
                return 0;
              }
            })
            .reduce((pv, cv) => pv + cv);

          return [modifier, amount];
        })
      );

      const attributeInfo = (
        <>
          <div>
            {' '}
            {symbol} ({desc}):
          </div>
          <br></br>
          <div>+: {modifiers[Modifier.FLAT]}</div>
          <div>%: {modifiers[Modifier.INCREASED]}</div>
          <div>
            <span style={{ color: '#ffffff00' }}>&nbsp; &nbsp;</span> Total:{' '}
            {Math.round(
              modifiers[Modifier.FLAT] *
                (1 + 0.01 * modifiers[Modifier.INCREASED])
            )}
          </div>
          <br></br>
        </>
      );
      return [attribute, attributeInfo];
    })
  );

  return (
    <>
      <div>Current stats</div>
      <br></br>
      <div className="tab-content-body">
        {attributeInfos[Attribute.RED0]}
        {attributeInfos[Attribute.RED1]}
        {attributeInfos[Attribute.RED2]}
        {attributeInfos[Attribute.DEL0]}
        {attributeInfos[Attribute.DEL1]}
        {attributeInfos[Attribute.DEL2]}
      </div>
    </>
  );
}
