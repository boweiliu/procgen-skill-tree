import * as Pixi from "pixi.js";
var app: Pixi.Application;
export function createApplication() {
  app = new Pixi.Application({
    antialias: true,
    backgroundColor: 0xffffff,
  });
  return app;
}

export function drawCircle() {
  const graphics = new Pixi.Graphics();
  graphics.lineStyle(2, 0xfeeb77, 1);
  graphics.beginFill(0x650a5a, 1);
  graphics.drawCircle(250, 250, 50);
  graphics.endFill();
  app.stage.addChild(graphics);
}
