import * as Pixi from "pixi.js";

export type Config = {
  canvasWidth: number;
  canvasHeight: number;
  aspectRatio: number;
  nodeSize: number;
};

const defaultConfig: Config = {
  canvasWidth: 800,
  canvasHeight: 600,
  aspectRatio: 1.618,
  nodeSize: 7,
};

export type Point = number[];

export class Application {
  public app!: Pixi.Application;

  public config!: Config;

  constructor(config?: Config) {
    this.config = Object.assign({}, defaultConfig, config);

    this.app = new Pixi.Application({
      width: this.config.canvasWidth,
      height: this.config.canvasHeight,
      antialias: true,
      backgroundColor: 0xffffff,
    });
  }

  public drawRectangle() {
    const center: Point = [this.config.canvasWidth / 2, this.config.canvasHeight / 2];
    const startingHeight = 0.75 * this.config.canvasHeight;
    const rectWidth = startingHeight * this.config.aspectRatio;
    const graphics = new Pixi.Graphics();
    graphics.lineStyle(2, 0xeeeeee, 1);
    graphics.drawRect(
      center[0] - rectWidth / 2,
      center[1] - startingHeight / 2,
      rectWidth,
      startingHeight
    );
    this.app.stage.addChild(graphics);

    this.drawCircle([center[0] - rectWidth/2, center[1] - startingHeight/2])
    this.drawCircle([center[0] + rectWidth/2, center[1] - startingHeight/2])
    this.drawCircle([center[0] + rectWidth/2, center[1] + startingHeight/2])
    this.drawCircle([center[0] - rectWidth/2, center[1] + startingHeight/2])
    this.drawCircle([center[0] - rectWidth/2, center[1] - 0 * startingHeight/2])
    this.drawCircle([center[0] + rectWidth/2, center[1] - 0*  startingHeight/2])
    this.drawCircle([center[0] + 0*  rectWidth/2, center[1] - startingHeight/2])
    this.drawCircle([center[0] + 0*  rectWidth/2, center[1] + startingHeight/2])
  }

  public drawCircle(point: Point = [800 * Math.random(), 600 * Math.random()]) {
    const graphics = new Pixi.Graphics();
    graphics.lineStyle(1, 0x000000, 1);
    graphics.beginFill(0xdddddd, 1);
    graphics.drawCircle(point[0], point[1], this.config.nodeSize);
    graphics.endFill();
    this.app.stage.addChild(graphics);
  }
}
