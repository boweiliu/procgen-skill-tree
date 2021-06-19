import React from 'react';
import './TabContent.css';
import { GameState } from '../../data/GameState';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { STARTING_NODE_DESCRIPTION } from '../GameArea/computeVirtualNodeDataMap';
import { DebugTabContent } from './DebugTab';
import { StrategicTab } from './StrategicTab';

export enum TAB_NAME {
  EMPTY = 'EMPTY',
  SELECTED_NODE = 'SELECTED_NODE',
  STATS = 'STATS',
  QUESTS = 'QUESTS',
  DEBUG = 'DEBUG',
  HELP = 'HELP',
  STRATEGIC_VIEW = 'STRATEGIC_VIEW',
}

// in charge of constructing content. no css
export function TabContentInterface(props: {
  tabName: TAB_NAME;
  gameState: GameState;
  updaters: UpdaterGeneratorType2<GameState, GameState>;
}) {
  const { tabName } = props;

  const tabComponents = {
    [TAB_NAME.EMPTY]: <EmptyTabContent />,
    [TAB_NAME.SELECTED_NODE]: (
      <SelectedNodeTabContent gameState={props.gameState} />
    ),
    [TAB_NAME.STATS]: <>stats info???</>,
    [TAB_NAME.QUESTS]: <>quests info???</>,
    [TAB_NAME.STRATEGIC_VIEW]: (
      <StrategicTab gameState={props.gameState} updaters={props.updaters} />
    ),
    [TAB_NAME.DEBUG]: (
      <DebugTabContent
        gameState={props.gameState}
        updaters={props.updaters}
        hidden={tabName !== TAB_NAME.DEBUG}
      />
    ),
    [TAB_NAME.HELP]: <>How to play the game</>,
  };

  return <TabContentSelector tabComponents={tabComponents} tabName={tabName} />;
}

// layout & switch statement. pure. no knowledge of game state
function TabContentSelector(props: {
  tabComponents: { [k in TAB_NAME]: React.ReactNode };
  tabName: TAB_NAME;
}) {
  const selectedTabName = props.tabName;
  const tabNames = Object.keys(TAB_NAME) as TAB_NAME[];

  return (
    <>
      {tabNames.map((tabName) => {
        return (
          <div key={tabName} hidden={tabName !== selectedTabName}>
            {props.tabComponents[tabName]!}
          </div>
        );
      })}
    </>
  );
}

/**
 * Tabs
 */
export const EmptyTabContent = React.memo(EmptyTabContentComponent);
function EmptyTabContentComponent(props: {}) {
  console.log('got here empty tab content');
  return <div>Nothing here!</div>;
}

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
        <div>Contents: {'???'}</div>
      </div>
    </>
  );
}
