import React, { useContext, useEffect, useRef } from "react";
import { UseGameStateContext } from "../contexts";
import { Application } from "../pixi/Application";
import { PixiComponentState } from "./PixiComponent";

export function PixiWrapperComponent(props: {
  application: Application,
  pixiComponentState: PixiComponentState,
}) {
  const { application, pixiComponentState } = props;
  const container = useRef<HTMLDivElement>(null);
  const [gameState]  = useContext(UseGameStateContext);

  useEffect(() => {
    // this block only triggers if a new application instance is created.
    // first remove old application
    for (let i = container.current!.childNodes.length - 1; i >= 0; i--) {
      container.current!.removeChild(container.current!.childNodes[i]);
    }
    // add the application
    container.current!.appendChild(application.app.view);
  }, [application.app.view]);

  // Trigger component rerender when game state is updated
  application.rerender({
    gameState,
    pixiComponentState
  })

  return (
    <>
      <div ref={container} />
    </>
  );
}