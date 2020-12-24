import * as Pixi from "pixi.js";
import { IVector2, Vector2 } from "../util/geometry/vector2";

export function PixiPointFrom(p: IVector2): Pixi.Point {
  return new Pixi.Point(p.x, p.y);
}