import React, { useCallback } from 'react';
import { GameState } from '../../data/GameState';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import Sidebar from '../Sidebar';
import Tabs from '../Tabs';

/**
 * Manages both sidebars (left & right) as well as anything directly adjacent to them.
 */
export function SidebarsInterface(props: {
  gameState: GameState;
  updaters: UpdaterGeneratorType2<GameState, GameState>;
}) {
  const { gameState, updaters } = props;

  const setLeftSidebarHidden = useCallback(() => {
    updaters.playerUI.isSidebarOpen.enqueueUpdate(() => false);
  }, [updaters]);
  const setRightSidebarHidden = useCallback(() => {
    updaters.playerUI.isSidebarOpen.enqueueUpdate(() => false);
  }, [updaters]);

  return (
    <>
      <Sidebar
        hidden={!gameState.playerUI.isSidebarOpen}
        setSidebarHidden={setLeftSidebarHidden}
        placement={'left'}
      >
        <Tabs
          value={0}
          labels={['[empty]']}
          onChange={(value: number) => {}}
        ></Tabs>
        Nothing here!
      </Sidebar>
      <Sidebar
        hidden={!gameState.playerUI.isSidebarOpen}
        setSidebarHidden={setRightSidebarHidden}
        placement={'right'}
      >
        <Tabs
          value={0}
          labels={['Selected node', 'Total stats', 'Quests', 'Debug']}
          onChange={(value: number) => {}}
        ></Tabs>
        content
      </Sidebar>
    </>
  );
}
