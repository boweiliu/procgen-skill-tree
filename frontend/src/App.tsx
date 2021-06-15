import './App.css';

import classnames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { DebugOverlayComponent } from './components/DebugOverlayComponent';
import { KeyboardListenerComponent } from './components/KeyboardListenerComponent';
import { PixiWrapperComponent } from './components/PixiWrapperComponent';
import { WindowListenerComponent } from './components/WindowListenerComponent';
import { UseGameStateContext } from './contexts';
import { GameState } from './data/GameState';
import { GameStateFactory } from './game/GameStateFactory';
import { batchifySetState } from './lib/util/batchify';
import { Lazy } from './lib/util/lazy';
import {
  UpdaterGeneratorType2,
  updaterGenerator2,
} from './lib/util/updaterGenerator';
import { GameAreaInterface } from './components/GameArea/GameAreaInterface';
import { SidebarsInterface } from './components/Sidebars/SidebarsInterface';

const initialGameState: Lazy<GameState> = new Lazy(() =>
  new GameStateFactory({}).loadOrCreate(+new Date())
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

  const gameStateContextValue = useMemo(() => {
    return [gameState, updaters, fireBatch] as [
      GameState,
      UpdaterGeneratorType2<GameState, GameState>,
      () => void
    ];
  }, [gameState, updaters, fireBatch]);

  useEffect(() => {
    console.log('maybe toggling strategic view');
    if (gameState.intent.newIntent.TOGGLE_STRATEGIC_VIEW) {
      updaters.playerUI.isPixiHidden.enqueueUpdate((it) => !it);
    }
  }, [gameState.intent.newIntent.TOGGLE_STRATEGIC_VIEW, updaters]);

  useEffect(() => {
    console.log('maybe toggling sidebar');
    if (gameState.intent.newIntent.TOGGLE_SIDEBAR) {
      updaters.playerUI.isSidebarOpen.enqueueUpdate((it) => !it);
    }
  }, [gameState.intent.newIntent.TOGGLE_SIDEBAR, updaters]);

  return (
    <div className={classnames({ App: true })}>
      <div className="entire-area">
        <UseGameStateContext.Provider
          // NOTE(bowei): this context provider is absolutely unnecessary, but keeping it here for now in case i forget how to use context managers
          value={gameStateContextValue}
        >
          <PixiWrapperComponent hidden={gameState.playerUI.isPixiHidden} />
        </UseGameStateContext.Provider>
        <GameAreaInterface
          gameState={gameState}
          updaters={updaters}
        ></GameAreaInterface>
      </div>

      <div className="debug-overlay">
        <DebugOverlayComponent
          tick={gameState.tick}
          windowState={gameState.windowState}
        />
      </div>
      <div className="button-zone">
        <button
          className="button-pixi-toggle"
          style={{}}
          onClick={() => {
            updaters.playerUI.isPixiHidden.enqueueUpdate((it) => !it);
          }}
        >
          Toggle strategic view (hotkey: m)
        </button>
        <span> </span>
        <button
          onClick={() => {
            updaters.playerUI.isSidebarOpen.enqueueUpdate((it) => !it);
          }}
        >
          Toggle sidebar (hotkey: i)
        </button>
      </div>

      <SidebarsInterface gameState={gameState} updaters={updaters} />
      <KeyboardListenerComponent
        isTextBoxFocused={gameState.playerUI.isTextBoxFocused}
        updaters={updaters.intent}
      />
      <WindowListenerComponent updaters={updaters.windowState} />
    </div>
  );
}

export default App;
