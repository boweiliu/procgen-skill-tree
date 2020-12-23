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

  function initializeApplication(setApplication: any) {
    const newApp = new Application({
      originalWindowWidth: window.innerWidth,
      originalWindowHeight: window.innerHeight,
    } as any);
    // // application.register(container.current!);
    // container.current!.appendChild(newApp.app.view);
    // // container.current!.appendChild(application.app.view)
    // // console.log(container.current!)
    // newApp.drawStart(); // uncommenting this line is very bad
    setApplication(newApp);
  }

export function PixiComponent(props: {
  // gameState: DeepReadonly<GameState>,
  // gameStateUpdaters: UpdaterGeneratorType<GameState>,
  onFocusedNodeChange: (selection: PointNodeRef) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [pixiComponentState, setPixiComponentState] = useState<PixiComponentState>({ innerHeight: 0, innerWidth: 0});

  const [application, setApplication] = useState<Application>();

  useEffect(() => {
    return initializeApplication(setApplication);
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
          initializeApplication(setApplication);
        }}
      >
        [DEBUG] reset and rerender
      </button>
    </>
  );
}
