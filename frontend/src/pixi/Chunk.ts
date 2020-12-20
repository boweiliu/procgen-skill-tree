import { Line } from "../lib/util/geometry/line";
import { Vector2 } from "../lib/util/geometry/vector2";
import { INTMAX32, squirrel3 } from "../lib/util/random";
import * as Pixi from "pixi.js";

export class Chunk {
  public static CHUNK_DIM = 9; // each chunk is a DIM x DIM grid of nodes, centered on a single node
  public static CHUNK_HALF_DIM = (Chunk.CHUNK_DIM - 1) / 2;

  public id!: number;

  public nodes: Vector2[] = [];
  public edges: Line[] = [];

  public location: Vector2 = new Vector2(0, 0);

  constructor(seed: number, chunkIndex: Vector2) {
    this.location = chunkIndex;

    this.id = squirrel3(seed + squirrel3(seed + this.location.x) + this.location.y);

    // determine which nodes we want to throw out - 
    let allNodes: Vector2[] = [];
    for (let i = -Chunk.CHUNK_HALF_DIM; i <= Chunk.CHUNK_HALF_DIM; i++) {
      for (let j = -Chunk.CHUNK_HALF_DIM; j <= Chunk.CHUNK_HALF_DIM; j++) {
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

  public static SPACING_PX: number = 24;
  public static CHUNK_SPACING_PX: number = (Chunk.CHUNK_DIM + 1) * RenderedChunk.SPACING_PX;
  public static NODE_SIZE_PX: number = 14;
  public static NODE_ROUNDED_PX: number = 4;

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
        node.x * RenderedChunk.SPACING_PX - RenderedChunk.NODE_SIZE_PX / 2,
        node.y * RenderedChunk.SPACING_PX - RenderedChunk.NODE_SIZE_PX / 2,
        RenderedChunk.NODE_SIZE_PX,
        RenderedChunk.NODE_SIZE_PX,
        RenderedChunk.NODE_ROUNDED_PX
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

    this.container.x = this.chunk.location.x * RenderedChunk.CHUNK_SPACING_PX;
    this.container.y = this.chunk.location.y * RenderedChunk.CHUNK_SPACING_PX;
  }
}