import * as Pixi from "pixi.js";
import { ChunkRef, GameState, PointNodeRef, ZLevelGen } from "../../data/GameState";
import { PixiPointFrom } from "../../lib/pixi/pixify";
import { HashSet, KeyedHashMap } from "../../lib/util/data_structures/hash";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { UpdaterGeneratorType2 } from "../../lib/util/updaterGenerator";
import { RenderedChunkConstants } from "../RenderedChunk";
import { ChunkComponent } from "./ChunkComponent";


type Props = {
  delta: number,
  args: {
    pointNodeTexture: Pixi.Texture,
    z: number,
  },
  updaters: UpdaterGeneratorType2<GameState>,
  position: Vector2,
  zLevelGen: ZLevelGen,
  selectedPointNode: PointNodeRef | undefined,
  allocatedPointNodeSubset: HashSet<PointNodeRef>,
}

export class RenderedZLevel {
  public container: Pixi.Container;
  staleProps!: Props;
  state!: {};

  public children: KeyedHashMap<ChunkRef, ChunkComponent> = new KeyedHashMap();

  constructor(props: Props) {
    this.staleProps = props;
    this.state = {};
    this.container = new Pixi.Container();

    for (let [chunkCoord, chunkGen] of props.zLevelGen.chunks.entries()) {
      const chunkRef = new ChunkRef({
        z: props.args.z,
        chunkCoord,
        chunkId: chunkGen.id,
      });

      let allocatedPointNodeSubset = new HashSet(
        props.allocatedPointNodeSubset.values()
          .filter((pointNodeRef) => {
            return pointNodeRef.chunkCoord.x === chunkRef.chunkCoord.x &&
              pointNodeRef.chunkCoord.y === chunkRef.chunkCoord.y;
          })
      );
      let childProps = {
        delta: props.delta,
        args: {
          pointNodeTexture: props.args.pointNodeTexture,
          selfChunkRef: chunkRef,
        },
        updaters: props.updaters,
        position: chunkRef.chunkCoord.multiply(RenderedChunkConstants.CHUNK_SPACING_PX),
        chunkGen: chunkGen,
        selectedPointNode: props.selectedPointNode,
        allocatedPointNodeSubset,
      }
      const childComponent = new ChunkComponent(childProps);
      this.children.put(chunkRef, childComponent);
      this.container.addChild(childComponent.container);

    }
  }

  renderSelf(props: Props) {
    this.container.position = PixiPointFrom(props.position);
  }

  updateSelf(props: Props) { }

  public update(props: Props) {
    this.updateSelf(props);
    for (let [chunkCoord, chunkGen] of props.zLevelGen.chunks.entries()) {
      const chunkRef = new ChunkRef({
        z: props.args.z,
        chunkCoord,
        chunkId: chunkGen.id,
      });

      let allocatedPointNodeSubset = new HashSet(
        props.allocatedPointNodeSubset.values()
          .filter((pointNodeRef) => {
            return pointNodeRef.chunkCoord.x === chunkRef.chunkCoord.x &&
              pointNodeRef.chunkCoord.y === chunkRef.chunkCoord.y;
          })
      );
      let childProps = {
        delta: props.delta,
        args: {
          pointNodeTexture: props.args.pointNodeTexture,
          selfChunkRef: chunkRef,
        },
        updaters: props.updaters,
        position: chunkRef.chunkCoord.multiply(RenderedChunkConstants.CHUNK_SPACING_PX),
        chunkGen: chunkGen,
        selectedPointNode: props.selectedPointNode,
        allocatedPointNodeSubset,
      }
      this.children.get(chunkRef).update(childProps);
    }
    this.renderSelf(props);
  }
}
