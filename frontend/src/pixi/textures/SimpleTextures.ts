import * as Pixi from 'pixi.js';
import { PixiPointFrom } from '../../lib/pixi/pixify';
import { Vector2 } from '../../lib/util/geometry/vector2';
import COLORS from '../colors';

export interface SimpleTextureSet {
  circle: Pixi.Texture;
  dot: Pixi.Texture;
  rect: Pixi.Texture;
  square: Pixi.Texture;
  verticalLine: Pixi.Texture;
}

export type UiScale = 'x-small' | 'small' | 'medium' | 'large' | 'x-large';

// export const pixiUiScale: UiScale = 'large';

export function generateSimpleTextures(
  renderer: Pixi.Renderer,
  uiScale: UiScale
): SimpleTextureSet {
  console.log('generating textures...', { uiScale });

  let circle = new Pixi.Graphics();
  let diameter =
    uiScale === 'x-small'
      ? 8
      : uiScale === 'small'
      ? 12
      : uiScale === 'medium' || uiScale === 'large'
      ? 16
      : 24;
  circle.beginFill(COLORS.white);
  circle.drawCircle(0, 0, diameter / 2);
  // circle.drawCircle(0, 0, 6);
  // circle.pivot = PixiPointFrom(Vector2.Zero);

  let rect = new Pixi.Graphics();
  let height =
    uiScale === 'x-small'
      ? 10
      : uiScale === 'small'
      ? 14
      : uiScale === 'medium' || uiScale === 'large'
      ? 18
      : 30;

  {
    let width =
      uiScale === 'x-small'
        ? 3
        : uiScale === 'small'
        ? 4
        : uiScale === 'medium' || uiScale === 'large'
        ? 5
        : 8;
    rect.beginFill(COLORS.white);
    // rect.drawRect(-6, -10, 12, 20);
    rect.drawRect(0, 0, width, height);
    // rect.drawRect(height/2 - width/2, 0, width, height);
    // rect.drawRect(0, height/2 - width/2, height, width);
    // rect.drawPolygon([(height / 2 - width / 2), 0, height / 2 + width / 2, 0, height / 2 + width / 2, height, height / 2 - width / 2, height]);
    // rect.drawPolygon([(height / 2 - width / 2), -height / 2, height / 2 + width / 2, -height / 2,
    //   height / 2 + width / 2, height / 2, height / 2 - width / 2, height / 2]);

    // // horizontal full rectangle
    // rect.drawPolygon([
    //   height/2, width/2,
    //   height/2, -width/2,
    //   -height/2, -width/2,
    //   -height/2, width/2,
    // ]);
    // const v = Math.sqrt(3) / 2;
    // // rotate 60 degrees
    // rect.drawPolygon([
    //   ((.5 * height) - (v * width))/2, ((v * height) + (.5 * width))/2,
    //   ((.5 * height) - (v * -width))/2, ((v * height) + (.5 * -width))/2,
    //   ((.5 * -height) - (v * -width))/2, ((v * -height) + (.5 * -width))/2,
    //   ((.5 * -height) - (v * width))/2, ((v * -height) + (.5 * width))/2,
    // ]);
    // // rotate 60 degrees the other way
    // rect.drawPolygon([
    //   ((.5 * height) + (v * width))/2, (-(v * height) + (.5 * width))/2,
    //   ((.5 * height) + (v * -width))/2, (-(v * height) + (.5 * -width))/2,
    //   ((.5 * -height) + (v * -width))/2, (-(v * -height) + (.5 * -width))/2,
    //   ((.5 * -height) + (v * width))/2, (-(v * -height) + (.5 * width))/2,
    // ]);

    // rect.drawRect(0, 0, height *2, width);
    // rect.drawRect(0, 0, height, width);
    // rect.pivot = PixiPointFrom(new Vector2(0, -1));
    // rect.angle = 15;
    // rect.pivot = PixiPointFrom(Vector2.Zero);
  }

  // the cursor icon
  let verticalLine = new Pixi.Graphics();
  {
    let thickness =
      uiScale === 'x-small'
        ? 1
        : uiScale === 'small'
        ? 2
        : uiScale === 'medium' || uiScale === 'large'
        ? 3
        : 4;

    let width =
      uiScale === 'x-small'
        ? 3
        : uiScale === 'small' || uiScale === 'medium' || uiScale === 'large'
        ? 6
        : 8;

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
