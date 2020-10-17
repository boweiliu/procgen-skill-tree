import * as Pixi from "pixi.js";
import { Rect } from "../johnfn_library/geometry/rect";
import { Vector2 } from "../johnfn_library/geometry/vector2";
import { RenderRects, RenderRectsConfig } from "./RenderRects";

export type Config = {
  canvasWidth: number;
  canvasHeight: number;
};

const defaultConfig: Config = {
  canvasWidth: 800,
  canvasHeight: 800,
};

export type Point = number[];

export class Application {
  public app!: Pixi.Application;

  public config!: Config;

  public renderRects: RenderRects;

  /**
   * Need to provide config to set up the pixi canvas
   */
  constructor(config?: Config, app?: Pixi.Application) {
    this.config = Object.assign({}, defaultConfig, config);

    this.app = app || new Pixi.Application({
      width: this.config.canvasWidth,
      height: this.config.canvasHeight,
      antialias: true,
      backgroundColor: 0xffffff,
    });

    this.renderRects = new RenderRects(
      this.app.stage,
      new Rect({
        x: 0,
        y: 0,
        width: this.config.canvasWidth,
        height: this.config.canvasHeight,
      })
    );
  }

  /**
   * Please only call once!!
   */
  public register(curr: HTMLDivElement) {
    curr.appendChild(this.app.view);
  }

  /**
   * Draws a full skill tree at the default zoom level.
   */
  public drawAll() {
    // get the first 3 layers' configurations
    // render the top layer points
    // renderLayerPoints(layer[0], { rect: null })
    // render the next layer
    // render the intermediate connections
    // render the final layer
    // render the intermediate connections
  }

  /**
   * Used for panning/zooming.
   */
  public moveViewport(viewport: Rect) {}

  public drawStart() {
    this.renderRects.drawFirst();
  }

  public drawCircle() {
    this.renderRects.drawCircleAt(
      new Vector2(
        Math.random() * this.config.canvasWidth,
        Math.random() * this.config.canvasHeight
      )
    );
  }
}
