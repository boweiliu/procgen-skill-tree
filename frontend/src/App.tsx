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
import { GameContext } from "./contexts";
import { GameState, PointNodeRef } from "./data/GameState";
import { GameStateFactory } from "./dataFactory/GameStateFactory";
import { updaterGenerator } from "./lib/util/misc";

const browser = new UAParser().getBrowser();
let forceRotate = false;
if (
  browser.name === "Mobile Safari" &&
  window.innerWidth < window.innerHeight
) {
  forceRotate = true;
}

const tabLabels = ["Node Details", "Quest Progress"];

function App() {
  // const [forceUpdate, setForceUpdate] = useState(0);
  // useEffect(() => {
  //   setInterval(() => {
  //     console.log('a')
  //     setForceUpdate(a => a + 1)
  //   }, 1000);

  // }, [setForceUpdate])
  const [batchContents, setBatchContents] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  const [game, setGame] = useState<GameState>(
    new GameStateFactory({}).create()
  );

  useEffect(() => {
    console.log("game updated:");
    console.log(game);
  }, [game]);
  const setSelectedPointNode = (newSelectedPointNode: PointNodeRef) =>
    updateSelectedPointNode(() => newSelectedPointNode);

  let updaters = updaterGenerator(game, setGame);
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
      <NodeDetail selectedPointNode={game.playerUI.selectedPointNode} />,
      <QuestProgress remainingPoints={batchContents} />,
    ];
  }, [game.playerUI.selectedPointNode, batchContents]);

  return (
    <div className={classnames({ App: true, "force-landscape": forceRotate })}>
      <GameContext.Provider value={game}>
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
      </GameContext.Provider>
    </div>
  );
}

export default App;
