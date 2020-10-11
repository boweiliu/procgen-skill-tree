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
    graphics.lineStyle(2, 0xfeeb77, 1);
    graphics.beginFill(0x650a5a, 1);
    graphics.drawCircle(250, 250, 50);
    graphics.endFill();
    this.app.stage.addChild(graphics);
  }
}