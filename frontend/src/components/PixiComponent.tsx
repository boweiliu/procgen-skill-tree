import React, { useState } from "react";
import "./PixiComponent.css";
import { Application } from "../pixi/Application";
import { PointNodeRef } from "../data/GameState";
import { PixiWrapperComponent } from "./PixiWrapperComponent";

export type PixiComponentState = {
  orientation: "original" | "rotated",
  innerWidth: number,
  innerHeight: number,
}

export function PixiComponent(props: {
  // gameState: DeepReadonly<GameState>,
  // gameStateUpdaters: UpdaterGeneratorType<GameState>,
  onFocusedNodeChange: (selection: PointNodeRef) => void;
}) {
  const [pixiComponentState, setPixiComponentState] = useState<PixiComponentState>({
    orientation: "original",
    innerHeight: window.innerHeight,
    innerWidth: window.innerWidth,
  });

  const [application, setApplication] = useState<Application>(
    new Application({
      originalWindowWidth: window.innerWidth,
      originalWindowHeight: window.innerHeight,
      ...props
    })
  );

  window.onresize = () => {
    setPixiComponentState(old => {
      old.innerWidth = window.innerWidth;
      old.innerHeight = window.innerHeight;
      return { ...old };
    })

    // application?.resize?.(window.innerWidth, window.innerHeight);
  };

  return (
    <>
      <PixiWrapperComponent application={application} pixiComponentState={pixiComponentState}/>
      <button onClick={() => {}}>draw circle</button>
      <button
        onClick={() => {
          setApplication(new Application({
            originalWindowWidth: window.innerWidth,
            originalWindowHeight: window.innerHeight,
            ...props
          }))
        }}
      >
        [DEBUG] reset and rerender
      </button>
    </>
  );
}
