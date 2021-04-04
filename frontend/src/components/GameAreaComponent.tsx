import "./GameAreaComponent.css"

import classnames from "classnames";
import React, { useCallback, useMemo, useState } from "react";
import COLORS, { colorToCss } from "../pixi/colors";
import { Vector2 } from "../lib/util/geometry/vector2";


/**
 * 
 * 
 */
export function GameAreaComponent(props: { hidden: boolean, appSize: Vector2 }) {
  // Approximations for sqrt(3)/2 == ratio of an equilateral triangle's height to its width:
  // 6/7, 13/15, 26/30, 45/52, 58/67, 84/97, 181/209
  // for divisibility -- recommend 26/30, 52/60, 104/120, 168/194, 180/208, 232/268, 336/388
  return (
    <div className="game-area" hidden={props.hidden} style={{
      width: props.appSize.x,
      height: props.appSize.y,
      backgroundColor: colorToCss(COLORS.backgroundBlue),
    }}>
      <div id="virtual-game-area" style={{ width: "200%", height: "200%" }}> {/* https://stackoverflow.com/questions/1015809/how-to-get-floating-divs-inside-fixed-width-div-to-continue-horizontally */}
        <div id="allocatable node" style={{
          width: "268px", height: "232px",
          // https://stackoverflow.com/questions/10170759/how-to-put-some-divs-in-a-row
          float: "left", display: "inline-block"
        }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <div style={{
              width: "40px", height: "40px", border: "black", backgroundColor: "#ccaaee",
              borderRadius: "50%", borderStyle: "solid", borderWidth: "2px", borderColor: "#444444",
            }}>
            </div>
          </div>
          </div>
        <div id="allocatable node" style={{
          width: "640px", height: "640px", backgroundColor: "#440088",
          float: "left", display: "inline-block"
        }}>
          node2
          </div>
        <div id="allocatable node" style={{
          width: "640px", height: "640px", backgroundColor: "#880088",
          float: "left", display: "inline-block"
        }}>
          node3
          </div>
      </div>
      <div id="row" style={{ width: "150%" }}>
        <div id="allocatable node" style={{
          width: "640px", height: "640px", backgroundColor: "#446688",
          float: "left", display: "inline-block"
        }}>
          node
          </div>
        <div id="allocatable node" style={{
          width: "640px", height: "640px", backgroundColor: "#440088",
          float: "left", display: "inline-block"
        }}>
          node2
          </div>
        <div id="allocatable node" style={{
          width: "640px", height: "640px", backgroundColor: "#880088",
          float: "left", display: "inline-block"
        }}>
          node3
          </div>
      </div>
      <div id="row" style={{ width: "150%" }}>
        <div id="allocatable node" style={{
          width: "640px", height: "640px", backgroundColor: "#446688",
          float: "left", display: "inline-block"
        }}>
          node
          </div>
        <div id="allocatable node" style={{
          width: "640px", height: "640px", backgroundColor: "#440088",
          float: "left", display: "inline-block"
        }}>
          node2
          </div>
        <div id="allocatable node" style={{
          width: "640px", height: "640px", backgroundColor: "#880088",
          float: "left", display: "inline-block"
        }}>
          node3
          </div>
      </div>
    </div>
  );
}