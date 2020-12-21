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
import { Vector2 } from "./lib/util/geometry/vector2";
import { Chunk } from "./pixi/Chunk";
import { GameStateFactory } from "./dataFactory/GameStateFactory";
import { GameState, PointNodeRef } from "./data/GameState";

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
  const [batchContents, setBatchContents] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  // const uiState = { focusedNode }; // recomputes every rerender
  // const uiState = useMemo(() => ({ focusedNode }), [focusedNode]);

  // const game = useMemo(() => {
  //   return new GameStateFactory({}).create();
  // }, []);
  const [game, setGame] = useState<GameState>(
    new GameStateFactory({}).create()
  );

  const handleFocusedNodeChange = useCallback(
    (selection: PointNodeRef) => {
      console.log("GOT TO on node change callback ", selection);
      setGame((game) => {
        game.playerUI.selectedPointNode = selection;
        return { ...game };
      });
    },
    [setGame]
  );

  // const handleFocusedNodeChange = useCallback(
  //   (chunk, node) => {
  //     setBatchContents((n) => n - 1);
  //     setFocusedNode({ chunk, node });
  //   },
  //   [setFocusedNode]
  // );
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
