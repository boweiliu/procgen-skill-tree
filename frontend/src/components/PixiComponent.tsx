import React, { useMemo, useState } from "react";
import "./PixiComponent.css";
import { Application } from "../pixi/Application";
import { PointNodeRef } from "../data/GameState";
import { PixiWrapperComponent } from "./PixiWrapperComponent";
import { batchify, Lazy } from "../lib/util/misc";

export type PixiComponentState = {
  orientation: "original" | "rotated", // rotated === we are forcing landscape-in-portrait
  innerWidth: number,
  innerHeight: number,
}

const initialApplication = new Lazy(() => new Application({
  originalWindowWidth: window.innerWidth,
  originalWindowHeight: window.innerHeight,
}));

export function PixiComponent(props: {
  onFocusedNodeChange: (selection: PointNodeRef) => void;
}) {
  const [pixiComponentState, setPixiComponentState] = useState<PixiComponentState>({
    orientation: "original",
    innerHeight: window.innerHeight,
    innerWidth: window.innerWidth,
  });
  let [batchedSetPixiComponentState, fireBatchedSetPixiComponentState] =
    useMemo(() => batchify(setPixiComponentState), [setPixiComponentState]);

  const [application, setApplication] = useState<Application>(initialApplication.get());

  window.onresize = () => {
    batchedSetPixiComponentState(old => {
      old.innerWidth = window.innerWidth;
      old.innerHeight = window.innerHeight;
      return { ...old };
    })
  };

  return (
    <>
      <PixiWrapperComponent application={application} pixiComponentState={pixiComponentState} fireBatchedSetPixiComponentState={fireBatchedSetPixiComponentState}/>
      <button onClick={() => {}}>draw circle</button>
      <button
        onClick={() => {
          setApplication(new Application({
            originalWindowWidth: window.innerWidth,
            originalWindowHeight: window.innerHeight,
          }))
        }}
      >
        [DEBUG] reset and rerender
      </button>
    </>
  );
}
