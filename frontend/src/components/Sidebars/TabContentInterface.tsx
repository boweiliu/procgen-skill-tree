import React from 'react';
import { GameState } from '../../data/GameState';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';

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
    return <>Nothing here!</>;
  } else if (tabName === TAB_NAME.SELECTED_NODE) {
    return <>selected node info???</>;
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
