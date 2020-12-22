import React, { useEffect, useRef, useState } from "react";
import "./PixiComponent.css";
import { Application } from "../pixi/Application";
import { GameState, PointNodeRef } from "../data/GameState";
import { PixiWrapperComponent } from "./PixiWrapperComponent";
import { DeepReadonly, UpdaterGeneratorType } from "../lib/util/misc";

export type PixiComponentState = {
  innerWidth: number,
  innerHeight: number,
}

export function PixiComponent(props: {
  // gameState: DeepReadonly<GameState>,
  // gameStateUpdaters: UpdaterGeneratorType<GameState>,
  onFocusedNodeChange: (selection: PointNodeRef) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [pixiComponentState, setPixiComponentState] = useState<PixiComponentState>({ innerHeight: 0, innerWidth: 0});

  const [application, setApplication] = useState<Application>();
  function initializeApplication() {
    const newApp = new Application({
      originalWindowWidth: window.innerWidth,
      originalWindowHeight: window.innerHeight,
      ...props
    });
    // // application.register(container.current!);
    // container.current!.appendChild(newApp.app.view);
    // // container.current!.appendChild(application.app.view)
    // // console.log(container.current!)
    newApp.drawStart();
    setApplication(newApp);
  }

  useEffect(() => {
    return initializeApplication();
  }, []);

  window.onresize = () => {
    setPixiComponentState(old => {
      old.innerWidth = window.innerWidth;
      old.innerHeight = window.innerHeight;
      return { ...old };
    })

    application?.resize?.(window.innerWidth, window.innerHeight);
  };

  // application.rerender({
  //   gameState,
  //   pixiComponentState
  // })

  return (
    <>
      <PixiWrapperComponent application={application}/>
      <button onClick={() => {}}>draw circle</button>
      <button
        onClick={() => {
          if (application) {
            container.current!.removeChild(application.app.view);
          }
          initializeApplication();
        }}
      >
        [DEBUG] reset and rerender
      </button>
    </>
  );
}
