import React, { useContext, useEffect, useRef, useState } from "react";
import { UseGameStateContext } from "../contexts";
import { PixiReactBridge } from "../pixi/PixiReactBridge";
import { WindowState } from "../data/GameState";
import { Lazy } from "../lib/util/misc";

const initialApplication = new Lazy(() => new PixiReactBridge());

export function PixiWrapperComponent() {
  const [application, setApplication] = useState(initialApplication.get());
  const container = useRef<HTMLDivElement>(null);
  const [gameState, gameStateUpdaters, fireBatchedSetGameState]  = useContext(UseGameStateContext);

  useEffect(() => {
    // remove old application if it exists
    for (let i = container.current!.childNodes.length - 1; i >= 0; i--) {
      container.current!.removeChild(container.current!.childNodes[i]);
    }
    // add the application
    container.current!.appendChild(application.app.view);
  }, [application]);


  // Trigger component render on first load and also when game state is updated
  application.rerender({
    args: {
      fireBatch: fireBatchedSetGameState, 
      isSecondConstructorCall: false,
    },
    updaters: gameStateUpdaters,
    gameState,
  })

  return (
    <>
      <div ref={container} hidden={gameState.playerUI.isPixiHidden} />
    </>
  );
}