import React, { useCallback } from 'react';
import { GameState } from '../../../data/GameState';
import { LockStatus } from '../../../data/NodeStatus';
import { AllocateNodeAction } from '../../../game/actions/AllocateNode';
import { DeallocateNodeAction } from '../../../game/actions/DeallocateNode';
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

  const onAllocate = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (location) {
        props.actions.allocateNode.enqueueAction({
          nodeLocation: location,
          newStatus: { taken: true, previouslyTaken: true },
        });
      }
    },
    [props.actions.allocateNode, location]
  );

  const onDeallocate = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (location) {
        props.actions.deallocateNode.enqueueAction({
          nodeLocation: location,
          newStatus: {
            taken: false,
            previouslyTaken: true,
          },
        });
      }
    },
    [props.actions.deallocateNode, location]
  );

  const onForceAllocate = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (location) {
        props.actions.allocateNode.enqueueAction({
          nodeLocation: location,
          newStatus: { taken: false, previouslyTaken: true },
        });
      }
    },
    [props.actions.allocateNode, location]
  );

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
  const reachableStatus =
    gameState.computed.reachableStatusMap?.get(location)?.reachable || false;
  const visibleStatus =
    gameState.computed.fogOfWarStatusMap?.get(location)?.visible || false;
  const lockData = visibleStatus
    ? gameState.worldGen.lockMap?.get(location) || null
    : null;
  const lockStatus = gameState.computed.lockStatusMap?.get(location) || null;
  const isLocked = !!lockData && lockStatus !== LockStatus.OPEN;

  const canBeAllocated = reachableStatus && !isLocked && !takenStatus;

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

  const nodeContents = visibleStatus
    ? gameState.worldGen.nodeContentsMap.get(location) || null
    : null;
  const nodeContentsDom = nodeContents?.lines[0]
    ? nodeContentsToDom(nodeContents)
    : 'empty';

  const canBeDeallocated = true;

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
        {visibleStatus ? (
          <>
            <div>Locked?: {isLocked.toString()}</div>
            <div>Can be allocated?: {canBeAllocated.toString()}</div>
            <div>Can be deallocated?: {'?? TODO ??'}</div>
            <br></br>
            <div>Contents: {nodeContentsDom}</div>
            <br></br>
            <button disabled={!canBeAllocated} onClick={onAllocate}>
              Allocate (hotkey: spacebar)
            </button>
            <button disabled={!canBeDeallocated} onClick={onDeallocate}>
              Deallocate
            </button>
            <button disabled={false} onClick={onForceAllocate}>
              [DEBUG] Force allocate
            </button>
          </>
        ) : (
          <> </>
        )}
      </div>
    </>
  );
}
