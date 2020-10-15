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
  borderOffColor: number;
  borderOnColor: number;
    borderThickness: number,
  centerToEdgeBorderRatio2: number;
  centerToEdgeBorderRatio3?: number;
  cornerCompression1?: number;
  cornerCompression2?: number;
  cornerCompression3?: number;
  debugHasRectBorder: boolean;
  debugRandomOn: boolean;
};

export class RenderRects {
  private config: RenderRectsConfig = {
    containerHeightProportion: 0.9,
    aspectRatio1: 1.6,
    aspectRatio3: 1.6,
    downscaleRatio12: 0.75,
    downscaleRatio23: 0.35,
    circleSize: 6,
    circleOnColor: 0x030303,
    circleOffColor: 0xcecece,
    circleHoverColor: 0x000000,
    circleFillColor: 0xd3d3d3,
    borderOffColor: 0xefefef,
    borderOnColor: 0xbcdebc,
    borderThickness: 2,
    centerToEdgeBorderRatio2: 1.2,
    centerToEdgeBorderRatio3: 1.0,
    cornerCompression1: 0.08,
    cornerCompression2: 0.2,
    cornerCompression3: 0.3,
    debugHasRectBorder: false,
    debugRandomOn: true,
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
    const hasBorder = this.config.debugHasRectBorder;
    const newHeight =
      this.containerRect.height * this.config.containerHeightProportion;
    const newRect = this.containerRect.withScale({
      height: newHeight,
      width: newHeight * this.config.aspectRatio1,
    });
    this.drawRect(newRect, hasBorder, this.config.cornerCompression1 || 0);

    const layer2 = this.nestRectPair(
      newRect,
      this.config.downscaleRatio12,
      this.config.aspectRatio2 || this.config.aspectRatio1,
      this.config.centerToEdgeBorderRatio2
    );
    this.drawRect(
      layer2.first,
      hasBorder,
      this.config.cornerCompression2 || this.config.cornerCompression1 || 0
    );
    this.drawRect(
      layer2.second,
      hasBorder,
      this.config.cornerCompression2 || this.config.cornerCompression1 || 0
    );

    const layer3 = new Pair(
      this.nestRectPair(
        layer2.first,
        this.config.downscaleRatio23 || this.config.downscaleRatio12,
        this.config.aspectRatio3 ||
          this.config.aspectRatio2 ||
          this.config.aspectRatio1,
        this.config.centerToEdgeBorderRatio3 ||
          this.config.centerToEdgeBorderRatio2
      ),
      this.nestRectPair(
        layer2.second,
        this.config.downscaleRatio23 || this.config.downscaleRatio12,
        this.config.aspectRatio3 ||
          this.config.aspectRatio2 ||
          this.config.aspectRatio1,
        this.config.centerToEdgeBorderRatio3 ||
          this.config.centerToEdgeBorderRatio2
      )
    );
    this.drawRect(
      layer3.first.first,
      hasBorder,
      this.config.cornerCompression3 ||
        this.config.cornerCompression2 ||
        this.config.cornerCompression1 ||
        0
    );
    this.drawRect(
      layer3.second.first,
      hasBorder,
      this.config.cornerCompression3 ||
        this.config.cornerCompression2 ||
        this.config.cornerCompression1 ||
        0
    );
    this.drawRect(
      layer3.first.second,
      hasBorder,
      this.config.cornerCompression3 ||
        this.config.cornerCompression2 ||
        this.config.cornerCompression1 ||
        0
    );
    this.drawRect(
      layer3.second.second,
      hasBorder,
      this.config.cornerCompression3 ||
        this.config.cornerCompression2 ||
        this.config.cornerCompression1 ||
        0
    );
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

  private drawRect(
    rect: Rect,
    hasBorder: boolean,
    cornerCompressionRatio: number
  ) {
    const corners = rect.withScale({
      width:
        rect.width - cornerCompressionRatio * (3 * rect.width + rect.height)/4,
      height:
        rect.height -
        cornerCompressionRatio * (rect.width + 3 * rect.height)/4,
    });
    const midpoints = {
      left: new Vector2(rect.left, rect.centerY),
      right: new Vector2(rect.right, rect.centerY),
      top: new Vector2(rect.centerX, rect.top),
      bottom: new Vector2(rect.centerX, rect.bottom),
    };

    if (hasBorder) {
      const graphics = new Pixi.Graphics();
      graphics.lineStyle(this.config.borderThickness, this.config.borderOffColor, 1);
      graphics.drawRect(rect.x, rect.y, rect.width, rect.height);
      this.stage.addChild(graphics);
    }
    this.drawLine(corners.topLeft, midpoints.left);
    this.drawLine(corners.topLeft, midpoints.top);
    this.drawLine(corners.topRight, midpoints.right);
    this.drawLine(corners.topRight, midpoints.top);
    this.drawLine(corners.bottomLeft, midpoints.left);
    this.drawLine(corners.bottomLeft, midpoints.bottom);
    this.drawLine(corners.bottomRight, midpoints.right);
    this.drawLine(corners.bottomRight, midpoints.bottom);

    this.drawCorners(corners);
    Object.values(midpoints).map((p) => this.drawCircleAt(p));
  }

  private drawCorners(rect: Rect) {
    this.drawCircleAt(rect.topLeft);
    this.drawCircleAt(rect.topRight);
    this.drawCircleAt(rect.bottomLeft);
    this.drawCircleAt(rect.bottomRight);
  }

  public drawLine(p1: IVector2, p2: IVector2) {
    const graphics = new Pixi.Graphics();
    // graphics.position.set(p1.x, p1.y);
    if (this.config.debugRandomOn && Math.random() < 0.5) {
      graphics.lineStyle(this.config.borderThickness, this.config.borderOnColor, 1);
    } else {
      graphics.lineStyle(this.config.borderThickness, this.config.borderOffColor, 1);
    }
    graphics.moveTo(p1.x, p1.y);
    graphics.lineTo(p2.x, p2.y);
    this.stage.addChild(graphics);
  }

  public drawCircleAt(point: IVector2): IVector2 {
    const graphics = new Pixi.Graphics();

    if (this.config.debugRandomOn && Math.random() < 0.5) {
      graphics.lineStyle(1, this.config.circleOnColor, 1);
    } else {
      graphics.lineStyle(1, this.config.circleOffColor, 1);
    }
    graphics.beginFill(this.config.circleFillColor, 1);
    graphics.drawCircle(point.x, point.y, this.config.circleSize);
    graphics.endFill();
    this.stage.addChild(graphics);
    return point;
  }
}
