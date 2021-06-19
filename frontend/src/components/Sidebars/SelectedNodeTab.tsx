import React from 'react';
import { GameState } from '../../data/GameState';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import {
  nodeContentsToDom,
  STARTING_NODE_DESCRIPTION,
} from '../GameArea/computeVirtualNodeDataMap';

export const SelectedNodeTabContent = React.memo(
  SelectedNodeTabContentComponent
);

// TODO(bowei): trim down the game state here
function SelectedNodeTabContentComponent(props: { gameState: GameState }) {
  const { gameState } = props;
  const location = gameState.playerUI.cursoredNodeLocation;

  if (location === null) {
    return (
      <>
        <div>Nothing selected!</div>
        <div>
          <br></br>
        </div>
        <div>Hover and click the question mark tooltip to select a node.</div>
      </>
    );
  }

  let description = '';
  if (location.equals(Vector3.Zero)) {
    description = STARTING_NODE_DESCRIPTION;
  } else if (gameState.worldGen.lockMap?.get(location) !== undefined) {
    description = 'A locked node.';
  } else {
    description = 'An allocatable node.';
  }

  let xyCoords = new Vector2(
    location.x - location.y / 2,
    (location.y * Math.sqrt(3)) / 2
  );
  xyCoords = new Vector2(
    Math.round(xyCoords.x * 100) / 100,
    Math.round(xyCoords.y * 100) / 100
  );

  const takenStatus = (
    gameState.playerSave.allocationStatusMap?.get(location)?.taken || false
  ).toString();
  const reachableStatus = (
    gameState.computed.reachableStatusMap?.get(location)?.reachable || false
  ).toString();
  const visibleStatus = (
    gameState.computed.fogOfWarStatusMap?.get(location)?.visible || false
  ).toString();
  const lockData = gameState.worldGen.lockMap?.get(location) || null;
  // const lockStatus = gameState.computed.lockStatusMap?.get(location) || null;

  const nodeContents = gameState.worldGen.nodeContentsMap.get(location) || null;
  const nodeContentsDom = nodeContents.lines[0]
    ? nodeContentsToDom(nodeContents)
    : 'empty';

  return (
    <>
      <div className="tab-content-body">
        <div>
          Location: ( {xyCoords.x} , {xyCoords.y} ) , z-layer = {location.z}
        </div>
        <br></br>
        <div>Description: {description}</div>
        <br></br>
        <div>Taken?: {takenStatus}</div>
        <div>Reachable?: {reachableStatus}</div>
        <div>Visible?: {visibleStatus}</div>
        <div>Locked?: {(!!lockData).toString()}</div>
        <div>
          Can be allocated?: {(reachableStatus && !lockData).toString()}
        </div>
        <br></br>
        <div>Contents: {nodeContentsDom}</div>
      </div>
    </>
  );
}
