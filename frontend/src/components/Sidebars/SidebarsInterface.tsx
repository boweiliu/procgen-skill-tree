import './SidebarsInterface.css';
import React, { useCallback, useMemo, useState } from 'react';
import { GameState } from '../../data/GameState';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import Sidebar from './Sidebar';
import { Tabs } from './Tabs';
import { TabContentInterface, TAB_NAME } from './TabContentInterface';

const emptyTabLabels = ['EMPTY'];

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
  const setLeftSidebarUnhidden = useCallback(() => {
    updaters.playerUI.isSidebarOpen.enqueueUpdate(() => true);
  }, [updaters]);
  const setRightSidebarHidden = useCallback(() => {
    updaters.playerUI.isSidebarOpen.enqueueUpdate(() => false);
  }, [updaters]);
  const setRightSidebarUnhidden = useCallback(() => {
    updaters.playerUI.isSidebarOpen.enqueueUpdate(() => true);
  }, [updaters]);

  const [leftSidebarTabs, setLeftSidebarTabs] = useState<string[]>([]);
  const [rightSidebarTabs, setRightSidebarTabs] = useState([
    'SELECTED_NODE',
    'STATS',
    'QUESTS',
    'DEBUG',
    'HELP',
  ]);
  const [leftActiveTabIndex, setLeftActiveTabIndex] = useState(0);
  const [rightActiveTabIndex, setRightActiveTabIndex] = useState(0);

  const onSendTabLeft = useCallback(() => {
    if (rightSidebarTabs.length === 0) {
      return;
    }
    const currentRightTab = rightSidebarTabs[rightActiveTabIndex];
    if (currentRightTab === undefined) {
      return;
    }
    const newRightSidebarTabs = rightSidebarTabs
      .slice(0, rightActiveTabIndex)
      .concat(rightSidebarTabs.slice(rightActiveTabIndex + 1));
    setRightSidebarTabs(newRightSidebarTabs);
    setRightActiveTabIndex(
      Math.max(0, Math.min(rightActiveTabIndex, newRightSidebarTabs.length - 1))
    );
    const newLeftSidebarTabs = [...leftSidebarTabs, currentRightTab];
    setLeftSidebarTabs(newLeftSidebarTabs);
    setLeftActiveTabIndex(newLeftSidebarTabs.length - 1);
    setLeftSidebarUnhidden();
  }, [
    leftSidebarTabs,
    setLeftSidebarTabs,
    rightSidebarTabs,
    setRightSidebarTabs,
    setLeftActiveTabIndex,
    rightActiveTabIndex,
    setRightActiveTabIndex,
    setLeftSidebarUnhidden,
  ]);

  const onSendTabRight = useCallback(() => {
    if (leftSidebarTabs.length === 0) {
      return;
    }
    const currentLeftTab = leftSidebarTabs[leftActiveTabIndex];
    if (currentLeftTab === undefined) {
      return;
    }
    const newLeftSidebarTabs = leftSidebarTabs
      .slice(0, leftActiveTabIndex)
      .concat(leftSidebarTabs.slice(leftActiveTabIndex + 1));
    setLeftSidebarTabs(newLeftSidebarTabs);
    setLeftActiveTabIndex(
      Math.max(Math.min(leftActiveTabIndex, newLeftSidebarTabs.length - 1), 0)
    );
    const newRightSidebarTabs = [...rightSidebarTabs, currentLeftTab];
    setRightSidebarTabs(newRightSidebarTabs);
    setRightActiveTabIndex(newRightSidebarTabs.length - 1);
    setRightSidebarUnhidden();
  }, [
    leftSidebarTabs,
    setLeftSidebarTabs,
    rightSidebarTabs,
    setRightSidebarTabs,
    leftActiveTabIndex,
    setLeftActiveTabIndex,
    setRightActiveTabIndex,
    setRightSidebarUnhidden,
  ]);

  // Find out which tab is active on either side
  const leftTabName: TAB_NAME = useMemo(() => {
    if (leftSidebarTabs.length === 0) {
      return TAB_NAME.EMPTY;
    } else {
      return leftSidebarTabs[leftActiveTabIndex] as TAB_NAME;
    }
  }, [leftSidebarTabs, leftActiveTabIndex]);

  const rightTabName: TAB_NAME = useMemo(() => {
    if (rightSidebarTabs.length === 0) {
      return TAB_NAME.EMPTY;
    } else {
      return rightSidebarTabs[rightActiveTabIndex] as TAB_NAME;
    }
  }, [rightSidebarTabs, rightActiveTabIndex]);

  return (
    <>
      <Sidebar
        hidden={!gameState.playerUI.isSidebarOpen}
        // hidden={true}
        placement={'left'}
      >
        <div className="sidebar-header">
          <div className="sidebar-header-button" onClick={onSendTabRight}>
            ➡️️ Send right
          </div>
          <div className="sidebar-header-gap"></div>
          <div
            className="sidebar-header-button"
            onClick={() => {
              setLeftSidebarHidden();
            }}
          >
            ❎ Close
          </div>
        </div>
        <Tabs
          value={leftActiveTabIndex || 0}
          labels={leftSidebarTabs.length ? leftSidebarTabs : emptyTabLabels}
          onChange={setLeftActiveTabIndex}
        ></Tabs>
        <TabContentInterface
          gameState={gameState}
          updaters={updaters}
          tabName={leftTabName}
        />
      </Sidebar>
      <Sidebar hidden={!gameState.playerUI.isSidebarOpen} placement={'right'}>
        <div className="sidebar-header">
          <div className="sidebar-header-button" onClick={onSendTabLeft}>
            ⬅️ Send left
          </div>
          <div className="sidebar-header-gap"></div>
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
          value={rightActiveTabIndex || 0}
          labels={rightSidebarTabs.length ? rightSidebarTabs : emptyTabLabels}
          onChange={setRightActiveTabIndex}
        ></Tabs>
        <TabContentInterface
          gameState={gameState}
          updaters={updaters}
          tabName={rightTabName}
        />
      </Sidebar>
    </>
  );
}
