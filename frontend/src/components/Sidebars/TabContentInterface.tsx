import React from 'react';
import './TabContent.css';
import { GameState } from '../../data/GameState';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import { DebugTabContent } from './Tabs/DebugTab';
import { StrategicTab } from './Tabs/StrategicTab';
import { SelectedNodeTabContent } from './Tabs/SelectedNodeTab';
import { AllocateNodeAction } from '../../game/actions/AllocateNode';
import { StatsTab } from './Tabs/StatsTab';
import { HelpTab } from './Tabs/HelpTab';

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
  actions: { allocateNode: AllocateNodeAction };
}) {
  const { tabName } = props;

  const tabComponents = {
    [TAB_NAME.EMPTY]: <EmptyTabContent />,
    [TAB_NAME.SELECTED_NODE]: (
      <SelectedNodeTabContent
        gameState={props.gameState}
        updaters={props.updaters}
        actions={props.actions}
      />
    ),
    [TAB_NAME.STATS]: (
      <StatsTab gameState={props.gameState} updaters={props.updaters} />
    ),
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
    [TAB_NAME.HELP]: <HelpTab />,
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
