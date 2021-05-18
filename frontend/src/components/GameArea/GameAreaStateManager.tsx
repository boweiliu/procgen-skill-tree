import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GameState,
  appSizeFromWindowSize,
  IntentName,
} from '../../data/GameState';
import { AllocateNodeAction } from '../../game/actions/AllocateNode';
import {
  AttributeSymbolMap,
  nodeContentsLineToString,
  nodeContentsConditionToString,
} from '../../game/worldGen/nodeContents/NodeContentsRendering';
import { KeyedHashMap } from '../../lib/util/data_structures/hash';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import {
  computeVirtualNodeDataMap,
  NodeReactData,
} from './computeVirtualNodeDataMap';
import {
  GameAreaComponent,
  LockStatus,
  NodeAllocatedStatus,
} from './GameAreaComponent';
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

/**
 * How much bigger the "virtual" (i.e. scrollable) game area is than the visible window.
 * Bigger == more elements rendered which are outside the viewport == worse performance,
 * but need to 'jump' the scroll viewport less often.
 * Recommended default is 3.0
 */
export const virtualAreaScaleMultiplier = 3.0;

export const GameAreaStateManager = React.memo(Component);
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

  const [jumpOffset, setJumpOffset] = useState(new Vector2(0, 0));

  const virtualGridDims = useMemo(() => {
    return new Vector2(
      // needs to be at least 3.8 x 4.8 so we have room for jumps
      Math.max(
        4,
        Math.floor((appSize.x * virtualAreaScaleMultiplier) / hexGridPx.x - 0.5)
      ),
      Math.max(
        5,
        Math.floor((appSize.y * virtualAreaScaleMultiplier) / hexGridPx.y)
      )
    );
  }, [appSize, virtualAreaScaleMultiplier, hexGridPx]);

  const virtualDimsToLocation = useCallback(
    (virtualCoords: Vector2): Vector3 => {
      return virtualCoordsToLocation({
        virtualCoords,
        virtualGridDims,
        virtualGridLocation: gameState.playerUI.virtualGridLocation,
      });
    },
    [gameState.playerUI.virtualGridLocation, virtualGridDims]
  );
  const locationToVirtualDims = useCallback(
    (location: Vector3): Vector2 | undefined => {
      return locationToVirtualCoords({
        location,
        virtualGridDims,
        virtualGridLocation: gameState.playerUI.virtualGridLocation,
      });
    },
    [gameState.playerUI.virtualGridLocation, virtualGridDims]
  );

  const virtualGridStatusMap = useMemo(
    () =>
      computeVirtualNodeDataMap({
        allocationStatusMap: gameState.playerSave.allocationStatusMap,
        nodeContentsMap: gameState.worldGen.nodeContentsMap,
        lockMap: gameState.worldGen.lockMap,
        fogOfWarStatusMap: gameState.computed.fogOfWarStatusMap,
        virtualGridDims,
        virtualDimsToLocation,
      }),
    [
      gameState.playerSave.allocationStatusMap,
      gameState.worldGen.nodeContentsMap,
      gameState.worldGen.lockMap,
      gameState.computed.fogOfWarStatusMap,
      virtualGridDims,
      virtualDimsToLocation,
    ]
  );

  const handleJump = useCallback(
    (args: { direction: Vector2 }) => {
      // direction: if we hit bottom right of screen, direction == (1,1)
      // console.log({ direction: args.direction });
      let jumpAmounts = virtualGridDims.multiply(0.35).floor();
      jumpAmounts = jumpAmounts.withY(Math.floor(jumpAmounts.y / 2) * 2);
      jumpAmounts = jumpAmounts
        .clampX(1, virtualGridDims.x - 1)
        .clampY(2, Math.floor((virtualGridDims.y - 1) / 2) * 2);
      const jumpOffset = jumpAmounts.multiply(args.direction);
      console.log({ jumpOffset });
      props.updaters.playerUI.virtualGridLocation.enqueueUpdate((it) => {
        return it
          .addX(jumpOffset.x)
          .add(new Vector3(-1, -2, 0).multiply(jumpOffset.y / 2));
      });
      setJumpOffset(jumpOffset.multiply(1));
    },
    [virtualGridDims]
  );

  const handleUpdateNodeStatus = useCallback(
    (args: { virtualDims: Vector2; newStatus: NodeAllocatedStatus }) => {
      // console.log({ got: 'here' });
      const { virtualDims, newStatus } = args;
      const nodeLocation: Vector3 = virtualDimsToLocation(virtualDims);
      const prevStatus =
        gameState.computed.fogOfWarStatusMap?.get(nodeLocation) ||
        NodeAllocatedStatus.HIDDEN;
      if (newStatus === NodeAllocatedStatus.TAKEN) {
        if (prevStatus !== NodeAllocatedStatus.AVAILABLE) {
          console.log('cant do that', prevStatus);
          return;
        }
        const maybeLock = gameState.worldGen.lockMap.get(nodeLocation);
        if (!!maybeLock) {
          console.log('is locked', maybeLock);
          return;
        }
      }

      props.actions.allocateNode.enqueueAction({
        nodeLocation,
        newStatus: NodeAllocatedStatus.TAKEN,
      });
    },
    [
      props.updaters,
      virtualDimsToLocation,
      gameState.playerSave.allocationStatusMap,
      gameState.computed.fogOfWarStatusMap,
      gameState.computed.lockStatusMap,
      gameState.worldGen.lockMap,
    ]
  );

  const cursoredVirtualNodeCoords: Vector2 | undefined = useMemo(() => {
    if (gameState.playerUI.cursoredNodeLocation) {
      console.log({
        3: gameState.playerUI.cursoredNodeLocation,
        2: locationToVirtualDims(gameState.playerUI.cursoredNodeLocation),
      });
      return locationToVirtualDims(gameState.playerUI.cursoredNodeLocation);
    } else {
      return undefined;
    }
  }, [gameState.playerUI.cursoredNodeLocation, locationToVirtualDims]);

  const setCursoredVirtualNode = useCallback(
    (v: Vector2 | undefined) => {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate((prev) => {
        let updated = v ? virtualDimsToLocation(v) : undefined;
        console.log({ updated });
        return updated;
      });
    },
    [props.updaters, virtualDimsToLocation]
  );

  // manage keyboard wasdezx navigation
  useEffect(() => {
    const newIntent = props.gameState.intent.newIntent;
    if (newIntent[IntentName.MOVE_CURSOR_EAST]) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate((prev) =>
        prev?.addX(1)
      );
    }
    if (newIntent[IntentName.MOVE_CURSOR_WEST]) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate((prev) =>
        prev?.addX(-1)
      );
    }
    if (newIntent[IntentName.MOVE_CURSOR_NORTHEAST]) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate((prev) =>
        prev?.add({ x: 1, y: 1, z: 0 })
      );
    }
    if (newIntent[IntentName.MOVE_CURSOR_NORTHWEST]) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate((prev) =>
        prev?.addY(1)
      );
    }
    if (newIntent[IntentName.MOVE_CURSOR_SOUTHEAST]) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate((prev) =>
        prev?.addY(-1)
      );
    }
    if (newIntent[IntentName.MOVE_CURSOR_SOUTHWEST]) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate((prev) =>
        prev?.add({ x: -1, y: -1, z: 0 })
      );
    }
  }, [props.gameState.intent.newIntent, props.updaters]);

  return (
    <>
      <GameAreaComponent
        hidden={!gameState.playerUI.isPixiHidden}
        appSize={appSize}
        // intent={gameState.intent}
        virtualGridDims={virtualGridDims}
        jumpOffset={jumpOffset}
        virtualGridStatusMap={virtualGridStatusMap}
        virtualDimsToLocation={virtualDimsToLocation}
        updateNodeStatusCb={handleUpdateNodeStatus}
        onJump={handleJump}
        cursoredVirtualNode={cursoredVirtualNodeCoords}
        setCursoredVirtualNode={setCursoredVirtualNode}
      />
    </>
  );
}
