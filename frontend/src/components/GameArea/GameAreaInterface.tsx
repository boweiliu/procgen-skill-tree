import React, { useMemo } from 'react';
import { GameState } from '../../data/GameState';
import { appSizeFromWindowSize } from '../../data/WindowState';
import { AllocateNodeAction } from '../../game/actions/AllocateNode';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { extractDeps } from '../../lib/util/misc';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import COLORS from '../../pixi/colors';
import { UiScale } from '../../pixi/textures/SimpleTextures';
import { CssVariablesComponent } from './CssVariables';
import { GameAreaStateManager } from './GameAreaStateManager';

/**
 * Approximations for sqrt(3)/2 == ratio of an equilateral triangle's height to its width:
 * 6/7, 13/15 (*), 26/30, 45/52, 58/67, 84/97 (*), 97/112, 181/209 (*)
 * for divisibility -- recommend 19/22, 26/30, 52/60, 78/90, 104/120, 168/194, 180/208, 232/268, 336/388
 */
// export const hexGridPx = new Vector2(268, 232);
// export const hexGridPx = new Vector2(194, 168);
// export const hexGridPx = new Vector2(120, 104);
// export const hexGridPx = new Vector2(97, 84);
// export const hexGridPx = new Vector2(75, 65); // TODO(bowei): change text font size to xx-small

// export const hexCenterRadius = 64; // Radius of the circles representing allocatable nodes, in px
// export const hexCenterRadius = 44; // Radius of the circles representing allocatable nodes, in px
// export const hexCenterRadius = Math.round(hexGridPx.x / 16 - 0.025) * 4; // Radius of the circles representing allocatable nodes, in px

// export const borderWidth = hexGridPx.x > 100 ? 2 : 1; // border of circles, etc. in px

/**
 * How much bigger the "virtual" (i.e. scrollable) game area is than the visible window.
 * Bigger == more elements rendered which are outside the viewport == worse performance,
 * but need to 'jump' the scroll viewport less often.
 * Recommended default is 3.0
 */
export const virtualAreaScaleMultiplier = 2.0;

/**
 * The subset of the game state that is relevant to game area components.
 */
export function extractGameAreaSubState(gameState: GameState) {
  return {
    playerUI: {
      virtualGridLocation: gameState.playerUI.virtualGridLocation,
      cursoredNodeLocation: gameState.playerUI.cursoredNodeLocation,
      isPixiHidden: gameState.playerUI.isPixiHidden,
      triggerScrollRecenterCb: gameState.playerUI.triggerScrollRecenterCb,
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
      reachableStatusMap: gameState.computed.reachableStatusMap,
      lockStatusMap: gameState.computed.lockStatusMap,
    },
    intent: gameState.intent,
    debug: {
      debugShowScrollbars: gameState.debug.debugShowScrollbars,
      rerenderGameAreaGrid: gameState.debug.rerenderGameAreaGrid,
      enableScrollJump: gameState.debug.enableScrollJump,
      getForceJumpOffset: gameState.debug.getForceJumpOffset,
      getOffsetX: gameState.debug.getOffsetX,
      isFlipCursored: gameState.debug.isFlipCursored,
    },
  };
}
export type GameAreaSubState = ReturnType<typeof extractGameAreaSubState>;
export const depsGameAreaSubState = extractDeps(extractGameAreaSubState);

/**
 * Handles managing constants (settings) as well as pruning down game state and updaters to what is actually relevant.
 * Helps with memoization as well.
 */
export function GameAreaInterface(props: {
  gameState: GameState;
  updaters: UpdaterGeneratorType2<GameState, GameState>;
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

  // TODO(bowei): programmatically determine UI scale based on app size
  const uiScale: UiScale = useMemo(() => {
    if (appSize.x > 1920) {
      return 'large';
    } else if (appSize.x > 1080) {
      return 'medium';
    } else {
      return 'small';
    }
  }, [appSize]);
  const hexGridPx = useMemo(() => {
    if (uiScale === 'large') {
      return new Vector2(268, 232);
      // return new Vector2(194, 168);
    } else if (uiScale === 'medium') {
      return new Vector2(120, 104);
    } else {
      // return new Vector2(97, 84);
      return new Vector2(75, 65); // TODO(bowei): change text font size to xx-small
    }
  }, [uiScale]);

  const hexCenterRadius = useMemo(() => {
    return Math.round(hexGridPx.x / 16 - 0.025) * 4; // Radius of the circles representing allocatable nodes, in px
  }, [hexGridPx]);

  const borderWidth = useMemo(() => {
    return hexGridPx.x > 100 ? 2 : 1; // border of circles, etc. in px
  }, [hexGridPx]);

  const onDebugRetrigger = gameState.debug.retriggerVirtualGridDims; // triggered from debug tab to check performance
  const virtualGridDims = useMemo(() => {
    onDebugRetrigger();

    let x = Math.floor(
      (appSize.x * virtualAreaScaleMultiplier) / hexGridPx.x - 0.5
    );
    let y = Math.floor((appSize.y * virtualAreaScaleMultiplier) / hexGridPx.y);

    // y = (Math.floor((y - 1) / 2) * 2) + 1; // force y to be odd

    // needs to be at least 3.8 x 4.8 so we have room for jumps
    // x = Math.max(4, x);
    // y = Math.max(5, y);

    return new Vector2(x, y);
  }, [appSize, onDebugRetrigger, hexGridPx]);

  const subGameState: GameAreaSubState = useMemo(() => {
    return extractGameAreaSubState(gameState);
    // TODO(bowei): use custom hook here so react doesnt complain so much
    // eslint-disable-next-line
  }, depsGameAreaSubState(gameState));

  // TODO(bowei): improve this abstraction??
  const actions = useMemo(() => {
    return { allocateNode: new AllocateNodeAction(props.updaters) };
  }, [props.updaters]);

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
        virtualGridDims={virtualGridDims}
        hexGridPx={hexGridPx}
        gameState={subGameState}
        updaters={props.updaters}
        actions={actions}
      />
    </>
  );
}
