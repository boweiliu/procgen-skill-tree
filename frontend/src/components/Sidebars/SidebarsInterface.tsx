import './SidebarsInterface.css';
import React, { useCallback, useMemo } from 'react';
import { GameState } from '../../data/GameState';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import Sidebar from './Sidebar';
import { Tabs } from './Tabs';
import { TabContentInterface, TAB_NAME } from './TabContentInterface';
import { AllocateNodeAction } from '../../game/actions/AllocateNode';

export const emptyTabLabels: TAB_NAME[] = [TAB_NAME.EMPTY];
export const initialTabLabels: TAB_NAME[] = [
  TAB_NAME.SELECTED_NODE,
  TAB_NAME.STATS,
  TAB_NAME.QUESTS,
  TAB_NAME.DEBUG,
  TAB_NAME.HELP,
  TAB_NAME.STRATEGIC_VIEW,
];

/**
 * Manages both sidebars (left & right) as well as anything directly adjacent to them.
 */
export function SidebarsInterface(props: {
  gameState: GameState;
  updaters: UpdaterGeneratorType2<GameState, GameState>;
}) {
  // NOTE(bowei): commenting out this entire component subtree increases react rerenders per sec from 80-ish to 100-ish while doing nothing other than scrolling (jumps disabled)
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

  const tabsState = gameState.playerUI.tabs;
  const tabsUpdaters = updaters.playerUI.tabs;

  const leftSidebarTabs = tabsState.left.tabs;
  const rightSidebarTabs = tabsState.right.tabs;
  const leftActiveTabIndex = tabsState.left.activeIndex;
  const rightActiveTabIndex = tabsState.right.activeIndex;
  const setLeftSidebarTabs = tabsUpdaters.left.tabs.enqueueUpdate;
  const setRightSidebarTabs = tabsUpdaters.right.tabs.enqueueUpdate;
  const setLeftActiveTabIndex = tabsUpdaters.left.activeIndex.enqueueUpdate;
  const setRightActiveTabIndex = tabsUpdaters.right.activeIndex.enqueueUpdate;

  // const [leftSidebarTabs, setLeftSidebarTabs] = useState<TAB_NAME[]>([]);
  // const [rightSidebarTabs, setRightSidebarTabs] = useState<TAB_NAME[]>(initialTabLabels);
  // const [leftActiveTabIndex, setLeftActiveTabIndex] = useState(0);
  // const [rightActiveTabIndex, setRightActiveTabIndex] = useState(0);

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

  // TODO(bowei): improve this abstraction??
  const actions = useMemo(() => {
    return { allocateNode: new AllocateNodeAction(props.updaters) };
  }, [props.updaters]);

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
        />
        <TabContentInterface
          gameState={gameState}
          updaters={updaters}
          tabName={leftTabName}
          actions={actions}
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
        />
        <TabContentInterface
          gameState={gameState}
          updaters={updaters}
          tabName={rightTabName}
          actions={actions}
        />
      </Sidebar>
    </>
  );
}
