import * as Pixi from 'pixi.js';
import COLORS from '../colors';

export interface SimpleTextureSet {
  circle: Pixi.Texture;
  rect: Pixi.Texture;
  square: Pixi.Texture;
}

export function generateSimpleTextures(
  renderer: Pixi.Renderer
): SimpleTextureSet {
  let circle = new Pixi.Graphics();
  circle.beginFill(COLORS.white);
  circle.drawCircle(0, 0, 8);
  // circle.pivot = PixiPointFrom(Vector2.Zero);

  let rect = new Pixi.Graphics();
  rect.beginFill(COLORS.white);
  // rect.drawRect(-6, -10, 12, 20);
  rect.drawRect(0, 0, 4, 20);
  // rect.pivot = PixiPointFrom(Vector2.Zero);

  let verticalLine = new Pixi.Graphics();
  verticalLine.beginFill(COLORS.white);
  verticalLine.drawRect(0, 0, 4, 20);

  let square = new Pixi.Graphics();
  square.beginFill(COLORS.white);
  square.drawRect(0, 0, 16, 16);
  // square.pivot = PixiPointFrom(Vector2.Zero);

  return {
    circle: renderer.generateTexture(circle, Pixi.SCALE_MODES.LINEAR, 1),
    rect: renderer.generateTexture(rect, Pixi.SCALE_MODES.LINEAR, 1),
    square: renderer.generateTexture(square, Pixi.SCALE_MODES.LINEAR, 1),
  };
}
