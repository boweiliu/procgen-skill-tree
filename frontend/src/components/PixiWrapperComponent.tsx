import React, { useContext, useEffect, useRef, useState } from 'react';
import { UseGameStateContext } from '../contexts';
import { PixiReactBridge } from '../pixi/PixiReactBridge';
import { Lazy } from '../lib/util/lazy';

const initialApplication = new Lazy(() => new PixiReactBridge());

/**
 * React side of a pixi-react bridge. This react component owns the div which own the canvas element,
 * and send rerender props updates to pixi application when react causes state to be updated.
 */
export function PixiWrapperComponent(props: { hidden: boolean }) {
  const [application] = useState(initialApplication.get());
  const container = useRef<HTMLDivElement>(null);
  const [gameState, gameStateUpdaters, fireBatchedSetGameState] = useContext(
    UseGameStateContext
  );

  useEffect(() => {
    // remove old application if it exists
    for (let i = container.current!.childNodes.length - 1; i >= 0; i--) {
      container.current!.removeChild(container.current!.childNodes[i]);
    }
    // add the application
    container.current!.appendChild(application.app.view);
  }, [application]);

  // Trigger component render on first load and also when game state is updated
  // wrap in useeffect to avoid triggering every react render (130+ UPS) and only check every pixi render (60fps)
  useEffect(() => {
    application.rerender({
      args: {
        fireBatch: fireBatchedSetGameState,
        isSecondConstructorCall: false,
      },
      updaters: gameStateUpdaters,
      gameState,
    });
  }, [application, fireBatchedSetGameState, gameStateUpdaters, gameState]);

  return (
    <>
      <div ref={container} hidden={props.hidden} style={{}} />
    </>
  );
}
