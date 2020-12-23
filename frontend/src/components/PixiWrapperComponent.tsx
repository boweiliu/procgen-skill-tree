import React, { useContext, useEffect, useRef } from "react";
import { UseGameStateContext } from "../contexts";
import { Application } from "../pixi/Application";

export function PixiWrapperComponent(props: {
  application: Application | undefined
}) {
  const container = useRef<HTMLDivElement>(null);
  const [gameState]  = useContext(UseGameStateContext);

  useEffect(() => {
    // this block only triggers if a new application instance is created.
    // first remove old application
    for (let i = container.current!.childNodes.length - 1; i >= 0; i--) {
      container.current!.removeChild(container.current!.childNodes[i]);
    }
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