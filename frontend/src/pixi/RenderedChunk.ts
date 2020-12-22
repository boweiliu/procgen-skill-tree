import { Line } from "../lib/util/geometry/line";
import { Vector2 } from "../lib/util/geometry/vector2";
import { INTMAX32, squirrel3 } from "../lib/util/random";
import * as Pixi from "pixi.js";
import { HashMap, HashSet, KeyedHashMap } from "../lib/util/data_structures/hash";
import { ChunkGen, ChunkGenConstants, ChunkRef, PointNodeRef } from "../data/GameState";
import { RenderedPointNode } from "./RenderedPointNode";

export class RenderedChunkConstants {
  public static SPACING_PX: number = 24;
  public static CHUNK_SPACING_PX: number = (ChunkGenConstants.CHUNK_DIM + 0.5) * RenderedChunkConstants.SPACING_PX;
  public static NODE_SIZE_PX: number = 14;
  public static NODE_HITAREA_PX: number = 18;
  public static NODE_ROUNDED_PX: number = 4;
}

export class RenderedChunk {
  // public chunk!: Chunk;
  public container: Pixi.Container;
  public selfChunkRef: ChunkRef;

  public renderedPointNodes: KeyedHashMap<PointNodeRef, RenderedPointNode>;
  // public renderedNodes: HashMap<Vector2, Pixi.Graphics | Pixi.Sprite> = new HashMap();

  // args here will never change, and changing this will NOT force a rerender
  constructor(args: {
    pointNodeTexture: Pixi.Texture,
    selfChunkRef: ChunkRef, // where am i in parent
    chunkGen: ChunkGen, // what is in me
    stateUpdaterQueue: [Function],
    ticker: Pixi.Ticker
  }) {
    this.container = new Pixi.Container();
    this.selfChunkRef = args.selfChunkRef;
    this.renderedPointNodes = new KeyedHashMap();

    // args.chunkGen.pointNodes
    for (let [pointNodeCoord, pointNodeGen] of args.chunkGen.pointNodes.entries()) {
      const pointNodeRef = new PointNodeRef({
        z: this.selfChunkRef.z,
        chunkCoord: this.selfChunkRef.chunkCoord,
        pointNodeCoord: pointNodeCoord,
        pointNodeId: pointNodeGen.id
      })

      let renderedPointNode = new RenderedPointNode({
        selfPointNodeRef: pointNodeRef,
        ...args
      })
      this.renderedPointNodes.put(pointNodeRef, renderedPointNode);
      this.container.addChild(renderedPointNode.sprite);
      // renderedPointNode.setCoord(pointNodeRef); renderedPointNode.setCoord();
      renderedPointNode.sprite.x = pointNodeCoord.x * RenderedChunkConstants.SPACING_PX;
      renderedPointNode.sprite.y = pointNodeCoord.y * RenderedChunkConstants.SPACING_PX;
    }
    // this.container.x = this.chunk.location.x * RenderedChunk.CHUNK_SPACING_PX;
    // this.container.y = this.chunk.location.y * RenderedChunk.CHUNK_SPACING_PX;
  }
  
  public setLocation(chunk: ChunkRef = this.selfChunkRef): this {
    this.container.x = chunk.chunkCoord.x * RenderedChunkConstants.CHUNK_SPACING_PX;
    this.container.y = chunk.chunkCoord.y * RenderedChunkConstants.CHUNK_SPACING_PX;
    return this
  }

  public animate(delta: number): this {
    return this;
  }

  public rerender(props: {
    selectedPointNode: PointNodeRef | undefined,
    allocatedPointNodeSubset: HashSet<PointNodeRef>,
  }) {
    for (let child of this.renderedPointNodes.values()) {
      child.rerender({
        isSelected: props.selectedPointNode?.pointNodeId == child.selfPointNodeRef.pointNodeId,
        isAllocated: props.allocatedPointNodeSubset.contains(child.selfPointNodeRef),
      })
    }
  }



//     for (let node of chunk.nodes) {
//       let g: Pixi.Sprite = new Pixi.Sprite(args.nodeTexture);
//       g.anchor.x = 0.5;
//       g.anchor.y = 0.5;
//       g.x = node.x * RenderedChunkConstants.SPACING_PX;
//       g.y = node.y * RenderedChunkConstants.SPACING_PX;
//       g.hitArea = new Pixi.Rectangle(
//         - RenderedChunkConstants.NODE_HITAREA_PX / 2,
//         - RenderedChunkConstants.NODE_HITAREA_PX / 2,
//         RenderedChunkConstants.NODE_HITAREA_PX,
//         RenderedChunkConstants.NODE_HITAREA_PX,
//       )
//       this.renderedNodes.put(node, g);
//       g.interactive = true;
// 
//       if (this.chunk.allocatedNodes.get(node)) {
//         g.tint = 0x00aaff;
//       } else if (this.chunk.selectedNodes.get(node)) {
//         g.tint = 0xBBBBBB;
//       }
//       g.addListener("pointerdown", () => {
//         onNodeFocus(new PointNodeRef({
//           z: 0, // TODO(bowei): fix
//           chunkCoord: this.chunk.location,
//           pointNodeCoord: node,
//           pointNodeId: 0, // TODO(bowei): fix
//         }));
//         console.log(`clicked chunk ${this.chunk.location.x} ${this.chunk.location.y} node ${node.x}, ${node.y}`);
// 
//         // if nothing is selected
//         if (this.chunk.selectedNodes.values().length == 0) {
//           // select it
//           this.chunk.selectedNodes.put(node);
//           g.tint = 0xBBBBBB;
//           // g.alpha = 0.5;
//         } else if (this.chunk.selectedNodes.get(node)) {
//           // i was already selected, let's allocate it
//           this.chunk.selectedNodes.remove(node);
//           // try to allocate, only allow if we are connected to something already allocated
//           let neighbors = [node.addX(1), node.addY(1), node.addY(-1), node.addX(-1)];
//           let allowed = false;
//           for (let neighbor of neighbors) {
//             if (this.chunk.allocatedNodes.get(neighbor)) {
//               allowed = true;
//               break;
//             }
//           }
//           if (allowed) {
//             this.chunk.allocatedNodes.put(node);
//             g.tint = 0x00aaff;
//           } else {
//             g.tint = 0xFFFFFF;
//             window.alert('not allowed to allocate that one!');
//           }
//           // g.alpha = 0.5;
//         } else {
//           // unselect what was previously selected
//           for (let selected of this.chunk.selectedNodes.values()) {
//             this.renderedNodes.get(selected).tint = 0xFFFFFF;
//             this.chunk.selectedNodes.remove(selected);
//           }
//           this.chunk.selectedNodes.put(node);
//           g.tint = 0xBBBBBB;
//         }
//       });
//       this.container.addChild(g);
//     }
// 
//     this.container.x = this.chunk.location.x * RenderedChunk.CHUNK_SPACING_PX;
//     this.container.y = this.chunk.location.y * RenderedChunk.CHUNK_SPACING_PX;
//   }
// 
//   public hash(): string {
//     return this.chunk.hash();
//   }
}