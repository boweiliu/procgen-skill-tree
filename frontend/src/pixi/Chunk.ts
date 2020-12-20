import { Line } from "../lib/util/geometry/line";
import { Vector2 } from "../lib/util/geometry/vector2";
import { INTMAX32, squirrel3 } from "../lib/util/random";
import * as Pixi from "pixi.js";
import { HashMap, HashSet } from "../lib/util/data_structures/hash";

export class Chunk {
  public static CHUNK_DIM = 9; // each chunk is a DIM x DIM grid of nodes, centered on a single node
  public static CHUNK_HALF_DIM = (Chunk.CHUNK_DIM - 1) / 2;
  public static DROP_NODES_CHANCE = 0.3; // before generating edges, how many of the nodes to throw out

  private id!: number;

  public nodes: Vector2[] = [];
  public selectedNodes: HashSet<Vector2> = new HashSet();
  public allocatedNodes: HashSet<Vector2> = new HashSet();

  public edges: Line[] = [];

  public location: Vector2 = new Vector2(0, 0);

  constructor(seed: number, chunkIndex: Vector2) {
    this.location = chunkIndex;

    this.id = squirrel3(seed + squirrel3(seed + this.location.x) + this.location.y);

    // determine which nodes we want to throw out - also keep 4way rotational symmetry
    let droppedNodes: HashSet<Vector2> = new HashSet();
    for (let i = -Chunk.CHUNK_HALF_DIM; i <= Chunk.CHUNK_HALF_DIM; i++) {
      for (let j = -Chunk.CHUNK_HALF_DIM; j <= Chunk.CHUNK_HALF_DIM; j++) {
        if (i === 0 && j === 0) {
          continue;
        }
        if (squirrel3(this.id + i * Chunk.CHUNK_DIM + j) / INTMAX32 < Chunk.DROP_NODES_CHANCE / 4) {
          droppedNodes.put(new Vector2(i, j));
          droppedNodes.put(new Vector2(j, -i));
          droppedNodes.put(new Vector2(-i, -j));
          droppedNodes.put(new Vector2(-j, i));
        }
      }
    }

    for (let i = -Chunk.CHUNK_HALF_DIM; i <= Chunk.CHUNK_HALF_DIM; i++) {
      for (let j = -Chunk.CHUNK_HALF_DIM; j <= Chunk.CHUNK_HALF_DIM; j++) {
        let loc = new Vector2(i, j);
        if (!droppedNodes.get(loc)) {
          this.nodes.push(new Vector2(i, j));
        }
      }
    }
  }

  public hash(): string {
    return this.id.toString();
  }
}

export class RenderedChunk {
  public chunk!: Chunk;
  public container: Pixi.Container;
  public renderedNodes: HashMap<Vector2, Pixi.Graphics | Pixi.Sprite> = new HashMap();

  public static SPACING_PX: number = 24;
  public static CHUNK_SPACING_PX: number = (Chunk.CHUNK_DIM + 0.5) * RenderedChunk.SPACING_PX;
  public static NODE_SIZE_PX: number = 14;
  public static NODE_HITAREA_PX: number = 18;
  public static NODE_ROUNDED_PX: number = 4;

  constructor(chunk: Chunk, onNodeFocus?: Function, texture?: Pixi.Texture) {
    this.chunk = chunk;
    // this.parentContainer = parent;

    // render the thing
    this.container = new Pixi.Container();

    for (let node of chunk.nodes) {
      let g: Pixi.Graphics | Pixi.Sprite = new Pixi.Graphics();
      if (!texture) {
        // g.beginFill(0xff8080);
        // // if (node.x == 0 && node.y == 0) {
        // //   g.beginFill(0xff0000);
        // // }
        // g.drawRoundedRect(
        //   node.x * RenderedChunk.SPACING_PX - RenderedChunk.NODE_SIZE_PX / 2,
        //   node.y * RenderedChunk.SPACING_PX - RenderedChunk.NODE_SIZE_PX / 2,
        //   RenderedChunk.NODE_SIZE_PX,
        //   RenderedChunk.NODE_SIZE_PX,
        //   RenderedChunk.NODE_ROUNDED_PX
        // );
        // this.renderedNodes.put(node, g);
      } else {
        g = new Pixi.Sprite(texture);
        g.anchor.x = 0.5;
        g.anchor.y = 0.5;
        g.x = node.x * RenderedChunk.SPACING_PX;
        g.y = node.y * RenderedChunk.SPACING_PX;
        this.renderedNodes.put(node, g);
      }
      g.hitArea = new Pixi.Rectangle(
        node.x * RenderedChunk.SPACING_PX - RenderedChunk.NODE_HITAREA_PX / 2,
        node.y * RenderedChunk.SPACING_PX - RenderedChunk.NODE_HITAREA_PX / 2,
        RenderedChunk.NODE_HITAREA_PX,
        RenderedChunk.NODE_HITAREA_PX,
      )
      g.interactive = true;
      g.addListener("pointerdown", () => {
        onNodeFocus?.(this.chunk, node);
        console.log(`clicked chunk ${this.chunk.location.x} ${this.chunk.location.y} node ${node.x}, ${node.y}`);

        // if nothing is selected
        if (this.chunk.selectedNodes.values().length == 0) {
          // select it
          this.chunk.selectedNodes.put(node);
          g.tint = 0xBBBBBB;
          // g.alpha = 0.5;
        } else if (this.chunk.selectedNodes.get(node)) {
          // i was already selected, let's allocate it
          this.chunk.selectedNodes.remove(node);
          // try to allocate, only allow if we are connected to something already allocated
          let neighbors = [node.addX(1), node.addY(1), node.addY(-1), node.addX(-1)];
          let allowed = false;
          for (let neighbor of neighbors) {
            if (this.chunk.allocatedNodes.get(neighbor)) {
              allowed = true;
              break;
            }
          }
          if (allowed) {
            this.chunk.allocatedNodes.put(node);
            g.tint = 0x00aaff;
          } else {
            g.tint = 0xFFFFFF;
            window.alert('not allowed to allocate that one!');
          }
          // g.alpha = 0.5;
        } else {
          // unselect what was previously selected
          for (let selected of this.chunk.selectedNodes.values()) {
            this.renderedNodes.get(selected).tint = 0xFFFFFF;
            this.chunk.selectedNodes.remove(selected);
          }
          this.chunk.selectedNodes.put(node);
          g.tint = 0xBBBBBB;
        }
      });
      this.container.addChild(g);
    }

    this.container.x = this.chunk.location.x * RenderedChunk.CHUNK_SPACING_PX;
    this.container.y = this.chunk.location.y * RenderedChunk.CHUNK_SPACING_PX;
  }

  public hash(): string {
    return this.chunk.hash();
  }
}