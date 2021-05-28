import React, { useEffect, useState } from 'react';
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

export function DebugTabContent(props: {
  gameState: GameState; // definitely needs gameState.tick in order that this component updates regularly
  updaters: UpdaterGeneratorType2<GameState, GameState>;
  hidden: boolean;
}) {
  const { gameState } = props;
  const { tick } = gameState;

  const [lastUpdated, setLastUpdated] = useState(+new Date());
  const [slowRenderMsgs, setSlowRenderMsgs] = useState<string[]>([]);

  useEffect(() => {
    const now = new Date();
    const msSinceLastTick = +now - lastUpdated;
    if (msSinceLastTick > 50) {
      const msg = `Tick ${tick} took ${msSinceLastTick}ms at ${
        now.toTimeString().split(' ')[0]
      }`;
      console.log(msg);
      setSlowRenderMsgs((prev) => {
        return [msg, ...prev];
      });
    }
    setLastUpdated(+new Date());
  }, [tick, lastUpdated, setLastUpdated, setSlowRenderMsgs]);

  if (props.hidden) {
    return <> </>;
  }

  return (
    <>
      <div> debug tab </div>
      <div className="tab-content-body">
        <br></br>
        <div>Recent slow renders:</div>
        {slowRenderMsgs.slice(0, 5).map((it) => {
          return <div>{it}</div>;
        })}
        <br></br>
      </div>
      <div> buttons </div>
      <div className="tab-content-body">
        <br></br>
        <div>
          <button>Toggle scrollbars</button>
        </div>
      </div>
    </>
  );
}
