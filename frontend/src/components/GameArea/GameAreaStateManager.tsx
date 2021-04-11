import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import COLORS, { colorToCss } from '../../pixi/colors';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { appSizeFromWindowSize, GameState } from '../../data/GameState';
import {
  GameAreaComponent,
  NodeAllocatedStatus,
  NodeData,
} from './GameAreaComponent';

export const GameAreaStateManager = React.memo(Component);

/**
 * Approximations for sqrt(3)/2 == ratio of an equilateral triangle's height to its width:
 * 6/7, 13/15, 26/30, 45/52, 58/67, 84/97, 181/209
 * for divisibility -- recommend 26/30, 52/60, 104/120, 168/194, 180/208, 232/268, 336/388
 */
export const hexGridPx = new Vector2(268, 232);

/**
 * How much bigger the "virtual" (i.e. scrollable) game area is than the visible window.
 * Bigger == more elements rendered which are outside the viewport == worse performance,
 * but need to 'jump' the scroll viewport less often.
 * Recommended default is 3.0
 */
export const virtualAreaScaleMultiplier = 3.0;

function Component(props: {
  gameState: GameState;
  children?: React.ReactNode;
}) {
  const { gameState, children } = props;

  const appSize = useMemo(() => {
    return appSizeFromWindowSize(
      new Vector2(
        gameState.windowState.innerWidth,
        gameState.windowState.innerHeight
      )
    );
  }, [gameState.windowState.innerWidth, gameState.windowState.innerHeight]);

  const virtualGridDims = new Vector2(
    Math.floor((appSize.x * virtualAreaScaleMultiplier) / hexGridPx.x - 0.5),
    Math.floor((appSize.y * virtualAreaScaleMultiplier) / hexGridPx.y)
  );

  const virtualGridDataMap = new Map<Vector2, NodeData>();
  const virtualGridStatusMap = new Map<Vector2, NodeAllocatedStatus>();

  for (let row = 0; row < virtualGridDims.x; row++) {
    for (let col = 0; col < virtualGridDims.y; col++) {}
  }

  const triggerJumpCb = (args: { direction: Vector2 }) => {
    // jumpOffset =
  };

  const virtualGridInfo = useMemo(() => {
    return {
      map: virtualGridDataMap,
      jumpOffset: undefined,
    };
  }, [gameState.playerUI.virtualGridLocation]);

  return (
    <>
      <GameAreaComponent
        hidden={!gameState.playerUI.isPixiHidden}
        appSize={appSize}
        virtualGridDims={virtualGridDims}
        virtualGridInfo={virtualGridInfo}
        virtualGridStatusMap={virtualGridStatusMap}
        updateNodeStatusCb={() => {}}
        triggerJumpCb={() => {}}
      />
      {props.children}
    </>
  );
}
