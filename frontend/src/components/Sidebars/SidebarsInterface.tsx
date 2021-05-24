import React, { useCallback } from 'react';
import { GameState } from '../../data/GameState';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import Sidebar from './Sidebar';
import Tabs from './Tabs';

import './SidebarsInterface.css';

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
        // hidden={!gameState.playerUI.isSidebarOpen}
        hidden={true}
        placement={'left'}
      >
        <Tabs
          value={0}
          labels={['[empty]']}
          onChange={(value: number) => {}}
        ></Tabs>
        Nothing here!
      </Sidebar>
      <Sidebar hidden={!gameState.playerUI.isSidebarOpen} placement={'right'}>
        <div className="sidebar-header">
          <div className="sidebar-header-button" onClick={() => {}}>
            ⬅️ Send left
          </div>
          <div
            className="sidebar-header-button"
            onClick={() => {
              setRightSidebarHidden();
            }}
          >
            ❎ Close
          </div>
        </div>
        <Tabs
          value={0}
          labels={['Selected node', 'Total stats', 'Quests', 'Debug', 'Help']}
          onChange={(value: number) => {}}
        ></Tabs>
        content
      </Sidebar>
    </>
  );
}
