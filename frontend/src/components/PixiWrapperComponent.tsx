import React, { useContext, useEffect, useRef } from "react";
import { UseGameStateContext } from "../contexts";
import { PixiReactBridge } from "../pixi/PixiReactBridge";
import { PixiComponentState } from "./PixiComponent";

export function PixiWrapperComponent(props: {
  application: PixiReactBridge,
  pixiComponentState: PixiComponentState,
  fireBatchedSetPixiComponentState: () => void,
}) {
  const { application, pixiComponentState } = props;
  const container = useRef<HTMLDivElement>(null);
  const [gameState, gameStateUpdaters, fireBatchedSetGameState]  = useContext(UseGameStateContext);
  const fireBatch = () => {
      fireBatchedSetGameState();
      props.fireBatchedSetPixiComponentState();
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

  // const prevRef = useRef<DeepReadonly<GameState>>();
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
    pixiComponentState,
    gameState,
  })

  return (
    <>
      <div ref={container} />
    </>
  );
}