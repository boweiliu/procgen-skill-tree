import React, { useContext, useMemo, useState } from "react";
import "./PixiComponent.css";
import { GameState, WindowState } from "../data/GameState";
import { PixiWrapperComponent } from "./PixiWrapperComponent";
import { batchify, Lazy } from "../lib/util/misc";
import { PixiReactBridge } from "../pixi/PixiReactBridge";
import { UseGameStateContext } from "../contexts";
import { GameStateFactory } from "../dataFactory/GameStateFactory";

const initialApplication = new Lazy(() => new PixiReactBridge());

export function PixiComponent(props: { originalSetGameState: Function }) {
  const [_, gameStateUpdaters]  = useContext(UseGameStateContext);
  const [windowState, setWindowState] = useState<WindowState>({
    orientation: "original",
    innerHeight: window.innerHeight,
    innerWidth: window.innerWidth,
  });
  let [batchedSetWindowState, fireBatchedSetWindowState] =
    useMemo(() => batchify(setWindowState), [setWindowState]);

  // needed to prevent react double-render for some reason (dev mode??)
  const [application, setApplication] = useState(initialApplication.get());

  window.onresize = () => {
    batchedSetWindowState(old => {
      old.innerWidth = window.innerWidth;
      old.innerHeight = window.innerHeight;
      return { ...old };
    })
  };

  return (
    <>
      <PixiWrapperComponent application={application} windowState={windowState} fireBatchedSetWindowState={fireBatchedSetWindowState}/>
      <button onClick={() => {
        gameStateUpdaters.update((old) => {
          let newGameState = new GameStateFactory({}).create(old.worldGen.seed);
          old.playerSave = newGameState.playerSave;
          old.playerUI = newGameState.playerUI;
          old.worldGen = newGameState.worldGen;
          return old
        });
      }}>Reset game state</button>
      <button onClick={() => {
        application.pause();
        application.destroy();
        setApplication(new PixiReactBridge(undefined, true));

        let newGameState = new GameStateFactory({}).create(+new Date());
        props.originalSetGameState((old: GameState) => {
          old.playerSave = newGameState.playerSave;
          old.playerUI = newGameState.playerUI;
          old.worldGen = newGameState.worldGen;
          return old
        });
      }}>Get a fresh seed, reset, and rerender</button>
      <button
        onClick={() => {
          application.pause();
          application.destroy();
          setApplication(new PixiReactBridge(undefined, true));
        }}
      >
        Rerender pixi application
      </button>
    </>
  );
}
