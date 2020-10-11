import React, { useEffect, useRef, useState } from "react";
import "./Area.css";

/**
 * HTML canvas react typescript references:
 * https://reactjs.org/docs/hooks-reference.html#useref
 * https://itnext.io/using-react-hooks-with-canvas-f188d6e416c0
 * https://codesandbox.io/s/8k7qro3wvj
 * https://stackoverflow.com/questions/13669404/typescript-problems-with-type-system
 * https://medium.com/@martin.crabtree/react-creating-an-interactive-canvas-component-e8e88243baf6
 * https://codepen.io/techslides/pen/zowLd
 * https://www.w3schools.com/html/html5_canvas.asp
 * https://eloquentjavascript.net/17_canvas.html
 * @param props
 */

import { Application } from "../pixi/Application";
const application = new Application();

export function Area(props: { data: string }) {
  let { data } = props;
  const container = useRef<any>(null);

  useEffect(() => {
    container.current?.appendChild(application.app.view);

    application.drawRectangle();
  }, []);

  return (
    <>
      <div ref={container} />
      <button onClick={() => application.drawCircle()}>text</button>
    </>
  );
}
