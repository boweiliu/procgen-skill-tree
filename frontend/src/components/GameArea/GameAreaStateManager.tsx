import React, { useCallback, useEffect, useMemo } from 'react';
import {
  GameState,
  IntentName,
  NodeAllocatedStatus,
} from '../../data/GameState';
import { AllocateNodeAction } from '../../game/actions/AllocateNode';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import { computeVirtualNodeDataMap } from './computeVirtualNodeDataMap';
import { GameAreaGrid } from './GameAreaGrid';
import { GameAreaSubState, hexGridPx } from './GameAreaInterface';
import { InfiniteScrollManager } from './InfiniteScrollManager';
import {
  convertLocationToVirtualCoords,
  convertVirtualCoordsToLocation,
} from './locationUtils';

/**
 * Wrapper for GameAreaGrid that manages game state location <> virtual coord conversions, as well as populating the onClick/onSelect callbacks when interacting with nodes.
 * @param virtualGridDims integer vector for # of grid cells in each dimension
 * @param appSize the playable area
 */
export const GameAreaStateManager = React.memo(Component);
function Component(props: {
  gameState: GameAreaSubState;
  virtualGridDims: Vector2;
  appSize: Vector2;
  updaters: UpdaterGeneratorType2<GameState, GameState>;
  actions: { allocateNode: AllocateNodeAction };
}) {
  const { gameState, appSize, virtualGridDims } = props;
  // console.log("GameArea state manager rerender");

  // Compute some helpful coordinate to location conversions. These MUST be recomputed every time virtualGridLocation changes
  const virtualCoordsToLocation = useCallback(
    (virtualCoords: Vector2): Vector3 => {
      return convertVirtualCoordsToLocation({
        virtualCoords,
        virtualGridDims,
        virtualGridLocation: gameState.playerUI.virtualGridLocation,
      });
    },
    [gameState.playerUI.virtualGridLocation, virtualGridDims]
  );
  const locationToVirtualCoords = useCallback(
    (location: Vector3): Vector2 | undefined => {
      return convertLocationToVirtualCoords({
        location,
        virtualGridDims,
        virtualGridLocation: gameState.playerUI.virtualGridLocation,
      });
    },
    [gameState.playerUI.virtualGridLocation, virtualGridDims]
  );

  // Hydrate the contents of all the nodes
  const virtualNodeDataMap = useMemo(() => {
    return computeVirtualNodeDataMap({
      allocationStatusMap: gameState.playerSave.allocationStatusMap,
      nodeContentsMap: gameState.worldGen.nodeContentsMap,
      lockMap: gameState.worldGen.lockMap,
      fogOfWarStatusMap: gameState.computed.fogOfWarStatusMap,
      virtualGridDims,
      virtualCoordsToLocation,
    });
  }, [
    gameState.playerSave.allocationStatusMap,
    gameState.worldGen.nodeContentsMap,
    gameState.worldGen.lockMap,
    gameState.computed.fogOfWarStatusMap,
    virtualGridDims,
    virtualCoordsToLocation,
  ]);

  // If a node is attempted to be clicked, take its virtual dims and see if that's a valid allocation action
  const handleUpdateNodeStatus = useCallback(
    (args: { virtualCoords: Vector2; newStatus: NodeAllocatedStatus }) => {
      const { virtualCoords, newStatus } = args;

      // console.log({ got: 'here handleUpdateNodeStatus' });
      const nodeLocation: Vector3 = virtualCoordsToLocation(virtualCoords);
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

      if (
        gameState.playerSave.allocationStatusMap.get(nodeLocation) !==
        NodeAllocatedStatus.TAKEN
      ) {
        props.actions.allocateNode.enqueueAction({
          nodeLocation,
          newStatus: NodeAllocatedStatus.TAKEN,
        });
      }
    },
    [
      props.updaters,
      props.actions,
      virtualCoordsToLocation,
      gameState.playerSave.allocationStatusMap,
      gameState.computed.fogOfWarStatusMap,
      gameState.computed.lockStatusMap,
      gameState.worldGen.lockMap,
    ]
  );

  // Manage cursor "node selected" state
  const cursoredVirtualNodeCoords: Vector2 | undefined = useMemo(() => {
    if (gameState.playerUI.cursoredNodeLocation) {
      // console.log({
      //   3: gameState.playerUI.cursoredNodeLocation,
      //   2: locationToVirtualCoords(gameState.playerUI.cursoredNodeLocation),
      // });
      return locationToVirtualCoords(gameState.playerUI.cursoredNodeLocation);
    } else {
      return undefined;
    }
  }, [gameState.playerUI.cursoredNodeLocation, locationToVirtualCoords]);

  const setCursoredVirtualNode = useCallback(
    (v: Vector2 | undefined) => {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate((prev) => {
        let updated = v ? virtualCoordsToLocation(v) : undefined;
        console.log({ updated });
        return updated;
      });
      if (!!v) {
        // also open the sidebar
        props.updaters.playerUI.isSidebarOpen.enqueueUpdate(() => true);
      }
    },
    [props.updaters, virtualCoordsToLocation]
  );

  // manage keyboard wasdezx cusored node navigation
  useEffect(() => {
    const newIntent = props.gameState.intent.newIntent;
    const newLocation = virtualCoordsToLocation(
      virtualGridDims.divide(2).floor()
    );
    if (newIntent[IntentName.MOVE_CURSOR_EAST]) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate(
        (prev) => prev?.addX(1) || newLocation
      );
    }
    if (newIntent[IntentName.MOVE_CURSOR_WEST]) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate(
        (prev) => prev?.addX(-1) || newLocation
      );
    }
    if (newIntent[IntentName.MOVE_CURSOR_NORTHEAST]) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate(
        (prev) => prev?.add({ x: 1, y: 1, z: 0 }) || newLocation
      );
    }
    if (newIntent[IntentName.MOVE_CURSOR_NORTHWEST]) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate(
        (prev) => prev?.addY(1) || newLocation
      );
    }
    if (newIntent[IntentName.MOVE_CURSOR_SOUTHEAST]) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate(
        (prev) => prev?.addY(-1) || newLocation
      );
    }
    if (newIntent[IntentName.MOVE_CURSOR_SOUTHWEST]) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate(
        (prev) => prev?.add({ x: -1, y: -1, z: 0 }) || newLocation
      );
    }
    if (newIntent[IntentName.MOVE_CURSOR_SOUTH]) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate((prev) => {
        if (prev && prev.y % 2 === 0) {
          return prev?.add({ x: 0, y: -1, z: 0 });
        } else if (prev && prev.y % 2 !== 0) {
          return prev?.add({ x: -1, y: -1, z: 0 });
        } else {
          return newLocation;
        }
      });
    }
    if (newIntent[IntentName.MOVE_CURSOR_NORTH]) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate((prev) => {
        if (prev && prev.y % 2 === 0) {
          return prev?.add({ x: 1, y: 1, z: 0 });
        } else if (prev && prev.y % 2 !== 0) {
          return prev?.add({ x: 0, y: 1, z: 0 });
        } else {
          return newLocation;
        }
      });
    }
    if (newIntent[IntentName.INTERACT_WITH_NODE]) {
      if (cursoredVirtualNodeCoords) {
        handleUpdateNodeStatus({
          virtualCoords: cursoredVirtualNodeCoords,
          newStatus: NodeAllocatedStatus.TAKEN,
        });
      }
    }
  }, [
    props.gameState.intent.newIntent.INTERACT_WITH_NODE,
    props.gameState.intent.newIntent.MOVE_CURSOR_EAST,
    props.gameState.intent.newIntent.MOVE_CURSOR_NORTH,
    props.gameState.intent.newIntent.MOVE_CURSOR_NORTHEAST,
    props.gameState.intent.newIntent.MOVE_CURSOR_NORTHWEST,
    props.gameState.intent.newIntent.MOVE_CURSOR_SOUTH,
    props.gameState.intent.newIntent.MOVE_CURSOR_SOUTHEAST,
    props.gameState.intent.newIntent.MOVE_CURSOR_SOUTHWEST,
    props.gameState.intent.newIntent.MOVE_CURSOR_WEST,
    props.updaters,
    virtualCoordsToLocation,
    virtualGridDims,
    cursoredVirtualNodeCoords,
    handleUpdateNodeStatus,
  ]);

  // Manage keyboard scrolling here
  // TODO(bowei): move this into infinite scroll manager. the only reason this is here is because we have access to intent object conveniently here
  const keyboardScrollDirection: Vector2 = useMemo(() => {
    let direction = Vector2.Zero;
    if (props.gameState.intent.activeIntent.PAN_EAST) {
      direction = direction.addX(1);
    }
    if (props.gameState.intent.activeIntent.PAN_WEST) {
      direction = direction.addX(-1);
    }
    if (props.gameState.intent.activeIntent.PAN_NORTH) {
      direction = direction.addY(1);
    }
    if (props.gameState.intent.activeIntent.PAN_SOUTH) {
      direction = direction.addY(-1);
    }
    return direction;
  }, [
    props.gameState.intent.activeIntent.PAN_EAST,
    props.gameState.intent.activeIntent.PAN_WEST,
    props.gameState.intent.activeIntent.PAN_NORTH,
    props.gameState.intent.activeIntent.PAN_SOUTH,
  ]);

  return (
    <>
      <InfiniteScrollManager
        hidden={!gameState.playerUI.isPixiHidden}
        appSize={appSize}
        updaters={props.updaters}
        hexGridPx={hexGridPx}
        virtualGridDims={virtualGridDims}
        keyboardScrollDirection={keyboardScrollDirection}
      >
        <GameAreaGrid
          virtualGridDims={virtualGridDims}
          virtualNodeDataMap={virtualNodeDataMap}
          virtualCoordsToLocation={virtualCoordsToLocation}
          updateNodeStatusCb={handleUpdateNodeStatus}
          cursoredVirtualNode={cursoredVirtualNodeCoords}
          setCursoredVirtualNode={setCursoredVirtualNode}
        />
      </InfiniteScrollManager>
    </>
  );
}
