import "./GameAreaComponent.css"

import classnames from "classnames";
import React, { useCallback, useMemo, useState } from "react";
import COLORS, { colorToCss } from "../pixi/colors";
import { Vector2 } from "../lib/util/geometry/vector2";


export function GameAreaComponent(props: { hidden: boolean, appSize: Vector2 }) {
  return (
    <div className="game-area" hidden={props.hidden} style={{
      width: props.appSize.x,
      height: props.appSize.y,
      backgroundColor: colorToCss(COLORS.backgroundBlue),
    }}>
      <div id="row" style={{ width: "150%" }}> {/* https://stackoverflow.com/questions/1015809/how-to-get-floating-divs-inside-fixed-width-div-to-continue-horizontally */}
        <div id="allocatable node" style={{
          width: "640px", height: "640px", backgroundColor: "#446688",
          // https://stackoverflow.com/questions/10170759/how-to-put-some-divs-in-a-row
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