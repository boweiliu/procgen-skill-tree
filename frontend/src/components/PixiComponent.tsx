import React, { useEffect, useRef, useState } from "react";
import "./PixiComponent.css";
import { Application } from "../pixi/Application";
import { PointNodeRef } from "../data/GameState";

export function PixiComponent({
  onFocusedNodeChange,
}: {
  whatever?: any;
  onFocusedNodeChange: (selection: PointNodeRef) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [application, setApplication] = useState<Application>();
  function initializeApplication() {
    const newApp = new Application({
      originalWindowWidth: window.innerWidth,
      originalWindowHeight: window.innerHeight,
      onFocusedNodeChange,
    });
    // application.register(container.current!);
    container.current!.appendChild(newApp.app.view);
    // container.current!.appendChild(application.app.view)
    // console.log(container.current!)
    newApp.drawStart();
    setApplication(newApp);
  }

  useEffect(() => {
    return initializeApplication();
  }, []);

  window.onresize = () => {
    application?.resize?.(window.innerWidth, window.innerHeight);
  };

  return (
    <>
      <div ref={container} />
      <button onClick={() => {}}>draw circle</button>
      <button
        onClick={() => {
          if (application) {
            container.current!.removeChild(application.app.view);
          }
          initializeApplication();
        }}
      >
        [DEBUG] reset and rerender
      </button>
    </>
  );
}
