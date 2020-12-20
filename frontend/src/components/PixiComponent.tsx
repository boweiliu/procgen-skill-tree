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
// let application = new Application({ originalWindowWidth: window.innerHeight * .75, originalWindowHeight: window.innerHeight * .75 });
let application = new Application({ originalWindowWidth: window.innerWidth, originalWindowHeight: window.innerHeight });

export function PixiComponent(props: {
  whatever?: any;
  onFocusedNodeChange: (...x: any) => void;
}) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // application.register(container.current!);
    container.current!.appendChild(application.app.view);
    // container.current!.appendChild(application.app.view)
    // console.log(container.current!)

    application.drawStart();
  }, []);

  window.onresize = () => {
    application.resize(window.innerWidth, window.innerHeight);
  };

  return (
    <>
      <div ref={container} />
      <button onClick={() => {}}>draw circle</button>
      <button
        onClick={() => {
          container.current!.removeChild(application.app.view);
          // application = new Application({ originalWindowWidth: window.innerHeight * .75, originalWindowHeight: window.innerHeight * .75 });
          application = new Application({
            originalWindowWidth: window.innerWidth,
            originalWindowHeight: window.innerHeight,
          });
          container.current!.appendChild(application.app.view);
          application.drawStart();
        }}
      >
        [DEBUG] reset and rerender
      </button>
    </>
  );
}
