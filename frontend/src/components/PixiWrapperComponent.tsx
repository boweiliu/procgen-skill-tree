import React, { useContext, useEffect, useRef } from "react";
import { UseGameStateContext } from "../contexts";
import { PixiReactBridge } from "../pixi/PixiReactBridge";
import { WindowState } from "../data/GameState";

export function PixiWrapperComponent(props: {
  application: PixiReactBridge,
}) {
  const { application } = props;
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