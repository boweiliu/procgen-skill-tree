import './App.css';

import classnames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DebugOverlayComponent } from './components/DebugOverlayComponent';
import { GameAreaComponent } from './components/GameArea/GameAreaComponent';
import { GameAreaStateManager } from './components/GameArea/GameAreaStateManager';
import { KeyboardListenerComponent } from './components/KeyboardListenerComponent';
import { PixiWrapperComponent } from './components/PixiWrapperComponent';
import { WindowListenerComponent } from './components/WindowListenerComponent';
import { UseGameStateContext } from './contexts';
import { GameState, appSizeFromWindowSize } from './data/GameState';
import { GameStateFactory } from './game/GameStateFactory';
import { batchifySetState } from './lib/util/batchify';
import { Vector2 } from './lib/util/geometry/vector2';
import { Lazy } from './lib/util/lazy';
import {
  UpdaterGeneratorType2,
  updaterGenerator2,
} from './lib/util/updaterGenerator';
import COLORS, { colorToCss } from './pixi/colors';
import { AllocateNodeAction } from './game/actions/AllocateNode';
import Sidebar from './components/Sidebar';
import Tabs, { Tab } from './components/Tabs';

const initialGameState: Lazy<GameState> = new Lazy(() =>
  new GameStateFactory({}).create(+new Date())
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
  const appSize = useMemo(() => {
    return appSizeFromWindowSize(
      new Vector2(
        gameState.windowState.innerWidth,
        gameState.windowState.innerHeight
      )
    );
  }, [gameState.windowState.innerWidth, gameState.windowState.innerHeight]);
  //*/
  const gameStateContextValue = useMemo(() => {
    return [gameState, updaters, fireBatch] as [
      GameState,
      UpdaterGeneratorType2<GameState, GameState>,
      () => void
    ];
  }, [gameState, updaters, fireBatch]);

  // const gameAreaStateManager: any | null = null;
  // gameAreaStateManager?.makeProps({ gameState, appSize });

  useEffect(() => {
    console.log('maybe toggling strategic view');
    if (gameState.intent.newIntent.TOGGLE_STRATEGIC_VIEW) {
      updaters.playerUI.isPixiHidden.enqueueUpdate((it) => !it);
    }
  }, [gameState.intent.newIntent.TOGGLE_STRATEGIC_VIEW]);

  return (
    <div className={classnames({ App: true })}>
      <div className="entire-area">
        <UseGameStateContext.Provider value={gameStateContextValue}>
          <PixiWrapperComponent hidden={gameState.playerUI.isPixiHidden} />
        </UseGameStateContext.Provider>
        <GameAreaStateManager
          gameState={gameState}
          updaters={updaters}
          actions={{ allocateNode: new AllocateNodeAction(updaters) }}
        >
          {/*<GameAreaComponent
            hidden={!gameState.playerUI.isPixiHidden}
            appSize={appSize}
          />*/}
        </GameAreaStateManager>
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
          Toggle strategic view (or click x)
        </button>
      </div>

      <Sidebar hidden={true} setSidebarHidden={() => {}}>
        <Tabs
          onClick={() => {}}
          value={0}
          labels={['foo', 'bar']}
          onChange={(value: number) => {}}
          active
        ></Tabs>
        <br />
        content
      </Sidebar>
      <KeyboardListenerComponent
        intent={gameState.intent}
        updaters={updaters.intent}
      ></KeyboardListenerComponent>
      <WindowListenerComponent
        updaters={updaters.windowState}
      ></WindowListenerComponent>
    </div>
  );
}

export default App;
