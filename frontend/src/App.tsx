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
import { GameContext, UIContext } from "./contexts";
import { Vector2 } from "./lib/util/geometry/vector2";
import { Chunk } from "./pixi/Chunk";

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
  const [focusedNode, setFocusedNode] = useState<{
    chunk: Chunk;
    node: Vector2;
  }>();
  const [batchContents, setBatchContents] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const uiState = useMemo(() => ({ focusedNode }), [focusedNode]);
  const game = useMemo(() => ({}), []);
  const handleFocusedNodeChange = useCallback(
    (chunk, node) => {
      setBatchContents((n) => n - 1);
      setFocusedNode({ chunk, node });
    },
    [setFocusedNode]
  );
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
      <NodeDetail focusedNode={focusedNode} />,
      <QuestProgress remainingPoints={batchContents} />,
    ];
  }, [focusedNode]);

  return (
    <div className={classnames({ App: true, "force-landscape": forceRotate })}>
      <GameContext.Provider value={game}>
        <UIContext.Provider value={uiState}>
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
        </UIContext.Provider>
      </GameContext.Provider>
    </div>
  );
}

export default App;
