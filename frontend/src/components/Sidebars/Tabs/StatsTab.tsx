import React, { useMemo, useState } from 'react';
import { GameState } from '../../../data/GameState';
import { CURRENT_ERA } from '../../../game/actions/AllocateNode';
import {
  Attribute,
  Modifier,
} from '../../../game/worldGen/nodeContents/NodeContentsFactory';
import {
  AttributeDescriptionMap,
  AttributeSymbolMap,
} from '../../../game/worldGen/nodeContents/NodeContentsRendering';
import {
  enumAssociateBy,
  enumMapValues,
  extractDeps,
} from '../../../lib/util/misc';
import { UpdaterGeneratorType2 } from '../../../lib/util/updaterGenerator';

export function StatsTab(props: {
  gameState: GameState;
  updaters: UpdaterGeneratorType2<GameState, GameState>;
}) {
  const gameState = useMemo(() => {
    return extractStatsSubState(props.gameState);
    // TODO(bowei): use custom hook here so react doesnt complain so much
    // eslint-disable-next-line
  }, depsStatsSubState(props.gameState));

  return <StatsTabHelper gameState={gameState} updaters={props.updaters} />;
}

/**
 * The subset of the game state that is relevant to game area components.
 */
export function extractStatsSubState(g: StatsSubState) {
  return _extract(g as GameState);
}

export function _extract(gameState: GameState) {
  return {
    playerSave: {
      allocationStatusMap: gameState.playerSave.allocationStatusMap,
      bookmarkedStatusMap: gameState.playerSave.bookmarkedStatusMap,
    },
    worldGen: {
      nodeContentsMap: gameState.worldGen.nodeContentsMap,
    },
  };
}
export type StatsSubState = ReturnType<typeof _extract>;
export const depsStatsSubState = extractDeps(extractStatsSubState);

const StatsTabHelper = React.memo(StatsTabComponent);
// TODO(bowei): trim down the game state here
function StatsTabComponent(props: {
  gameState: StatsSubState;
  updaters: UpdaterGeneratorType2<GameState, GameState>;
}) {
  const { gameState } = props;

  const [isOpen, setOpen] = useState(false);

  const attributeInfos = enumMapValues(
    computeAttributeModifierStats({ gameState }),
    ({ modifiers, total }, attribute) => {
      const desc = AttributeDescriptionMap[attribute];
      const symbol = AttributeSymbolMap[attribute];
      return (
        <>
          <details className="details" open={isOpen}>
            <summary>
              {' '}
              {symbol} ({desc}):
            </summary>
            <div className="details-body">
              <div>+: {modifiers[Modifier.FLAT]}</div>
              <div>%: {modifiers[Modifier.INCREASED]}</div>
              <div className="final-total">Total: {total}</div>
            </div>
          </details>
        </>
      );
    }
  );

  return (
    <>
      <div>Current stats</div>
      <br></br>
      <div>
        <button
          onClick={() => {
            setOpen(true);
          }}
        >
          Open all
        </button>{' '}
        <button
          onClick={() => {
            setOpen(false);
          }}
        >
          Close all
        </button>
      </div>
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

export function computeAttributeModifierStats(args: {
  gameState: StatsSubState;
}) {
  const { gameState } = args;

  const attributeInfos = enumAssociateBy(Attribute, (attribute) => {
    // const modifiers: {[k in keyof typeof Modifier]: number} = fromEnumEntries(
    const modifiers = enumAssociateBy(Modifier, (modifier) => {
      // find all allocated && bookmarked nodes
      let nodes = gameState.playerSave.allocationStatusMap
        .entries()
        .filter(([location, status]) => {
          return status.taken === true;
        })
        .map((it) => it[0]);

      if (CURRENT_ERA.type === 'A') {
        nodes = nodes.concat(
          gameState.playerSave.bookmarkedStatusMap
            .entries()
            .filter(([location, status]) => {
              return status.bookmarked === true;
            })
            .map((it) => it[0])
        );
      }

      const amount = nodes
        .map((location) => {
          // look for nodes with attribute
          const nodeContents = gameState.worldGen.nodeContentsMap.get(location);
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
    });

    const total = Math.round(
      modifiers[Modifier.FLAT] * (1 + 0.01 * modifiers[Modifier.INCREASED])
    );
    return [attribute, { modifiers, total }];
  });

  return attributeInfos;
}
