import React, { useEffect, useRef, useState } from "react";
import "./Area.css";
import { Application } from "../pixi/Application";
import { BaseGame } from "../johnfn_library/base_game";
import { TypesafeLoader } from "../johnfn_library/typesafe_loader";
import { BaseGameState } from "../johnfn_library/base_state";

/**
 * Initialize the pixi app
 */

    const game = new BaseGame({
      scale: 1,
      canvasWidth: 800,
      canvasHeight: 800,
      tileHeight: 16,
      tileWidth: 16,
      debugFlags: {},
      state: {
        tick: 0,
      },
      assets: new TypesafeLoader({}),
    });
const application = new Application(undefined, game.app);


export function Area(props: { whatever?: any }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    application.register(container.current!);

    application.drawStart();

    // container.current!.appendChild(game.app.view)

  }, []);


  return (
    <>
      <div ref={container} />
      <button onClick={() => application.drawCircle()}>draw circle</button>
      <button onClick={() => application.drawStart()}>rerender all</button>
    </>
  );
}
