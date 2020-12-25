import React, { useContext, useEffect, useRef } from "react";
import { UseGameStateContext } from "../contexts";
import { PixiReactBridge } from "../pixi/PixiReactBridge";
import { WindowState } from "../data/GameState";

export function PixiWrapperComponent(props: {
  application: PixiReactBridge,
  windowState: WindowState,
  fireBatchedSetWindowState: () => void,
}) {
  const { application, windowState } = props;
  const container = useRef<HTMLDivElement>(null);
  const [gameState, gameStateUpdaters, fireBatchedSetGameState]  = useContext(UseGameStateContext);
  const fireBatch = () => {
      fireBatchedSetGameState();
      props.fireBatchedSetWindowState();
    }

  useEffect(() => {
    // this block only triggers if a new application instance is created.
    // first remove old application
    // const oldLength = container.current!.childNodes.length;
    for (let i = container.current!.childNodes.length - 1; i >= 0; i--) {
      container.current!.removeChild(container.current!.childNodes[i]);
    }
    // if (oldLength != 0) {
    //   return;
    // }
    // add the application
    container.current!.appendChild(application.app.view);
  }, [application]);

  // const prevRef = useRef<Const<GameState>>();
  // useEffect(() => {
  //   prevRef.current = gameState;
  // });
  // const prevGameState = prevRef.current;

  // Trigger component render on first load and also when game state is updated
  application.rerender({
    args: {
      fireBatch, 
      isSecondConstructorCall: false,
    },
    updaters: gameStateUpdaters,
    windowState,
    gameState,
  })

  return (
    <>
      <div ref={container} />
    </>
  );
}