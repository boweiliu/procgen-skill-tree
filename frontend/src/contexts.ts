import React from "react";
import { Vector2 } from "./lib/util/geometry/vector2";
import { Chunk } from "./pixi/Chunk";

export const GameContext = React.createContext<{
  [k: string]: any;
}>({});

export const UIContext = React.createContext<{
  focusedNode?: { chunk: Chunk; node: Vector2 };
}>({});
