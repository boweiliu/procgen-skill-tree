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
import { PersistenceComponent } from './components/PersistenceComponent';

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

  // DEPRECATED
  useEffect(() => {
    if (gameState.intent.newIntent.TOGGLE_SIDEBAR) {
      updaters.playerUI.isSidebarOpen.enqueueUpdate((it) => !it);
      //updaters.playerUI.isLeftSidebarOpen.enqueueUpdate((it) => !it);
      //updaters.playerUI.isRightSidebarOpen.enqueueUpdate((it) => !it);
    }
  }, [gameState.intent.newIntent.TOGGLE_SIDEBAR, updaters]);

  useEffect(() => {
    if (gameState.intent.newIntent.TOGGLE_LEFT_SIDEBAR) {
      updaters.playerUI.isLeftSidebarOpen.enqueueUpdate((it) => !it);
    }
  }, [gameState.intent.newIntent.TOGGLE_LEFT_SIDEBAR, updaters]);

  useEffect(() => {
    if (gameState.intent.newIntent.TOGGLE_RIGHT_SIDEBAR) {
      updaters.playerUI.isRightSidebarOpen.enqueueUpdate((it) => !it);
    }
  }, [gameState.intent.newIntent.TOGGLE_RIGHT_SIDEBAR, updaters]);

  useEffect(() => {
    if (gameState.intent.newIntent.TURN_OFF_SIDEBAR) {
      updaters.playerUI.isLeftSidebarOpen.enqueueUpdate((it) => false);
      updaters.playerUI.isRightSidebarOpen.enqueueUpdate((it) => false);
    }
  }, [gameState.intent.newIntent.TURN_OFF_SIDEBAR, updaters]);

  useEffect(() => {
    if (gameState.intent.newIntent.EXIT) {
      updaters.playerUI.isLeftSidebarOpen.enqueueUpdate((it) => false);
      updaters.playerUI.isRightSidebarOpen.enqueueUpdate((it) => false);
      updaters.playerUI.cursoredNodeLocation.enqueueUpdate((prev) => {
        return null;
      });
    }
  }, [gameState.intent.newIntent.EXIT, updaters]);

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
          Toggle big view (hotkey: b)
        </button>
        <span> </span>
        <button
          onClick={() => {
            updaters.playerUI.isSidebarOpen.enqueueUpdate((it) => !it);
            updaters.playerUI.isLeftSidebarOpen.enqueueUpdate((it) => !it);
            updaters.playerUI.isRightSidebarOpen.enqueueUpdate((it) => !it);
          }}
        >
          Toggle sidebars (hotkeys: t, y)
        </button>
      </div>

      <SidebarsInterface gameState={gameState} updaters={updaters} />
      <KeyboardListenerComponent
        isTextBoxFocused={gameState.playerUI.isTextBoxFocused}
        updaters={updaters.intent}
      />
      <WindowListenerComponent updaters={updaters.windowState} />
      <PersistenceComponent gameState={gameState} />
    </div>
  );
}

export default App;
