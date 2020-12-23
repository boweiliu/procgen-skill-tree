import React, { useContext, useEffect, useRef } from "react";
import { UseGameStateContext } from "../contexts";
import { GameState } from "../data/GameState";
import { DeepReadonly } from "../lib/util/misc";
import { Application } from "../pixi/Application";
import { PixiComponentState } from "./PixiComponent";

export function PixiWrapperComponent(props: {
  application: Application,
  pixiComponentState: PixiComponentState,
}) {
  const { application, pixiComponentState } = props;
  const container = useRef<HTMLDivElement>(null);
  const [gameState, gameStateUpdaters]  = useContext(UseGameStateContext);

  useEffect(() => {
    // this block only triggers if a new application instance is created.
    // first remove old application
    for (let i = container.current!.childNodes.length - 1; i >= 0; i--) {
      container.current!.removeChild(container.current!.childNodes[i]);
    }
    // add the application
    container.current!.appendChild(application.app.view);
  }, [application.app.view]);

  const prevRef = useRef<DeepReadonly<GameState>>();
  useEffect(() => {
    prevRef.current = gameState;
  });
  const prevGameState = prevRef.current;

  // Trigger component rerender when game state is updated
  application.rerender({
    pixiComponentState,
    gameState,
    prevGameState,
    gameStateUpdaters,
  })

  return (
    <>
      <div ref={container} />
    </>
  );
}