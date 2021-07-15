import React, { useCallback, useMemo } from 'react';
import { GameState } from '../../../data/GameState';
import { LockStatus, NodeTakenStatus } from '../../../data/NodeStatus';
import {
  AllocateNodeAction,
  depsAllocateNodeCheckState,
  extractAllocateNodeCheckState,
} from '../../../game/actions/AllocateNode';
import {
  DeallocateNodeAction,
  depsDeallocateNodeCheckState,
  extractDeallocateNodeCheckState,
} from '../../../game/actions/DeallocateNode';
import { Vector2 } from '../../../lib/util/geometry/vector2';
import { Vector3 } from '../../../lib/util/geometry/vector3';
import { UpdaterGeneratorType2 } from '../../../lib/util/updaterGenerator';
import {
  nodeContentsToDom,
  STARTING_NODE_DESCRIPTION,
} from '../../GameArea/computeVirtualNodeDataMap';

export const SelectedNodeTabContent = React.memo(
  SelectedNodeTabContentComponent
);

// TODO(bowei): trim down the game state here
function SelectedNodeTabContentComponent(props: {
  gameState: GameState;
  updaters: UpdaterGeneratorType2<GameState, GameState>;
  actions: {
    allocateNode: AllocateNodeAction;
    deallocateNode: DeallocateNodeAction;
  };
}) {
  const { gameState } = props;
  const location = gameState.playerUI.cursoredNodeLocation;

  // TODO(bowei): use custom hooks for onAllocate/canAllocate paradigm

  const allocateNodeCheckState = useMemo(() => {
    return extractAllocateNodeCheckState(gameState);
    // TODO(bowei): use custom hook here so react doesnt complain so much
    // eslint-disable-next-line
  }, depsAllocateNodeCheckState(gameState));

  const deallocateNodeCheckState = useMemo(() => {
    return extractDeallocateNodeCheckState(gameState);
    // TODO(bowei): use custom hook here so react doesnt complain so much
    // eslint-disable-next-line
  }, depsDeallocateNodeCheckState(gameState));

  const onAllocate = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (location) {
        props.actions.allocateNode.run(
          {
            nodeLocation: location,
            newStatus: NodeTakenStatus.true,
          },
          allocateNodeCheckState
        );
      }
    },
    [props.actions.allocateNode, location, allocateNodeCheckState]
  );

  const canBeAllocated = useMemo(() => {
    if (location) {
      return AllocateNodeAction.checkAction(
        { nodeLocation: location, newStatus: { taken: true } },
        allocateNodeCheckState
      );
    }
  }, [location, allocateNodeCheckState]);

  const onDeallocate = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (location) {
        props.actions.deallocateNode.run(
          { nodeLocation: location },
          deallocateNodeCheckState
        );
      }
    },
    [props.actions.deallocateNode, location, deallocateNodeCheckState]
  );

  const canBeDeallocated = useMemo(() => {
    if (location) {
      return DeallocateNodeAction.checkAction(
        { nodeLocation: location },
        deallocateNodeCheckState
      );
    }
  }, [location, deallocateNodeCheckState]);

  const onZoom = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
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
    },
    [props.updaters, location]
  );

  if (location === null) {
    return (
      <>
        <div>Nothing selected!</div>
        <div>
          <br></br>
        </div>
        <div>Hover and click the</div>
        <div> question mark tooltip to</div>
        <div>select a node.</div>
      </>
    );
  }
  let xyCoords = new Vector2(
    location.x - location.y / 2,
    (location.y * Math.sqrt(3)) / 2
  );
  xyCoords = new Vector2(
    Math.round(xyCoords.x * 100) / 100,
    Math.round(xyCoords.y * 100) / 100
  );

  const takenStatus =
    gameState.playerSave.allocationStatusMap?.get(location)?.taken || false;
  const bookmarkedStatus =
    gameState.playerSave.bookmarkedStatusMap?.get(location)?.bookmarked ||
    false;
  const exploredStatus =
    gameState.playerSave.exploredStatusMap?.get(location)?.explored || false;
  const reachableStatus =
    gameState.computed.reachableStatusMap?.get(location)?.reachable || false;
  const visibleStatus =
    gameState.computed.fogOfWarStatusMap?.get(location) || 'obscured';
  const accessibleStatus =
    gameState.computed.accessibleStatusMap?.get(location)?.accessible || false;
  const lockData = visibleStatus
    ? gameState.worldGen.lockMap?.get(location) || null
    : null;
  const lockStatus = gameState.computed.lockStatusMap?.get(location) || null;
  const isLocked = !!lockData && lockStatus !== LockStatus.OPEN;

  let description = '';
  if (location.equals(Vector3.Zero)) {
    description = STARTING_NODE_DESCRIPTION;
  } else if (!visibleStatus) {
    description = 'Unknown.';
  } else if (isLocked) {
    description = 'A locked node.';
  } else {
    description = 'An allocatable node.';
  }

  const nodeContents =
    visibleStatus === 'revealed'
      ? gameState.worldGen.nodeContentsMap.get(location) || null
      : null;
  const nodeContentsDom = nodeContents?.lines[0]
    ? nodeContentsToDom(nodeContents)
    : 'empty';

  return (
    <>
      <div className="tab-content-body">
        <div>
          Location: ( {xyCoords.x} , {xyCoords.y} ) , z-layer = {location.z}
        </div>
        <br></br>
        <div>
          <button onClick={onZoom}>Recenter on here (hotkey: r, {'\\'})</button>
        </div>
        <br></br>
        <div>Description: {description}</div>
        <br></br>
        <div>Taken?: {takenStatus.toString()}</div>
        <div>Reachable?: {reachableStatus.toString()}</div>
        <div>Visible?: {visibleStatus.toString()}</div>
        <div>Bookmarked?: {bookmarkedStatus.toString()}</div>
        <div>Explored?: {exploredStatus.toString()}</div>
        <div>Accessible?: {accessibleStatus.toString()}</div>
        {visibleStatus ? (
          <>
            <div>Locked?: {isLocked.toString()}</div>
            <div>Can be allocated?: {(!!canBeAllocated).toString()}</div>
            <br></br>
            <div>Contents: {nodeContentsDom}</div>
            <br></br>
            <button disabled={!canBeAllocated} onClick={onAllocate}>
              Allocate (hotkey: spacebar)
            </button>
            <button disabled={!canBeDeallocated} onClick={onDeallocate}>
              Deallocate (hotkey: backspace)
            </button>
          </>
        ) : (
          <> </>
        )}
      </div>
    </>
  );
}
