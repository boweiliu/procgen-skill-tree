import * as Pixi from "pixi.js";

export class Application {
  public app!: Pixi.Application;

  constructor() {
    this.app = new Pixi.Application({
      antialias: true,
      backgroundColor: 0xffffff,
    });
  }

  public drawCircle() {
    const graphics = new Pixi.Graphics();
    graphics.lineStyle(2, 0x000000, 1);
    graphics.beginFill(0xdddddd, 1);
    graphics.drawCircle(1000 * Math.random(), 1000 * Math.random(), 50);
    graphics.endFill();
    this.app.stage.addChild(graphics);
  }
}