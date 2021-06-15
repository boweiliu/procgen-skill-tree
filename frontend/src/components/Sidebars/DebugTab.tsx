import React, { useCallback, useEffect, useState } from 'react';
import { GameState } from '../../data/GameState';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import { Vector2 } from '../../lib/util/geometry/vector2';

export function DebugTabContent(props: {
  gameState: GameState; // definitely needs gameState.tick in order that this component updates regularly
  updaters: UpdaterGeneratorType2<GameState, GameState>;
  hidden: boolean;
}) {
  const { gameState } = props;
  const { tick } = gameState;

  const [lastUpdated, setLastUpdated] = useState(+new Date());
  const [slowRenderMsgs, setSlowRenderMsgs] = useState<string[]>([]);

  useEffect(() => {
    const now = new Date();
    const msSinceLastTick = +now - lastUpdated;
    if (msSinceLastTick > 30) {
      const msg = `Tick ${tick} took ${msSinceLastTick}ms at ${
        now.toTimeString().split(' ')[0]
      }`;
      console.log(msg);
      setSlowRenderMsgs((prev) => {
        return [msg, ...prev];
      });
    }
    setLastUpdated(+new Date());
  }, [tick, lastUpdated, setLastUpdated, setSlowRenderMsgs]);

  const virtualGridDimsTrigger = useCallback(() => {
    console.log('tried triggered update from debug tab');
    // NOTE(bowei): this apparently takes around 100ms alone. full jump takes ~200ms
    props.updaters.debug.retriggerVirtualGridDims.enqueueUpdate((prev) => {
      return () => {
        console.log('force triggered update from debug tab');
      };
    });
  }, [props.updaters]);

  const toggleScrollbars = useCallback(() => {
    props.updaters.debug.debugShowScrollbars?.enqueueUpdate((prev) => {
      const next = !prev;
      return next;
    });
  }, [props.updaters]);

  const gameAreaGridRerender = useCallback(() => {
    props.updaters.debug.rerenderGameAreaGrid.enqueueUpdate((prev) => {
      return () => {
        console.log('force triggered react rerender from debug tab');
      };
    });
  }, [props.updaters]);

  const onDisableScrollJump = useCallback(() => {
    props.updaters.debug.enableScrollJump.enqueueUpdate(() => {
      return false;
    });
  }, [props.updaters]);

  const onEnableScrollJump = useCallback(() => {
    props.updaters.debug.enableScrollJump.enqueueUpdate(() => {
      return true;
    });
  }, [props.updaters]);

  const forceVirtualGridJump = useCallback(() => {
    props.updaters.debug.getForceJumpOffset.enqueueUpdate((prev) => {
      return () => {
        console.log('force triggered virtual jump only');
        return new Vector2(1, 2);
      };
    });
  }, [props.updaters]);

  const addDebugOffsetX = useCallback(() => {
    props.updaters.debug.getOffsetX.enqueueUpdate((prev) => {
      const offsetX = prev() || 0;
      return () => {
        return offsetX + 1;
      };
    });
  }, [props.updaters]);

  const flipCursored = useCallback(() => {
    props.updaters.debug.isFlipCursored.enqueueUpdate((prev) => {
      const flipCursored = prev() || false;
      return () => {
        return !flipCursored;
      };
    });
  }, [props.updaters]);

  const toggleTextBoxFocused = useCallback(() => {
    props.updaters.playerUI.isTextBoxFocused.enqueueUpdate((prev) => {
      const isTextBoxFocused = !prev;
      console.log({ isTextBoxFocused });
      return isTextBoxFocused;
    });
  }, [props.updaters]);

  const saveLocalStorage = useCallback(() => {
    // WIP
    // window.localStorage.setItem('gameState', props.gameState)
  }, [props.gameState]);
  const loadLocalStorage = useCallback(() => {
    // WIP
    // window.localStorage.setItem('gameState', props.gameState)
  }, [props.updaters]);

  if (props.hidden) {
    return <> </>;
  }
  return (
    <>
      <div> debug tab </div>
      <div className="tab-content-body">
        <br></br>
        <div>Recent slow renders:</div>
        {slowRenderMsgs.slice(0, 5).map((it, idx) => {
          return <div key={idx}>{it}</div>;
        })}
        <br></br>
      </div>
      <div> buttons </div>
      <div className="tab-content-body">
        <br></br>
        <div>
          <button onClick={toggleScrollbars}>Toggle scrollbars</button>
        </div>
        <div>
          <button onClick={virtualGridDimsTrigger}>
            Trigger virtual grid dims rerender
          </button>
        </div>
        <div>
          <button onClick={gameAreaGridRerender}>
            Trigger only virtual game area grid react rerender
          </button>
        </div>
        <div>
          <button onClick={onDisableScrollJump}>
            Disable scroll jump trigger
          </button>
        </div>
        <div>
          <button onClick={onEnableScrollJump}>
            Reenable scroll jump trigger
          </button>
        </div>
        <div>
          <button onClick={forceVirtualGridJump}>
            Force virtual grid jump only
          </button>
        </div>
        <div>
          <button onClick={addDebugOffsetX}>add weird x offset to grid</button>
        </div>
        <div>
          <button onClick={flipCursored}>
            weird flip cursored state on all nodes
          </button>
        </div>
        <div>
          <button onClick={toggleTextBoxFocused}>
            toggle text box focused
          </button>
        </div>
        <div>
          <button onClick={saveLocalStorage}>
            save state to local storage
          </button>
        </div>
        <div>
          <button onClick={loadLocalStorage}>
            load state from local storage
          </button>
        </div>
      </div>
    </>
  );
}
