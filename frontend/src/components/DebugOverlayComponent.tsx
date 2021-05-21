import './DebugOverlayComponent.css';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FpsTracker } from '../lib/util/fpsTracker';
import { WindowState } from '../data/GameState';

/**
 * Small overlay in the top left which displays window dimensions and fps.
 */
export function DebugOverlayComponent(props: {
  tick: number;
  windowState: WindowState;
}) {
  const pixiFpsTracker = useRef(new FpsTracker());
  useEffect(() => {
    pixiFpsTracker.current.tick(0);
  }, [props.tick]);

  return (
    <div className="text">
      <div>
        {props.windowState.innerWidth}x{props.windowState.innerHeight}
      </div>
      <ReactFps />
      <div>UPS: {pixiFpsTracker.current.getFpsString()}</div>
    </div>
  );
}

function ReactFps() {
  const [counter, setCounter] = useState(0);
  const reactFpsTracker = useRef(new FpsTracker());

  useEffect(() => {
    const timer = setTimeout(() => {
      setCounter((it) => it + 1);
      reactFpsTracker.current.tick(0);
    }, 5);
    return () => clearTimeout(timer);
  }, [counter]);

  const fpsString = useMemo(() => {
    if (counter >= 0) {
      return reactFpsTracker.current.getFpsString();
    }
    return '';
  }, [counter]);

  return <div>RPS: {fpsString}</div>;
}
