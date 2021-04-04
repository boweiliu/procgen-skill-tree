import React, { useContext, useMemo, useState } from "react";
import "./PixiComponent.css";
import { GameState, WindowState } from "../data/GameState";
import { PixiWrapperComponent } from "./PixiWrapperComponent";
import { Lazy } from "../lib/util/misc";
import { PixiReactBridge } from "../pixi/PixiReactBridge";
import { UseGameStateContext } from "../contexts";
import { GameStateFactory } from "../game/GameStateFactory";
import { batchifySetState } from "../lib/util/batchify";

const initialApplication = new Lazy(() => new PixiReactBridge());

export function PixiComponent(props: { originalSetGameState: Function }) {
  // eslint-disable-next-line
  const [_, gameStateUpdaters] = useContext(UseGameStateContext);

  // needed to prevent react double-render for some reason (dev mode??)
  const [application, setApplication] = useState(initialApplication.get());

  return (
    <>
      <PixiWrapperComponent
        application={application}
      />
    </>
  );
}
