import * as Pixi from 'pixi.js';
import COLORS from '../colors';

export interface SimpleTextureSet {
  circle: Pixi.Texture;
  dot: Pixi.Texture;
  rect: Pixi.Texture;
  square: Pixi.Texture;
  verticalLine: Pixi.Texture;
}

export function generateSimpleTextures(
  renderer: Pixi.Renderer
): SimpleTextureSet {
  let circle = new Pixi.Graphics();
  let diameter = 16;
  circle.beginFill(COLORS.white);
  circle.drawCircle(0, 0, diameter / 2);
  // circle.drawCircle(0, 0, 6);
  // circle.pivot = PixiPointFrom(Vector2.Zero);

  let rect = new Pixi.Graphics();
  {
    let height = 18;
    let width = 5;
    rect.beginFill(COLORS.white);
    // rect.drawRect(-6, -10, 12, 20);
    rect.drawRect(0, 0, width, height);
    // rect.pivot = PixiPointFrom(Vector2.Zero);
  }

  let verticalLine = new Pixi.Graphics();
  {
    let height = 18;
    let thickness = 3;
    let width = 6;

    verticalLine.beginFill(COLORS.white);
    verticalLine.drawRect(0, 0, thickness, height);
    verticalLine.drawRect(0, 0, width, thickness);
    verticalLine.drawRect(0, height - thickness, width, thickness);
  }

  let square = new Pixi.Graphics();
  square.beginFill(COLORS.white);
  square.drawRect(0, 0, diameter, diameter);
  // square.pivot = PixiPointFrom(Vector2.Zero);

  let dot = new Pixi.Graphics();
  dot.beginFill(COLORS.white);
  dot.drawCircle(0, 0, diameter / 4);

  return {
    circle: renderer.generateTexture(circle, Pixi.SCALE_MODES.LINEAR, 1),
    rect: renderer.generateTexture(rect, Pixi.SCALE_MODES.LINEAR, 1),
    square: renderer.generateTexture(square, Pixi.SCALE_MODES.LINEAR, 1),
    verticalLine: renderer.generateTexture(
      verticalLine,
      Pixi.SCALE_MODES.LINEAR,
      1
    ),
    dot: renderer.generateTexture(dot, Pixi.SCALE_MODES.LINEAR, 1),
  };
}
