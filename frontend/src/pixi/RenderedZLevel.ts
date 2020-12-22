import * as Pixi from "pixi.js";
import { ChunkRef, PointNodeRef, ZLevelGen } from "../data/GameState";
import { KeyedHashMap, HashSet } from "../lib/util/data_structures/hash";
import { Vector2 } from "../lib/util/geometry/vector2";
import { squirrel3 } from "../lib/util/random";
import { RenderedChunk, RenderedChunkConstants } from "./RenderedChunk";


export class RenderedZLevel {
  public container: Pixi.Container;
  public z: number;
  public renderedChunks: KeyedHashMap<ChunkRef, RenderedChunk> = new KeyedHashMap();

  constructor(args: {
    pointNodeTexture: Pixi.Texture,
    z: number,
    zLevelGen: ZLevelGen, // what is in me
    stateUpdaterQueue: [Function],
    ticker: Pixi.Ticker
  }) {
  // constructor(zLevel: ZLevel, onNodeFocus: (selection: PointNodeRef) => void, texture?: Pixi.Texture) {
    this.z = args.z;
    this.container = new Pixi.Container();

    for (let [chunkCoord, chunkGen] of args.zLevelGen.chunks.entries()) {
      const chunkRef = new ChunkRef({
        z: this.z,
        chunkCoord,
        chunkId: chunkGen.id,
      });
      const renderedChunk = new RenderedChunk({
        selfChunkRef: chunkRef,
        chunkGen,
        ...args
      });
      this.renderedChunks.put(chunkRef, renderedChunk);
      this.container.addChild(renderedChunk.container);
      renderedChunk.container.x = chunkCoord.x * RenderedChunkConstants.CHUNK_SPACING_PX;
      renderedChunk.container.y = chunkCoord.y * RenderedChunkConstants.CHUNK_SPACING_PX;

    }
  }

  public animate(delta: number): this {
    return this;
  }

  public rerender(props: {
    selectedPointNode: PointNodeRef | undefined,
    allocatedPointNodeSubset: HashSet<PointNodeRef>,
  }) {
    for (let [chunkRef, child] of this.renderedChunks.entries()) {
      let relevantToChunk = new HashSet(
        props.allocatedPointNodeSubset.values()
          .filter((pointNodeRef) => {
            return pointNodeRef.chunkCoord.x === chunkRef.chunkCoord.x &&
              pointNodeRef.chunkCoord.y === chunkRef.chunkCoord.y;
          })
      );

      child.rerender({
        selectedPointNode: props.selectedPointNode,
        allocatedPointNodeSubset: relevantToChunk
      })
    }
  }
}