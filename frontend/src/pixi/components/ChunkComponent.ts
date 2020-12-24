import * as Pixi from "pixi.js";
import { HashSet, KeyedHashMap } from "../../lib/util/data_structures/hash";
import { ChunkGen, ChunkGenConstants, ChunkRef, GameState, PointNodeRef } from "../../data/GameState";
import { PointNodeComponent } from "./PointNodeComponent";
import { UpdaterGeneratorType2 } from "../../lib/util/updaterGenerator";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { PixiPointFrom } from "../../lib/pixi/pixify";

export class RenderedChunkConstants {
  public static SPACING_PX: number = 24;
  public static CHUNK_SPACING_PX: number = (ChunkGenConstants.CHUNK_DIM + 0.5) * RenderedChunkConstants.SPACING_PX;
  public static NODE_SIZE_PX: number = 14;
  public static NODE_HITAREA_PX: number = 18;
  public static NODE_ROUNDED_PX: number = 4;
}

type Props = {
  delta: number,
  args: {
    pointNodeTexture: Pixi.Texture,
    selfChunkRef: ChunkRef,
  },
  updaters: UpdaterGeneratorType2<GameState>,
  position: Vector2,
  chunkGen: ChunkGen,
  selectedPointNode: PointNodeRef | undefined,
  allocatedPointNodeSubset: HashSet<PointNodeRef>,
}

export class ChunkComponent {
  public container: Pixi.Container;
  staleProps!: Props;
  state!: {};

  public children: KeyedHashMap<PointNodeRef, PointNodeComponent>;

  constructor(props: Props) {
    this.staleProps = props;
    this.state = {};
    this.container = new Pixi.Container();
    this.children = new KeyedHashMap();

    for (let [pointNodeCoord, pointNodeGen] of props.chunkGen.pointNodes.entries()) {
      const pointNodeRef = new PointNodeRef({
        z: props.args.selfChunkRef.z,
        chunkCoord: props.args.selfChunkRef.chunkCoord,
        pointNodeCoord: pointNodeCoord,
        pointNodeId: pointNodeGen.id
      })
      let childProps = {
        delta: props.delta,
        args: {
          pointNodeTexture: props.args.pointNodeTexture,
          selfPointNodeRef: pointNodeRef,
        },
        updaters: props.updaters,
        position: pointNodeRef.pointNodeCoord.multiply(RenderedChunkConstants.SPACING_PX),
        isSelected: props.selectedPointNode?.pointNodeId == pointNodeRef.pointNodeId,
        isAllocated: props.allocatedPointNodeSubset.contains(pointNodeRef),
      };

      let childComponent = new PointNodeComponent(childProps);
      this.children.put(pointNodeRef, childComponent);
      this.container.addChild(childComponent.container);
    }
  }

  renderSelf(props: Props) {
    this.container.position = PixiPointFrom(props.position);
  }

  updateSelf(props: Props) { }

  public update(props: Props) {
    this.updateSelf(props);
    for (let [pointNodeCoord, pointNodeGen] of props.chunkGen.pointNodes.entries()) {
      const pointNodeRef = new PointNodeRef({
        z: props.args.selfChunkRef.z,
        chunkCoord: props.args.selfChunkRef.chunkCoord,
        pointNodeCoord: pointNodeCoord,
        pointNodeId: pointNodeGen.id
      })
      let childProps = {
        delta: props.delta,
        args: {
          pointNodeTexture: props.args.pointNodeTexture,
          selfPointNodeRef: pointNodeRef,
        },
        updaters: props.updaters,
        position: pointNodeRef.pointNodeCoord.multiply(RenderedChunkConstants.SPACING_PX),
        isSelected: props.selectedPointNode?.pointNodeId == pointNodeRef.pointNodeId,
        isAllocated: props.allocatedPointNodeSubset.contains(pointNodeRef),
      };

      let childComponent = this.children.get(pointNodeRef);
      childComponent.update(childProps);
    }
    this.renderSelf(props);
  }
}
