import React, { useContext, useEffect, useRef } from "react";
import { UseGameStateContext } from "../contexts";
import { GameState } from "../data/GameState";
import { DeepReadonly, UpdaterGeneratorType } from "../lib/util/misc";
import { Application } from "../pixi/Application";

export function PixiWrapperComponent(props: {
  application: Application | undefined
}) {
  const container = useRef<HTMLDivElement>(null);
  const [gameState, gameStateUpdaters]  = useContext(UseGameStateContext);

  useEffect(() => {
    if (props.application) {
      container.current!.appendChild(props.application.app.view);
    }
  }, [props.application]);

  // Trigger component rerender when game state is updated
  props.application?.rerender({
    gameState
  })

  return (
    <>
      <div ref={container} />
    </>
  );
}