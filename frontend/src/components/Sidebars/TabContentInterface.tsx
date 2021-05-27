import React from 'react';
import './TabContent.css';
import { GameState } from '../../data/GameState';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { STARTING_NODE_DESCRIPTION } from '../GameArea/computeVirtualNodeDataMap';

export enum TAB_NAME {
  EMPTY = 'EMPTY',
  SELECTED_NODE = 'SELECTED_NODE',
  STATS = 'STATS',
  QUESTS = 'QUESTS',
  DEBUG = 'DEBUG',
  HELP = 'HELP',
}

export function TabContentInterface(props: {
  tabName: TAB_NAME;
  gameState: GameState;
  updaters: UpdaterGeneratorType2<GameState, GameState>;
}) {
  const { tabName } = props;
  if (tabName === TAB_NAME.EMPTY) {
    return <EmptyTabContent />;
  } else if (tabName === TAB_NAME.SELECTED_NODE) {
    return <SelectedNodeTabContent gameState={props.gameState} />;
  } else if (tabName === TAB_NAME.STATS) {
    return <>stats info???</>;
  } else if (tabName === TAB_NAME.QUESTS) {
    return <>quests info???</>;
  } else if (tabName === TAB_NAME.DEBUG) {
    return <>debug panel</>;
  } else if (tabName === TAB_NAME.HELP) {
    return <>How to play the game</>;
  } else {
    return <> </>;
  }
}

export const EmptyTabContent = React.memo(EmptyTabContentComponent);
function EmptyTabContentComponent(props: {}) {
  console.log('got here empty tab content');
  return <div>Nothing here!</div>;
}

export const SelectedNodeTabContent = React.memo(
  SelectedNodeTabContentComponent
);
function SelectedNodeTabContentComponent(props: { gameState: GameState }) {
  const { gameState } = props;
  const location = gameState.playerUI.cursoredNodeLocation;

  if (location === undefined) {
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
        <div>Locked?: {'???'}</div>
        <br></br>
        <div>Contents: {'???'}</div>
      </div>
    </>
  );
}
