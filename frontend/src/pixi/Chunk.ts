import { Line } from "../lib/util/geometry/line";
import { Vector2 } from "../lib/util/geometry/vector2";
import { INTMAX32, squirrel3 } from "../lib/util/random";
import * as Pixi from "pixi.js";


export class Chunk {
  public id!: number;

  public nodes: Vector2[] = [];
  public edges: Line[] = [];

  public location: Vector2 = new Vector2(0, 0);

  constructor(seed: number, chunkIndex: Vector2) {
    this.location = chunkIndex;

    this.id = squirrel3(seed + squirrel3(seed + this.location.x) + this.location.y);

    // 15x15 grid?
    let allNodes: Vector2[] = [];
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        allNodes.push(new Vector2(i, j))
      }
    }

    // drop some of them...?
    for (let i = 0; i < allNodes.length; i++) {
      if (squirrel3(this.id + i) / INTMAX32 < 0.9 || allNodes[i].x == 0 && allNodes[i].y == 0) {
        this.nodes.push(allNodes[i]);
      }
    }
  }
}

export class RenderedChunk {
  public chunk!: Chunk;
  public container: Pixi.Container;

  public spacingPx: number = 24;
  public chunkSpacingPx: number = 8 * this.spacingPx;
  public nodeSizePx: number = 14;
  public nodeRoundedPx: number = 4;

  constructor(chunk: Chunk, ticker: Pixi.Ticker, onNodeFocus?: Function) {
    this.chunk = chunk;
    // this.parentContainer = parent;

    // render the thing
    this.container = new Pixi.Container();

    for (let node of chunk.nodes) {
      let g = new Pixi.Graphics();
      g.beginFill(0xff8080);
      if (node.x == 0 && node.y == 0) {
        g.beginFill(0xff0000);
      }
      g.drawRoundedRect(
        node.x * this.spacingPx - this.nodeSizePx / 2,
        node.y * this.spacingPx - this.nodeSizePx / 2,
        this.nodeSizePx,
        this.nodeSizePx,
        this.nodeRoundedPx
      );
      g.interactive = true;
      g.addListener("pointerdown", () => {
        onNodeFocus?.(chunk, node);
        console.log(`clicked chunk ${chunk.id} node ${node.x}, ${node.y}`);
        g.tint = 0x0000ff;
        g.alpha = 0.5;
      });
      this.container.addChild(g);
    }

    this.container.x = this.chunk.location.x * this.chunkSpacingPx;
    this.container.y = this.chunk.location.y * this.chunkSpacingPx;
  }
}