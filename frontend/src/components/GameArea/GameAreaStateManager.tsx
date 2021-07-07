import React, { useCallback, useEffect, useMemo } from 'react';
import { GameState } from '../../data/GameState';
import { NodeTakenStatus } from '../../data/NodeStatus';
import {
  AllocateNodeAction,
  depsAllocateNodeCheckState,
} from '../../game/actions/AllocateNode';
import { DeallocateNodeAction } from '../../game/actions/DeallocateNode';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { NotImplementedError } from '../../lib/util/misc';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import {
  GameAreaGrid,
  extractGameGridSubState,
  depsGameGridSubState,
} from './GameAreaGrid';
import { GameAreaSubState } from './GameAreaInterface';
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
  hexGridPx: Vector2;
  appSize: Vector2;
  updaters: UpdaterGeneratorType2<GameState, GameState>;
  actions: {
    allocateNode: AllocateNodeAction;
    deallocateNode: DeallocateNodeAction;
  };
}) {
  const { gameState, hexGridPx, appSize, virtualGridDims } = props;
  // console.log('GameArea state manager rerender');

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
    (location: Vector3): Vector2 | null => {
      return convertLocationToVirtualCoords({
        location,
        virtualGridDims,
        virtualGridLocation: gameState.playerUI.virtualGridLocation,
      });
    },
    [gameState.playerUI.virtualGridLocation, virtualGridDims]
  );

  // If a node is attempted to be clicked, take its virtual dims and see if that's a valid allocation action
  const handleUpdateNodeStatusByLocation = useCallback(
    (args: {
      nodeLocation: Vector3;
      newStatus: NodeTakenStatus;
      action: 'allocate' | 'deallocate';
    }) => {
      if (args.action === 'allocate') {
        return props.actions.allocateNode.run(args, gameState);
      } else {
        return props.actions.deallocateNode.run(args, gameState);
      }
    },
    // TODO(bowei): use custom hook here so react doesnt complain so much
    // eslint-disable-next-line
    [
      props.actions,
      // TODO(bowei): use custom hook here so react doesnt complain so much
      // eslint-disable-next-line
      ...depsAllocateNodeCheckState(gameState),
    ]
  );

  const handleUpdateNodeStatus = useCallback(
    (args: {
      virtualCoords: Vector2;
      newStatus: NodeTakenStatus;
      action: 'allocate' | 'deallocate';
    }) => {
      const { virtualCoords } = args;

      // console.log({ got: 'here handleUpdateNodeStatus', virtualCoords, newStatus });
      const nodeLocation: Vector3 = virtualCoordsToLocation(virtualCoords);
      handleUpdateNodeStatusByLocation({ nodeLocation, ...args });
    },
    [virtualCoordsToLocation, handleUpdateNodeStatusByLocation]
  );

  // Manage cursor "node selected" state
  const setCursoredLocation = useCallback(
    (v: Vector3 | null) => {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate((prev) => {
        return v;
      });
      if (!!v) {
        // also open the sidebar
        props.updaters.playerUI.isSidebarOpen.enqueueUpdate(() => true);
        props.updaters.playerUI.isLeftSidebarOpen.enqueueUpdate(() => true);
        props.updaters.playerUI.isRightSidebarOpen.enqueueUpdate(() => true);
      }
    },
    [props.updaters]
  );

  const cursoredVirtualNodeCoords: Vector2 | null = useMemo(() => {
    if (gameState.playerUI.cursoredNodeLocation) {
      // console.log({
      //   3: gameState.playerUI.cursoredNodeLocation,
      //   2: locationToVirtualCoords(gameState.playerUI.cursoredNodeLocation),
      // });
      return locationToVirtualCoords(gameState.playerUI.cursoredNodeLocation);
    } else {
      return null;
    }
  }, [gameState.playerUI.cursoredNodeLocation, locationToVirtualCoords]);

  // reset cursor to center at different breakpoints depending on detailed or strategic view
  const cursorHitEdgeCallback = useCallback(() => {
    props.updaters.playerUI.virtualGridLocation.enqueueUpdate(
      (prev, prevGameState) => {
        const cursor = prevGameState.playerUI.cursoredNodeLocation;
        const virtualCenter = prev;
        // strategic view
        if (!prevGameState.playerUI.isPixiHidden) {
          // TODO(bowei): un-hardcode 16 & 32
          if (
            cursor &&
            (Math.abs(cursor.y - virtualCenter.y) >= 16 ||
              Math.abs(
                cursor.x -
                  cursor.y / 2 -
                  (virtualCenter.x - virtualCenter.y / 2)
              ) >= 32)
          ) {
            return cursor;
          }
          return prev;
        } else {
          // detailed view
          // TODO(bowei): un-hardcode 2 & 4
          if (
            cursor &&
            (Math.abs(cursor.y - virtualCenter.y) >= 2 ||
              Math.abs(
                cursor.x -
                  cursor.y / 2 -
                  (virtualCenter.x - virtualCenter.y / 2)
              ) >= 4)
          ) {
            return cursor;
          }
          return prev;
        }
      }
    );
  }, [props.updaters]);

  // manage keyboard wasdezx cusored node navigation
  useEffect(() => {
    // const newIntent = props.gameState.intent.newIntent;
    const newLocation = virtualCoordsToLocation(
      virtualGridDims.divide(2).floor()
    );
    if (props.gameState.intent.newIntent.MOVE_CURSOR_EAST) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate(
        (prev) => prev?.addX(1) || newLocation
      );
      cursorHitEdgeCallback();
    }
    if (props.gameState.intent.newIntent.MOVE_CURSOR_WEST) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate(
        (prev) => prev?.addX(-1) || newLocation
      );
      cursorHitEdgeCallback();
    }
    if (props.gameState.intent.newIntent.MOVE_CURSOR_NORTHEAST) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate(
        (prev) => prev?.add({ x: 1, y: 1, z: 0 }) || newLocation
      );
      cursorHitEdgeCallback();
    }
    if (props.gameState.intent.newIntent.MOVE_CURSOR_NORTHWEST) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate(
        (prev) => prev?.addY(1) || newLocation
      );
      cursorHitEdgeCallback();
    }
    if (props.gameState.intent.newIntent.MOVE_CURSOR_SOUTHEAST) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate(
        (prev) => prev?.addY(-1) || newLocation
      );
      cursorHitEdgeCallback();
    }
    if (props.gameState.intent.newIntent.MOVE_CURSOR_SOUTHWEST) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate(
        (prev) => prev?.add({ x: -1, y: -1, z: 0 }) || newLocation
      );
      cursorHitEdgeCallback();
    }
    if (props.gameState.intent.newIntent.MOVE_CURSOR_SOUTH) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate((prev) => {
        if (prev && prev.y % 2 === 0) {
          return prev?.add({ x: 0, y: -1, z: 0 });
        } else if (prev && prev.y % 2 !== 0) {
          return prev?.add({ x: -1, y: -1, z: 0 });
        } else {
          return newLocation;
        }
      });
      cursorHitEdgeCallback();
    }
    if (props.gameState.intent.newIntent.MOVE_CURSOR_NORTH) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate((prev) => {
        if (prev && prev.y % 2 === 0) {
          return prev?.add({ x: 1, y: 1, z: 0 });
        } else if (prev && prev.y % 2 !== 0) {
          return prev?.add({ x: 0, y: 1, z: 0 });
        } else {
          return newLocation;
        }
      });
      cursorHitEdgeCallback();
    }
    if (props.gameState.intent.newIntent.MOVE_CURSOR_NORTHNORTH) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate(
        (prev) => prev?.add({ x: 1, y: 2, z: 0 }) || newLocation
      );
      cursorHitEdgeCallback();
    }
    if (props.gameState.intent.newIntent.MOVE_CURSOR_SOUTHSOUTH) {
      props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate(
        (prev) => prev?.add({ x: -1, y: -2, z: 0 }) || newLocation
      );
      cursorHitEdgeCallback();
    }
    if (props.gameState.intent.newIntent.INTERACT_WITH_NODE) {
      if (cursoredVirtualNodeCoords) {
        handleUpdateNodeStatus({
          virtualCoords: cursoredVirtualNodeCoords,
          newStatus: { taken: true },
          action: 'allocate',
        });
      }
    }
    if (props.gameState.intent.newIntent.DEALLOCATE_NODE) {
      if (cursoredVirtualNodeCoords) {
        handleUpdateNodeStatus({
          virtualCoords: cursoredVirtualNodeCoords,
          newStatus: { taken: true },
          action: 'deallocate',
        });
      }
    }
  }, [
    props.gameState.intent.newIntent.INTERACT_WITH_NODE,
    props.gameState.intent.newIntent.MOVE_CURSOR_EAST,
    props.gameState.intent.newIntent.MOVE_CURSOR_NORTH,
    props.gameState.intent.newIntent.MOVE_CURSOR_NORTHNORTH,
    props.gameState.intent.newIntent.MOVE_CURSOR_NORTHEAST,
    props.gameState.intent.newIntent.MOVE_CURSOR_NORTHWEST,
    props.gameState.intent.newIntent.MOVE_CURSOR_SOUTH,
    props.gameState.intent.newIntent.MOVE_CURSOR_SOUTHSOUTH,
    props.gameState.intent.newIntent.MOVE_CURSOR_SOUTHEAST,
    props.gameState.intent.newIntent.MOVE_CURSOR_SOUTHWEST,
    props.gameState.intent.newIntent.MOVE_CURSOR_WEST,
    props.gameState.intent.newIntent.DEALLOCATE_NODE,
    props.updaters,
    virtualCoordsToLocation,
    virtualGridDims,
    cursoredVirtualNodeCoords,
    handleUpdateNodeStatus,
    cursorHitEdgeCallback,
  ]);

  useEffect(() => {
    if (props.gameState.intent.newIntent.ZOOM_RECENTER_AT_NODE) {
      const location = gameState.playerUI.cursoredNodeLocation;
      if (location) {
        // set virtual grid location
        props.updaters.playerUI.virtualGridLocation.enqueueUpdate((prev) => {
          return location;
        });

        props.updaters.playerUI.triggerScrollRecenterCb.enqueueUpdate(() => {
          return () => {
            // this is not guaranteed to ever be called
            console.log('zoomed to location: ', { location });
          };
        });
      }
    }
  }, [
    props.gameState.intent.newIntent.ZOOM_RECENTER_AT_NODE,
    gameState.playerUI.cursoredNodeLocation,
    props.updaters,
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

  const infiniteScrollManagerDebug = useMemo(() => {
    return {
      debugShowScrollbars: gameState.debug.debugShowScrollbars,
      enableScrollJump: gameState.debug.enableScrollJump,
      getForceJumpOffset: gameState.debug.getForceJumpOffset,
    };
  }, [
    gameState.debug.debugShowScrollbars,
    gameState.debug.enableScrollJump,
    gameState.debug.getForceJumpOffset,
  ]);

  const gameAreaGridDebug = useMemo(() => {
    return {
      rerenderGameAreaGrid: gameState.debug.rerenderGameAreaGrid,
      getOffsetX: gameState.debug.getOffsetX,
      isFlipCursored: gameState.debug.isFlipCursored,
    };
  }, [
    gameState.debug.rerenderGameAreaGrid,
    gameState.debug.getOffsetX,
    gameState.debug.isFlipCursored,
  ]);

  const subGameState = useMemo(() => {
    return extractGameGridSubState(gameState);
    // TODO(bowei): use custom hook here so react doesnt complain so much
    // eslint-disable-next-line
  }, depsGameGridSubState(gameState));

  return (
    <>
      <InfiniteScrollManager
        hidden={!gameState.playerUI.isPixiHidden}
        appSize={appSize}
        triggerScrollRecenterCb={gameState.playerUI.triggerScrollRecenterCb}
        updaters={props.updaters}
        hexGridPx={hexGridPx}
        virtualGridDims={virtualGridDims}
        keyboardScrollDirection={keyboardScrollDirection}
        debug={infiniteScrollManagerDebug}
      >
        <GameAreaGrid
          gameState={subGameState}
          virtualGridDims={virtualGridDims}
          virtualCoordsToLocation={virtualCoordsToLocation}
          updateNodeStatusByLocationCb={handleUpdateNodeStatusByLocation}
          cursoredVirtualNode={cursoredVirtualNodeCoords}
          setCursoredLocation={setCursoredLocation}
          debug={gameAreaGridDebug}
        />
      </InfiniteScrollManager>
    </>
  );
}
