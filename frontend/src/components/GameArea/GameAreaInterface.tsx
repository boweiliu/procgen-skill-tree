import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GameState,
  appSizeFromWindowSize,
  IntentName,
  NodeAllocatedStatus,
} from '../../data/GameState';
import { AllocateNodeAction } from '../../game/actions/AllocateNode';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import COLORS from '../../pixi/colors';
import { computeVirtualNodeDataMap } from './computeVirtualNodeDataMap';
import { CssVariablesComponent } from './CssVariables';
import { GameAreaStateManager } from './GameAreaStateManager';
import { InfiniteScrollManager } from './InfiniteScrollManager';
import {
  locationToVirtualCoords,
  virtualCoordsToLocation,
} from './locationUtils';

/**
 * Approximations for sqrt(3)/2 == ratio of an equilateral triangle's height to its width:
 * 6/7, 13/15, 26/30, 45/52, 58/67, 84/97, 181/209
 * for divisibility -- recommend 26/30, 52/60, 104/120, 168/194, 180/208, 232/268, 336/388
 */
export const hexGridPx = new Vector2(268, 232);

export const hexCenterRadius = 48; // Radius of the circles representing allocatable nodes, in px

export const borderWidth = 2; // border of circles, etc. in px

/**
 * How much bigger the "virtual" (i.e. scrollable) game area is than the visible window.
 * Bigger == more elements rendered which are outside the viewport == worse performance,
 * but need to 'jump' the scroll viewport less often.
 * Recommended default is 3.0
 */
export const virtualAreaScaleMultiplier = 3.0;

const gameState: GameState = {} as any;
export type GameAreaSubState = {
  playerUI: {
    virtualGridLocation: typeof gameState.playerUI.virtualGridLocation;
    cursoredNodeLocation: typeof gameState.playerUI.cursoredNodeLocation;
    isPixiHidden: typeof gameState.playerUI.isPixiHidden;
  };
  playerSave: {
    allocationStatusMap: typeof gameState.playerSave.allocationStatusMap;
  };
  worldGen: {
    nodeContentsMap: typeof gameState.worldGen.nodeContentsMap;
    lockMap: typeof gameState.worldGen.lockMap;
  };
  computed: {
    fogOfWarStatusMap: typeof gameState.computed.fogOfWarStatusMap;
    lockStatusMap: typeof gameState.computed.lockStatusMap;
  };
  intent: typeof gameState.intent;
};

export const GameAreaInterface = React.memo(Component);
function Component(props: {
  gameState: GameState;
  updaters: UpdaterGeneratorType2<GameState, GameState>;
  actions: { allocateNode: AllocateNodeAction };
}) {
  const { gameState } = props;

  const appSize = useMemo(() => {
    return appSizeFromWindowSize(
      new Vector2(
        gameState.windowState.innerWidth,
        gameState.windowState.innerHeight
      )
    );
  }, [gameState.windowState.innerWidth, gameState.windowState.innerHeight]);

  const virtualGridDims = useMemo(() => {
    let x = Math.floor(
      (appSize.x * virtualAreaScaleMultiplier) / hexGridPx.x - 0.5
    );
    let y = Math.floor((appSize.y * virtualAreaScaleMultiplier) / hexGridPx.y);

    // y = (Math.floor((y - 1) / 2) * 2) + 1; // force y to be odd

    // needs to be at least 3.8 x 4.8 so we have room for jumps
    // x = Math.max(4, x);
    // y = Math.max(5, y);

    return new Vector2(x, y);
  }, [appSize, virtualAreaScaleMultiplier, hexGridPx]);

  const subGameState: GameAreaSubState = useMemo(() => {
    return {
      playerUI: {
        virtualGridLocation: gameState.playerUI.virtualGridLocation,
        cursoredNodeLocation: gameState.playerUI.cursoredNodeLocation,
        isPixiHidden: gameState.playerUI.isPixiHidden,
      },
      playerSave: {
        allocationStatusMap: gameState.playerSave.allocationStatusMap,
      },
      worldGen: {
        nodeContentsMap: gameState.worldGen.nodeContentsMap,
        lockMap: gameState.worldGen.lockMap,
      },
      computed: {
        fogOfWarStatusMap: gameState.computed.fogOfWarStatusMap,
        lockStatusMap: gameState.computed.lockStatusMap,
      },
      intent: gameState.intent,
    };
  }, [
    gameState.playerUI.virtualGridLocation,
    gameState.playerUI.cursoredNodeLocation,
    gameState.playerUI.isPixiHidden,
    gameState.playerSave.allocationStatusMap,
    gameState.worldGen.nodeContentsMap,
    gameState.worldGen.lockMap,
    gameState.computed.fogOfWarStatusMap,
    gameState.computed.lockStatusMap,
    gameState.intent,
  ]);

  return (
    <>
      <CssVariablesComponent
        appSize={appSize}
        hexCenterRadius={hexCenterRadius}
        hexGridPx={hexGridPx}
        borderWidth={borderWidth}
        COLORS={COLORS}
      />
      <GameAreaStateManager
        appSize={appSize}
        gameState={subGameState}
        updaters={props.updaters}
        actions={props.actions}
      />
    </>
  );
}
