import "./App.css";

import classnames from "classnames";
import React, { useEffect, useMemo, useState } from "react";
import UAParser from "ua-parser-js";
import { NodeDetail } from "./components/NodeDetail";
import { PixiComponent } from "./components/PixiComponent";
import QuestProgress from "./components/QuestProgress";
import Sidebar from "./components/Sidebar";
import TabContent from "./components/TabContent";
import Tabs from "./components/Tabs";
import { UseGameStateContext } from "./contexts";
import { GameState } from "./data/GameState";
import { GameStateFactory } from "./dataFactory/GameStateFactory";
import { Lazy, updaterGenerator } from "./lib/util/misc";

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

const tabLabels = ["Node Details", "Quest Progress"];

const initialGameState: Lazy<GameState> = new Lazy(() => new GameStateFactory({}).create());

function App() {
  const [batchContents, setBatchContents] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  const [gameState, setGameState] = useState<GameState>(function factory() {
    return initialGameState.get();
  });
  let updaters = useMemo(() => updaterGenerator(gameState, setGameState), [setGameState]);

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
        <PixiComponent onFocusedNodeChange={updaters.playerUI.selectedPointNode.getUpdater()} />
        <Sidebar>
          <Tabs
            value={activeTab}
            labels={tabLabels}
            onChange={setActiveTab}
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
