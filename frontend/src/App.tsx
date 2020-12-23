import "./App.css";

import classnames from "classnames";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import UAParser from "ua-parser-js";
import { NodeDetail } from "./components/NodeDetail";
import { PixiComponent } from "./components/PixiComponent";
import QuestProgress from "./components/QuestProgress";
import Sidebar from "./components/Sidebar";
import TabContent from "./components/TabContent";
import Tabs from "./components/Tabs";
import { UseGameStateContext } from "./contexts";
import { GameState, PointNodeRef } from "./data/GameState";
import { GameStateFactory } from "./dataFactory/GameStateFactory";
import { Lazy, updaterGenerator } from "./lib/util/misc";

const browser = new UAParser().getBrowser();
let forceRotate = false;
if (
  browser.name === "Mobile Safari" &&
  window.innerWidth < window.innerHeight
) {
  forceRotate = true;
}

const tabLabels = ["Node Details", "Quest Progress"];

const initialGameState: Lazy<GameState> = new Lazy(() => new GameStateFactory({}).create());

function App() {
  const [batchContents, setBatchContents] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  const [gameState, setGameState] = useState<GameState>(function factory() {
    return initialGameState.get();
  });

  const setSelectedPointNode = (newSelectedPointNode: PointNodeRef) =>
    updateSelectedPointNode(() => newSelectedPointNode);

  let updaters = updaterGenerator(gameState, setGameState);
  const updateSelectedPointNode = updaters.playerUI.selectedPointNode.getUpdater();

  const handleFocusedNodeChange = setSelectedPointNode;

  const handleActiveTabChange = useCallback(
    (activeTabIndex) => {
      setActiveTab(activeTabIndex);
    },
    [setActiveTab]
  );

  useEffect(() => {
    if (batchContents === 0) {
      setBatchContents(5);
    }
  }, [batchContents]);

  const tabViews = useMemo(() => {
    return [
      <NodeDetail selectedPointNode={gameState.playerUI.selectedPointNode} />,
      <QuestProgress remainingPoints={batchContents} />,
    ];
  }, [gameState.playerUI.selectedPointNode, batchContents]);

  return (
    <div className={classnames({ App: true, "force-landscape": forceRotate })}>
      <UseGameStateContext.Provider value={[gameState, updaters]}>
        <PixiComponent onFocusedNodeChange={handleFocusedNodeChange} />
        <Sidebar>
          <Tabs
            value={activeTab}
            labels={tabLabels}
            onChange={handleActiveTabChange}
          />
          {tabViews.map((component, i) => {
            return (
              <TabContent key={i} showContent={activeTab === i}>
                {component}
              </TabContent>
            );
          })}
        </Sidebar>
      </UseGameStateContext.Provider>
    </div>
  );
}

export default App;
