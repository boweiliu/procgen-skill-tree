import * as Pixi from "pixi.js";
import { Rect } from "../johnfn_library/geometry/rect";
import { RenderRects } from "./RenderRects";

export type Config = {
  canvasWidth: number;
  canvasHeight: number;
  canvasAspectRatio: number;
  nodeSize: number;
  recursiveDownscale: number;
  recursiveOffset: number;
};

const defaultConfig: Config = {
  canvasWidth: 1600,
  canvasHeight: 900,
  canvasAspectRatio: 1.5,
  nodeSize: 3.5,
  recursiveDownscale: 0.65,
  recursiveOffset: 0.21,
};

export type Point = number[];

export class Application {
  public app!: Pixi.Application;

  public config!: Config;

  /**
   * Need to provide config to set up the pixi canvas
   */
  constructor(config?: Config) {
    this.config = Object.assign({}, defaultConfig, config);

    this.app = new Pixi.Application({
      width: this.config.canvasWidth,
      height: this.config.canvasHeight,
      antialias: true,
      backgroundColor: 0xffffff,
    });
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
  public moveViewport(viewport: Rect) {

  }

  private renderRecursion(center: Point, height: number, width: number) {
    if (height < width) {
      const newHeight = this.config.recursiveDownscale * height;
      const newWidth = newHeight / this.config.canvasAspectRatio;
      const leftCenter = [
        center[0] - width * this.config.recursiveOffset,
        center[1],
      ];
      const rightCenter = [
        center[0] + width * this.config.recursiveOffset,
        center[1],
      ];
      return {
        centers: [leftCenter, rightCenter],
        height: newHeight,
        width: newWidth,
      };
    } else {
      const newWidth = this.config.recursiveDownscale * width;
      const newHeight = newWidth / this.config.canvasAspectRatio;
      const topCenter = [
        center[0],
        center[1] - height * this.config.recursiveOffset,
      ];
      const bottomCenter = [
        center[0],
        center[1] + height * this.config.recursiveOffset,
      ];
      return {
        centers: [topCenter, bottomCenter],
        height: newHeight,
        width: newWidth,
      };
    }
  }

  public drawStart() {
    const renderRects = new RenderRects(this.app.stage, new Rect({x:0, y:0, width: this.config.canvasWidth, height: this.config.canvasHeight})
    )
    renderRects.drawFirst();
    // const { center, height, width } = this.drawRectangle();

    // const {
    //   centers: newCenters,
    //   height: newHeight,
    //   width: newWidth,
    // } = this.renderRecursion(center, height, width);
    // this.drawRectangle(newCenters[0], newHeight, newWidth);
    // this.drawRectangle(newCenters[1], newHeight, newWidth);

    // let {
    //   centers: newNewCenters,
    //   height: newNewHeight,
    //   width: newNewWidth,
    // } = this.renderRecursion(newCenters[0], newHeight, newWidth);
    // this.drawRectangle(newNewCenters[0], newNewHeight, newNewWidth);
    // this.drawRectangle(newNewCenters[1], newNewHeight, newNewWidth);
    // let { centers: newNewCenters2 } = this.renderRecursion(
    //   newCenters[1],
    //   newHeight,
    //   newWidth
    // );
    // this.drawRectangle(newNewCenters2[0], newNewHeight, newNewWidth);
    // this.drawRectangle(newNewCenters2[1], newNewHeight, newNewWidth);
  }

  public drawRectangle(
    center: Point = [this.config.canvasWidth / 2, this.config.canvasHeight / 2],
    height = 0.95 * this.config.canvasHeight,
    width = height * this.config.canvasAspectRatio
  ) {
    const startingHeight = height;
    const rectWidth = width;
    const graphics = new Pixi.Graphics();
    graphics.lineStyle(2, 0xeeeeee, 1);
    graphics.drawRect(
      center[0] - rectWidth / 2,
      center[1] - startingHeight / 2,
      rectWidth,
      startingHeight
    );
    this.app.stage.addChild(graphics);

    this.drawCircle([
      center[0] - rectWidth / 2,
      center[1] - startingHeight / 2,
    ]);
    this.drawCircle([
      center[0] + rectWidth / 2,
      center[1] - startingHeight / 2,
    ]);
    this.drawCircle([
      center[0] + rectWidth / 2,
      center[1] + startingHeight / 2,
    ]);
    this.drawCircle([
      center[0] - rectWidth / 2,
      center[1] + startingHeight / 2,
    ]);
    this.drawCircle([
      center[0] - rectWidth / 2,
      center[1] - (0 * startingHeight) / 2,
    ]);
    this.drawCircle([
      center[0] + rectWidth / 2,
      center[1] - (0 * startingHeight) / 2,
    ]);
    this.drawCircle([
      center[0] + (0 * rectWidth) / 2,
      center[1] - startingHeight / 2,
    ]);
    this.drawCircle([
      center[0] + (0 * rectWidth) / 2,
      center[1] + startingHeight / 2,
    ]);
    return { center, height, width };
  }

  public drawCircle(
    point: Point = [
      this.config.canvasWidth * Math.random(),
      this.config.canvasHeight * Math.random(),
    ]
  ) {
    const graphics = new Pixi.Graphics();
    if (Math.random() < 0.5) {
      graphics.lineStyle(1, 0x000000, 1);
    } else {
      graphics.lineStyle(1, 0xc0c0c0, 1);
    }
    graphics.beginFill(0xdddddd, 1);
    graphics.drawCircle(point[0], point[1], this.config.nodeSize);
    graphics.endFill();
    this.app.stage.addChild(graphics);
  }
}
