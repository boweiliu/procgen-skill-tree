import React, { useEffect, useRef, useState } from "react";
import "./PixiComponent.css";
import { Application } from "../pixi/Application";

/**
 * Initialize the pixi app
 */
// const game = new BaseGame({
//   scale: 1,
//   canvasWidth: 800,
//   canvasHeight: 800,
//   tileHeight: 16,
//   tileWidth: 16,
//   debugFlags: {},
//   state: {
//     tick: 0,
//   },
//   backgroundColor: 0xffffff, // TODO(bowei): fix this
// });
const application = new Application();

export function PixiComponent(props: { whatever?: any }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    application.register(container.current!);
    // container.current!.appendChild(application.app.view)

    application.drawStart();
  }, []);

  return (
    <>
      <div ref={container} />
      <button onClick={() => application.drawCircle()}>draw circle</button>
      <button onClick={() => application.drawStart()}>rerender all</button>
    </>
  );
}
