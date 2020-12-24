import React, { useContext, useMemo, useState } from "react";
import "./PixiComponent.css";
import { GameState, PointNodeRef } from "../data/GameState";
import { PixiWrapperComponent } from "./PixiWrapperComponent";
import { batchify, Lazy } from "../lib/util/misc";
import { BaseApplication } from "../pixi/BaseApplication";
import { UseGameStateContext } from "../contexts";
import { GameStateFactory } from "../dataFactory/GameStateFactory";

export type PixiComponentState = {
  orientation: "original" | "rotated", // rotated === we are forcing landscape-in-portrait
  innerWidth: number,
  innerHeight: number,
}

const initialApplication = new Lazy(() => new BaseApplication({
  originalWindowWidth: window.innerWidth,
  originalWindowHeight: window.innerHeight,
}));

export function PixiComponent(props: { originalSetGameState: Function }) {
  const [gameState, gameStateUpdaters, fireBatchedSetGameState]  = useContext(UseGameStateContext);
  const [pixiComponentState, setPixiComponentState] = useState<PixiComponentState>({
    orientation: "original",
    innerHeight: window.innerHeight,
    innerWidth: window.innerWidth,
  });
  let [batchedSetPixiComponentState, fireBatchedSetPixiComponentState] =
    useMemo(() => batchify(setPixiComponentState), [setPixiComponentState]);

  const [application, setApplication] = useState(initialApplication.get());
  // const [application, setApplication] = useState(() => new BaseApplication({
    // originalWindowWidth: window.innerWidth,
    // originalWindowHeight: window.innerHeight,
  // }));

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
        setApplication(new BaseApplication({
          originalWindowWidth: window.innerWidth,
          originalWindowHeight: window.innerHeight,
        }, {}, true));

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
          setApplication(new BaseApplication({
            originalWindowWidth: window.innerWidth,
            originalWindowHeight: window.innerHeight,
          }, {}, true));
        }}
      >
        Rerender pixi application
      </button>
    </>
  );
}
