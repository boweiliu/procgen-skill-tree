import * as Pixi from "pixi.js";
import { Rect } from "../lib/util/geometry/rect";
import { Vector2 } from "../lib/util/geometry/vector2";
import { RenderRects, RenderRectsConfig } from "./RenderRects";
import bunny from "../bunny.png";

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

    this.app =
      app ||
      new Pixi.Application({
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
    // this.renderRects.drawFirst();
    this.pixiExample();
  }

  public drawCircle() {
    this.renderRects.drawCircleAt(
      new Vector2(
        Math.random() * this.config.canvasWidth,
        Math.random() * this.config.canvasHeight
      )
    );
  }

  public pixiExample() {
    // Taken from  https://pixijs.io/examples/#/demos-basic/container.js
    const container = new Pixi.Container();

    this.app.stage.addChild(container);

    // Create a new texture
    const texture = Pixi.Texture.from(bunny);

    window.alert("doing bunny stuff")

    // Create a 5x5 grid of bunnies
    for (let i = 0; i < 25; i++) {
      const bunny = new Pixi.Sprite(texture);
      bunny.anchor.set(0.5);
      bunny.x = (i % 5) * 40;
      bunny.y = Math.floor(i / 5) * 40;
      container.addChild(bunny);
    }

    // Move container to the center
    container.x = this.app.screen.width / 2;
    container.y = this.app.screen.height / 2;

    // Center bunny sprite in local container coordinates
    container.pivot.x = container.width / 2;
    container.pivot.y = container.height / 2;

    // Listen for animate update
    this.app.ticker.add((delta) => {
      // rotate the container!
      // use delta to create frame-independent transform
      container.rotation -= 0.01 * delta;
    });
  }
}
