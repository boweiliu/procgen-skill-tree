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
import { createQuest } from "./game/OnCreateQuest";
import { batchifySetState } from "./lib/util/batchify";
import { Lazy } from "./lib/util/misc";
import { updaterGenerator2 } from "./lib/util/updaterGenerator";
import { computeQuestEfficiencyPercent, remapQuestEfficiencyToGrade } from "./game/EfficiencyCalculator";
import StatsOverview from "./components/StatsOverview";

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

const initialGameState: Lazy<GameState> = new Lazy(() =>
  new GameStateFactory({}).create()
);

function App() {
  const [gameState, setGameState] = useState<GameState>(function factory() {
    return initialGameState.get();
  });

  let [isPixiHidden, setPixiHidden] = useState(true);

  let [batchedSetGameState, fireBatch] = useMemo(
    () => batchifySetState(setGameState),
    [setGameState]
  );
  let updaters = useMemo(
    () => updaterGenerator2(initialGameState.get(), batchedSetGameState),
    [batchedSetGameState]
  );

  return (
    <div className={classnames({ App: true, "force-landscape": forceRotate })}>
      <UseGameStateContext.Provider value={[gameState, updaters, fireBatch]}>
        <PixiComponent originalSetGameState={setGameState} hidden={isPixiHidden} />
      </UseGameStateContext.Provider>

      <div id="entire-area" style={{width: "100%", height: "100%", position: "absolute", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div id="play-area" style={{
          width: "95%", height: "95%", backgroundColor: "#abcdef",
          overflowY: "scroll", overflowX: "scroll",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          whiteSpace: "nowrap",
          // see https://www.w3schools.com/howto/howto_css_hide_scrollbars.asp
          // "::-webkit-scrollbar.display": "none",
          // https://stackoverflow.com/questions/4192847/set-scroll-position
          // https://stackoverflow.com/questions/53158796/get-scroll-position-with-reactjs
        }}>
          <div id="row" style={{ width: "150%" }}> {/* https://stackoverflow.com/questions/1015809/how-to-get-floating-divs-inside-fixed-width-div-to-continue-horizontally */}
          <div id="allocatable node" style={{
              width: "640px", height: "640px", backgroundColor: "#446688",
            // https://stackoverflow.com/questions/10170759/how-to-put-some-divs-in-a-row
            float: "left", display: "inline-block"
          }}>
            node
          </div>
          <div id="allocatable node" style={{
            width: "640px", height: "640px", backgroundColor: "#440088",
            float: "left", display: "inline-block"
          }}>
            node2
          </div>
          <div id="allocatable node" style={{
            width: "640px", height: "640px", backgroundColor: "#880088",
            float: "left", display: "inline-block"
          }}>
            node3
          </div>
          </div>
          <div id="row" style={{ width: "150%"}}>
          <div id="allocatable node" style={{
            width: "640px", height: "640px", backgroundColor: "#446688",
            float: "left", display: "inline-block"
          }}>
            node
          </div>
          <div id="allocatable node" style={{
            width: "640px", height: "640px", backgroundColor: "#440088",
            float: "left", display: "inline-block"
          }}>
            node2
          </div>
          <div id="allocatable node" style={{
            width: "640px", height: "640px", backgroundColor: "#880088",
            float: "left", display: "inline-block"
          }}>
            node3
          </div>
          </div>
          <div id="row" style={{ width: "150%"}}>
          <div id="allocatable node" style={{
            width: "640px", height: "640px", backgroundColor: "#446688",
            float: "left", display: "inline-block"
          }}>
            node
          </div>
          <div id="allocatable node" style={{
            width: "640px", height: "640px", backgroundColor: "#440088",
            float: "left", display: "inline-block"
          }}>
            node2
          </div>
          <div id="allocatable node" style={{
            width: "640px", height: "640px", backgroundColor: "#880088",
            float: "left", display: "inline-block"
          }}>
            node3
          </div>
          </div>
        </div>
      </div>
        <div id="pixi toggle" style={{ position: "absolute", bottom: 0, width: "100%" }} >
          <button style={{alignSelf: "flex-end"}} onClick={() => { setPixiHidden(!isPixiHidden) }}>
            Toggle pixi
          </button>
        </div>
      
      <KeyboardControlComponent
        intent={gameState.intent}
        updaters={updaters.intent}
      ></KeyboardControlComponent>
    </div>
  );
}

export default App;
