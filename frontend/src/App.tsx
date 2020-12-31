import "./App.css";

import classnames from "classnames";
import React, { useCallback, useMemo, useState } from "react";
import UAParser from "ua-parser-js";
import { DebugTab } from "./components/DebugTab";
import { KeyboardControlComponent } from "./components/KeyboardControl";
import { NodeDetail } from "./components/NodeDetail";
import { PixiComponent } from "./components/PixiComponent";
import QuestProgress from "./components/QuestProgress";
import Sidebar from "./components/Sidebar";
import TabContent from "./components/TabContent";
import Tabs from "./components/Tabs";
import { UseGameStateContext } from "./contexts";
import { GameState } from "./data/GameState";
import { GameStateFactory } from "./game/GameStateFactory";
import { createQuest } from "./game/OnCreateNewQuest";
import { batchifySetState } from "./lib/util/batchify";
import { Lazy } from "./lib/util/misc";
import { updaterGenerator2 } from "./lib/util/updaterGenerator";
import { computeQuestEfficiencyPercent, remapQuestEfficiencyToGrade } from "./game/EfficiencyCalculator";

// TODO(bowei): on mobile, for either ios or android, when in portrait locked orientation, we want to serve a landscape
// experience - similar to a native app which is landscape locked.
// (on mobile in already landscape orientation, and in all desktop, serve ordinary orientation.)
// also note that android webapp supports manifest.json setting orientation, but not in the browser
// FOR NOW - ignore this
const browser = new UAParser().getBrowser();
let forceRotate = false;
if (
  browser.name === "Mobile Safari" &&
  window.innerWidth < window.innerHeight
) {
  forceRotate = true;
}

const tabLabels = ["Quest Progress", "Node Details", "Debug"];

const initialGameState: Lazy<GameState> = new Lazy(() =>
  new GameStateFactory({}).create()
);

function App() {
  const [gameState, setGameState] = useState<GameState>(function factory() {
    return initialGameState.get();
  });

  let [batchedSetGameState, fireBatch] = useMemo(
    () => batchifySetState(setGameState),
    [setGameState]
  );
  let updaters = useMemo(
    () => updaterGenerator2(initialGameState.get(), batchedSetGameState),
    [batchedSetGameState]
  );
  let createQuestCb = useCallback(() => createQuest(updaters), [
    updaters,
  ]);

  let tabViews: JSX.Element[] = [];
  tabViews = [
    <QuestProgress
      remainingPoints={gameState.playerSave.availableSp}
      spSpentThisQuest={gameState.playerSave.spSpentThisQuest}
      createQuestCb={createQuestCb}
      activeQuest={gameState.playerSave.activeQuest}
      numBatches={gameState.playerSave.batchesSinceQuestStart}
      playerResourceAmounts={gameState.computed.playerResourceAmounts}
      updaters={updaters.playerSave}
      score={gameState.playerSave.score}
      efficiencyGrade={remapQuestEfficiencyToGrade(computeQuestEfficiencyPercent(gameState.playerSave))}
      questInitialAmount={gameState.playerSave.questInitialAmount}
    />,
    <NodeDetail
      selectedPointNode={gameState.playerUI.selectedPointNode}
      allocatedPointNodeSet={gameState.playerSave.allocatedPointNodeSet}
      worldGen={gameState.worldGen}
      availableSp={gameState.playerSave.availableSp}
    />,
    <DebugTab
      selectedPointNode={gameState.playerUI.selectedPointNode}
      allocatedPointNodeSet={gameState.playerSave.allocatedPointNodeSet}
      worldGen={gameState.worldGen}
      availableSp={gameState.playerSave.availableSp}
      playerSave={gameState.playerSave}
      computed={gameState.computed}
    />,
  ];
  return (
    <div className={classnames({ App: true, "force-landscape": forceRotate })}>
      <UseGameStateContext.Provider value={[gameState, updaters, fireBatch]}>
        <PixiComponent originalSetGameState={setGameState} />
        <Sidebar>
          <Tabs
            value={gameState.playerUI.activeTab}
            labels={tabLabels}
            onChange={updaters.playerUI.activeTab.getUpdater()}
          />
          {tabViews.map((component, i) => {
            return (
              <TabContent
                key={i}
                showContent={gameState.playerUI.activeTab === i}
              >
                {component}
              </TabContent>
            );
          })}
        </Sidebar>
      </UseGameStateContext.Provider>
      <KeyboardControlComponent
        intent={gameState.intent}
        updaters={updaters.intent}
      ></KeyboardControlComponent>
    </div>
  );
}

export default App;
