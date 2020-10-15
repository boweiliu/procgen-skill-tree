import * as Pixi from "pixi.js";
import { Container } from "pixi.js";
import { Rect } from "../johnfn_library/geometry/rect";
import { IVector2, Vector2 } from "../johnfn_library/geometry/vector2";

export type RenderRectsConfig = {
  containerHeightProportion: number;
  aspectRatio1: number;
  downscaleRatio12: number;
  aspectRatio2?: number;
  downscaleRatio23: number;
  aspectRatio3?: number;
  circleSize: number;
  circleOffColor: number;
  circleOnColor: number;
  circleHoverColor: number;
  circleFillColor: number;
};

export class RenderRects {
  private config: RenderRectsConfig = {
    containerHeightProportion: 0.95,
    aspectRatio1: 1.6,
    downscaleRatio12: 0.7,
    downscaleRatio23: 0.4,
    circleSize: 3.5,
    circleOffColor: 0x00000,
    circleOnColor: 0xc0c0c0,
    circleHoverColor: 0x00000,
    circleFillColor: 0xddddd,
  };
  private containerRect!: Rect;
  private stage!: Container;

  constructor(
    stage: Container,
    containerRect: Rect,
    config: RenderRectsConfig
  ) {
    this.stage = stage;
    this.containerRect = containerRect;
    this.config = Object.assign({}, this.config, config);
  }

  public drawFirst() {
    const newHeight =
      this.containerRect.height * this.config.containerHeightProportion;
    const newRect = this.containerRect.withScale({
      height: newHeight,
      width: newHeight * this.config.aspectRatio1,
    });
  }

  private drawRect(rect: Rect) {
    this.drawCorners(rect);
    this.drawMidpoints(rect);
    // const graphics = new Pixi.Graphics();
    // graphics.lineStyle(2, 0xeeeeee, 1);
    // this.stage.addChild(graphics);

  }

  private drawCorners(rect: Rect) {
      this.drawCircleAt(rect.topLeft)
      this.drawCircleAt(rect.topRight)
      this.drawCircleAt(rect.bottomLeft)
      this.drawCircleAt(rect.bottomRight)
  }

  private drawMidpoints(rect: Rect) {
      this.drawCircleAt(new Vector2(rect.left, rect.centerY))
      this.drawCircleAt(new Vector2(rect.right, rect.centerY))
      this.drawCircleAt(new Vector2(rect.centerX, rect.top))
      this.drawCircleAt(new Vector2(rect.centerX, rect.bottom))
  }

  private drawCircleAt(point: IVector2) {
    const graphics = new Pixi.Graphics();

    if (Math.random() < 0.5) {
      graphics.lineStyle(1, this.config.circleOnColor, 1);
    } else {
      graphics.lineStyle(1, this.config.circleOffColor, 1);
    }
    graphics.beginFill(this.config.circleFillColor, 1);
    graphics.drawCircle(point.x, point.y, this.config.circleSize);
    graphics.endFill();
    this.stage.addChild(graphics);
  }
}

export function foo() {}
