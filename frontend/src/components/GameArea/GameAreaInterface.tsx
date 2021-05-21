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
import { computeVirtualNodeDataMap } from './computeVirtualNodeDataMap';
import { CssVariablesComponent } from './CssVariables';
import { GameAreaComponent } from './GameAreaGrid';
import {
  locationToVirtualCoords,
  virtualCoordsToLocation,
} from './locationUtils';

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

  return (
    <>
      <CssVariablesComponent appSize={appSize} />
    </>
  );
}
