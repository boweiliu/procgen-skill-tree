import "./GameAreaComponent.css"

import classnames from "classnames";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import COLORS, { colorToCss } from "../pixi/colors";
import { Vector2 } from "../lib/util/geometry/vector2";
import { appSizeFromWindowSize } from "../data/GameState";


/**
 * 
 * 
 */
export function GameAreaComponent(props: { hidden: boolean, appSize: Vector2 }) {
  // Approximations for sqrt(3)/2 == ratio of an equilateral triangle's height to its width:
  // 6/7, 13/15, 26/30, 45/52, 58/67, 84/97, 181/209
  // for divisibility -- recommend 26/30, 52/60, 104/120, 168/194, 180/208, 232/268, 336/388
  const gridWidth = 268;
  const gridHeight = 232;

  const hexCenterRadius = 20;
  const hexBlockStyle = { width: gridWidth + "px", height: gridHeight + "px" };
  const hexHalfBlockStyle = { width: gridWidth/2 + "px", height: gridHeight + "px" };
  const hexCenterStyle = {
    width: (hexCenterRadius * 2) + "px",
    height: (hexCenterRadius * 2) + "px",
    backgroundColor: colorToCss(COLORS.nodePink),
    borderColor: colorToCss(COLORS.nodeBorder),
  }

  // 200% - 120 FPS; 300% - 75 FPS; 500% - 30 FPS
  const virtualAreaSize = props.appSize.multiply(3);
  // if appSize >= 11.5 * gridWidth then we can fit 11 hex blocks per row
  const numBlocksPerRow = Math.floor((virtualAreaSize.x / gridWidth) - 0.5);
  const numPairsOfRows = Math.floor(virtualAreaSize.y / gridHeight / 2);
  useEffect(() => console.log(`got ${numBlocksPerRow} x ${numPairsOfRows * 2} hex grid`), [numBlocksPerRow, numPairsOfRows]);

/* https://stackoverflow.com/questions/1015809/how-to-get-floating-divs-inside-fixed-width-div-to-continue-horizontally */
  let makeRow = () => {
    return (
      <div className="hex-block-row">
        {Array(numBlocksPerRow).fill(0).map(() => (
          <div className="hex-block" style={hexBlockStyle}>
            <div className="hex-center" style={hexCenterStyle}>
            </div>
          </div>
        ))}
        <div className="hex-block" style={hexHalfBlockStyle}> </div>
      </div>
    );
  }
  let makeOffsetRow = () => {
    return (
      <div className="hex-block-row">
        <div className="hex-block" style={hexHalfBlockStyle}> </div>
        {Array(numBlocksPerRow).fill(0).map(() => (
          <div className="hex-block" style={hexBlockStyle}>
            <div className="hex-center" style={hexCenterStyle}>
            </div>
          </div>
        ))}
      </div>
    );
  }
  /**
   * See pointer/mouse, over/enter/out/leave, event propagation documentation
   * https://www.w3schools.com/jquery/tryit.asp?filename=tryjquery_event_mouseenter_mouseover#:~:text=mouseenter%20and%20mouseover.-,The%20mouseover%20event%20triggers%20when%20the%20mouse%20pointer%20enters%20the,moved%20over%20the%20div%20element.
   * https://stackoverflow.com/questions/4697758/prevent-onmouseout-when-hovering-child-element-of-the-parent-absolute-div-withou
   * https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
   * https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Examples#example_5_event_propagation
   * https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation
   * https://developer.mozilla.org/en-US/docs/Web/API/Event/target
   * https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget
   * https://stackoverflow.com/questions/55546973/react-onmouseenter-event-triggering-on-child-element
   */
  return (
    <div className="game-area" hidden={props.hidden} style={{
      width: props.appSize.x,
      height: props.appSize.y,
      backgroundColor: colorToCss(COLORS.backgroundBlue),
    }}>
      <div className="virtual-game-area" style={{
        width: virtualAreaSize.x,
        height: virtualAreaSize.y,
      }} onPointerOver={(e: React.PointerEvent) => {
        console.log(e);
      }} onClick={(e: React.MouseEvent) => {
        console.log(e);
      }}>
        {Array(numPairsOfRows).fill(0).map(() => (
          <>
            {makeRow()}
            {makeOffsetRow()}
          </>
        ))}
      </div>
    </div>
  );
}