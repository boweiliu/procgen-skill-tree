import "./DebugOverlayComponent.css"

import classnames from "classnames";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import COLORS, { colorToCss } from "../pixi/colors";
import { Vector2 } from "../lib/util/geometry/vector2";
import { FpsTracker } from "../lib/util/fpsTracker";
import { WindowState } from "../data/GameState";


export function DebugOverlayComponent(props: { tick: number, windowState: WindowState }) {
  const pixiFpsTracker = useRef(new FpsTracker());
  useEffect(() => {
    pixiFpsTracker.current.tick(0);
  }, [props.tick])

  return (
    <div className='text'>
      <div>{props.windowState.innerWidth}x{props.windowState.innerHeight}</div>
      <ReactFps />
      <div>UPS: {pixiFpsTracker.current.getFpsString()}</div>
    </div>
  )
}

function ReactFps() {
  const [counter, setCounter] = useState(0);
  const reactFpsTracker = useRef(new FpsTracker());

  useEffect(() => {
    setTimeout(() => {
      setCounter(it => it + 1);
      reactFpsTracker.current.tick(0);
    }, 5)
  }, [counter]);

  const fpsString = useMemo(() => reactFpsTracker.current.getFpsString(), [counter]);

  return (<div>RPS: {fpsString}</div>);

}