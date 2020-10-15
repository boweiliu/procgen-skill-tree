import * as Pixi from "pixi.js";
import { Container } from "pixi.js";
import { Pair } from "../johnfn_library/data_structures/pair";
import { Rect } from "../johnfn_library/geometry/rect";
import { IVector2, Vector2 } from "../johnfn_library/geometry/vector2";

export type RenderRectsConfig = {
  containerHeightProportion: number;
  aspectRatio1: number;
  downscaleRatio12: number;
  aspectRatio2?: number;
  downscaleRatio23?: number;
  aspectRatio3?: number;
  circleSize: number;
  circleOffColor: number;
  circleOnColor: number;
  circleHoverColor: number;
  circleFillColor: number;
  borderColor: number;
  centerToEdgeBorderRatio2: number;
  centerToEdgeBorderRatio3?: number;
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
    borderColor: 0xeeeeee,
    centerToEdgeBorderRatio2: 1.0,
  };
  private containerRect!: Rect;
  private stage!: Container;

  constructor(
    stage: Container,
    containerRect: Rect,
    config?: RenderRectsConfig
  ) {
    this.stage = stage;
    this.containerRect = containerRect;
    this.config = Object.assign({}, this.config, config || {});
  }

  /**
   * Draws a '=' oriented rectangle, 2 'O' oriented nested, and then 4 '=' further-nested.
   */
  public drawFirst() {
    const newHeight =
      this.containerRect.height * this.config.containerHeightProportion;
    const newRect = this.containerRect.withScale({
      height: newHeight,
      width: newHeight * this.config.aspectRatio1,
    });
    this.drawRect(newRect);

    const layer2 = this.nestRectPair(
      newRect,
      this.config.downscaleRatio12,
      this.config.aspectRatio2 || this.config.aspectRatio1,
      this.config.centerToEdgeBorderRatio2
    );
    this.drawRect(layer2.first);
    this.drawRect(layer2.second);

    const layer3 = new Pair(
        this.nestRectPair(
            layer2.first,
            this.config.downscaleRatio23 || this.config.downscaleRatio12,
            this.config.aspectRatio3 || this.config.aspectRatio2 || this.config.aspectRatio1,
            this.config.centerToEdgeBorderRatio3 || this.config.centerToEdgeBorderRatio2
        ),
        this.nestRectPair(
            layer2.second,
            this.config.downscaleRatio23 || this.config.downscaleRatio12,
            this.config.aspectRatio3 || this.config.aspectRatio2 || this.config.aspectRatio1,
            this.config.centerToEdgeBorderRatio3 || this.config.centerToEdgeBorderRatio2
        ),
    )
    this.drawRect(layer3.first.first);
    this.drawRect(layer3.second.first);
    this.drawRect(layer3.first.second);
    this.drawRect(layer3.second.second);
  }

  private nestRectPair(
    original: Rect,
    downscaleRatio: number,
    newAspectRatio: number,
    centerToEdgeBorderRatio: number
  ): Pair<Rect, Rect> {
    const longSide = Math.min(original.height, original.width) * downscaleRatio;
    const shortSide = longSide / newAspectRatio;
    const remaining = Math.max(original.height, original.width) - 2 * shortSide;
    const middleGap =
      (remaining / (2 + centerToEdgeBorderRatio)) * centerToEdgeBorderRatio;
    const offset = middleGap / 2 + shortSide / 2;

    if (original.height < original.width) {
      const newHeight = longSide;
      const newWidth = shortSide;

      const leftCenter = new Vector2(
        original.centerX - offset,
        original.centerY
      );
      const rightCenter = new Vector2(
        original.centerX + offset,
        original.centerY
      );
      return new Pair<Rect, Rect>(
        Rect.FromCenter({
          center: leftCenter,
          dimensions: new Vector2(newWidth, newHeight),
        }),
        Rect.FromCenter({
          center: rightCenter,
          dimensions: new Vector2(newWidth, newHeight),
        })
      );
    } else {
      const newHeight = shortSide;
      const newWidth = longSide;

      const topCenter = new Vector2(
        original.centerX,
        original.centerY - offset
      );
      const bottomCenter = new Vector2(
        original.centerX,
        original.centerY + offset
      );
      return new Pair<Rect, Rect>(
        Rect.FromCenter({
          center: topCenter,
          dimensions: new Vector2(newWidth, newHeight),
        }),
        Rect.FromCenter({
          center: bottomCenter,
          dimensions: new Vector2(newWidth, newHeight),
        })
      );
    }
  }

  private drawRect(rect: Rect, hasBorder: boolean = true) {
    this.drawCorners(rect);
    this.drawMidpoints(rect);

    if (hasBorder) {
      const graphics = new Pixi.Graphics();
      graphics.lineStyle(2, this.config.borderColor, 1);
      graphics.drawRect(rect.x, rect.y, rect.width, rect.height);
      this.stage.addChild(graphics);
    }
  }

  private drawCorners(rect: Rect) {
    this.drawCircleAt(rect.topLeft);
    this.drawCircleAt(rect.topRight);
    this.drawCircleAt(rect.bottomLeft);
    this.drawCircleAt(rect.bottomRight);
  }

  private drawMidpoints(rect: Rect) {
    this.drawCircleAt(new Vector2(rect.left, rect.centerY));
    this.drawCircleAt(new Vector2(rect.right, rect.centerY));
    this.drawCircleAt(new Vector2(rect.centerX, rect.top));
    this.drawCircleAt(new Vector2(rect.centerX, rect.bottom));
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
