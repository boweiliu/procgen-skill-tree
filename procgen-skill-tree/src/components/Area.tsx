import React, { useEffect, useRef, useState } from "react";
import "./Area.css";
import { Application } from "../pixi/Application";

/**
 * Initialize the pixi app
 */
const application = new Application();

export function Area(props: { whatever?: any }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    application.register(container.current!);

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
