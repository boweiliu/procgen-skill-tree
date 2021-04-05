import "./App.css";

import classnames from "classnames";
import React, { useCallback, useMemo, useState } from "react";
import { KeyboardListenerComponent } from "./components/KeyboardListenerComponent";
import { UseGameStateContext } from "./contexts";
import { appSizeFromWindowSize, GameState } from "./data/GameState";
import { GameStateFactory } from "./game/GameStateFactory";
import { batchifySetState } from "./lib/util/batchify";
import { Lazy } from "./lib/util/misc";
import { updaterGenerator2 } from "./lib/util/updaterGenerator";
import { WindowListenerComponent } from "./components/WIndowListenerComponent";
import { PixiWrapperComponent } from "./components/PixiWrapperComponent";
import { Vector2 } from "./lib/util/geometry/vector2";
import COLORS, { colorToCss } from "./pixi/colors";
import { GameAreaComponent } from "./components/GameAreaComponent";
import { DebugOverlayComponent } from "./components/DebugOverlayComponent";

const initialGameState: Lazy<GameState> = new Lazy(() =>
  new GameStateFactory({}).create()
);

/**
 * Root react component.
 * In charge of creating game state, and hooking up the game display, pixi, keyboard control, and window event listeners.
 */
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

  let appSize = appSizeFromWindowSize(new Vector2(gameState.windowState.innerWidth, gameState.windowState.innerHeight));

  return (
    <div className={classnames({ App: true })}>

      <div className="entire-area">
        <UseGameStateContext.Provider value={[gameState, updaters, fireBatch]}>
          <PixiWrapperComponent hidden={gameState.playerUI.isPixiHidden} />
        </UseGameStateContext.Provider>
        <GameAreaComponent hidden={!gameState.playerUI.isPixiHidden} appSize={appSize}/>
      </div>

      <div className="debug-overlay">
        <DebugOverlayComponent tick={gameState.tick} windowState={gameState.windowState} />
      </div>
      <div className="button-zone" >
        <button className="button-pixi-toggle" style={{}} onClick={() => {
          updaters.playerUI.isPixiHidden.enqueueUpdate(it => !it);
        }}>
          Toggle pixi
        </button>
      </div>
      
      <KeyboardListenerComponent intent={gameState.intent} updaters={updaters.intent}>
      </KeyboardListenerComponent>
      <WindowListenerComponent updaters={updaters.windowState}>
      </WindowListenerComponent>
    </div>
  );
}

export default App;
