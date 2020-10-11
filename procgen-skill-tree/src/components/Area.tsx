import React, { useEffect, useRef } from "react";
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
export function Area(props: { data: string }) {
  let { data } = props;

  const canvasRef = useRef(null);

  const [width, height, pixelRatio] = [100, 100, 1.0];
  useEffect(() => {
    const canvas: HTMLCanvasElement = canvasRef.current as any;
    const ctx = canvas.getContext("2d")!;
    ctx.save();
    ctx.scale(pixelRatio, pixelRatio);
    ctx.fillStyle = "hsl(0, 0%, 95%)";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, width / 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth * 0.875}
      height={window.innerHeight * 0.875}
      onClick={(e) => {
        alert(e.clientX);
      }}
    />
  );
}
