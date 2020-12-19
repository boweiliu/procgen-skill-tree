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
const application = new Application({ originalWidth: window.innerHeight * .75, originalHeight: window.innerHeight * .75 });

export function PixiComponent(props: { whatever?: any }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    application.register(container.current!);
    // container.current!.appendChild(application.app.view)

    application.drawStart();
  }, []);

  window.onresize = () => {
    application.resize(window.innerWidth, window.innerHeight);
  }

  return (
    <>
      <div ref={container} />
      <button onClick={() => { }}>draw circle</button>
      <button onClick={() => application.drawStart()}>rerender all</button>
    </>
  );
}
