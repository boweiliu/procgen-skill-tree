import * as Pixi from 'pixi.js';

export interface SimpleTextureSet {
  circle: Pixi.Texture;
  dot: Pixi.Texture;
  rect: Pixi.Texture;
  square: Pixi.Texture;
  verticalLine: Pixi.Texture;
}

const WHITE = 0xffffff;

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
  circle.beginFill(WHITE);
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
    rect.beginFill(WHITE);
    // rect.drawRect(-6, -10, 12, 20);
    rect.drawRect(0, 0, width, height);
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

    verticalLine.beginFill(WHITE);
    verticalLine.drawRect(0, 0, thickness, height);
    verticalLine.drawRect(0, 0, width, thickness);
    verticalLine.drawRect(0, height - thickness, width, thickness);
  }

  let square = new Pixi.Graphics();
  square.beginFill(WHITE);
  square.drawRect(0, 0, diameter, diameter);
  // square.pivot = PixiPointFrom(Vector2.Zero);

  let dot = new Pixi.Graphics();
  dot.beginFill(WHITE);
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
