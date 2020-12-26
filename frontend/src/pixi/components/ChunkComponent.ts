import * as Pixi from "pixi.js";
import { HashSet, KeyedHashMap } from "../../lib/util/data_structures/hash";
import { ChunkGen, ChunkGenConstants, ChunkRef, GameState, PointNodeRef } from "../../data/GameState";
import { PointNodeComponent } from "./PointNodeComponent";
import { UpdaterGeneratorType2 } from "../../lib/util/updaterGenerator";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { PixiPointFrom } from "../../lib/pixi/pixify";

export class RenderedChunkConstants {
//   public static SPACING_PX: number = 24;
//   public static CHUNK_SPACING_PX: number = (ChunkGenConstants.CHUNK_DIM + 0.5) * RenderedChunkConstants.SPACING_PX;
//   public static NODE_SIZE_PX: number = 14;
//   public static NODE_HITAREA_PX: number = 18;
  public static SPACING_PX: number = 36;
  public static CHUNK_SPACING_PX: number = (ChunkGenConstants.CHUNK_DIM + 0.0) * RenderedChunkConstants.SPACING_PX;
  public static NODE_SIZE_PX: number = 22;
  public static NODE_HITAREA_PX: number = RenderedChunkConstants.NODE_SIZE_PX + 4;
  public static NODE_ROUNDED_PX: number = 4;
}

export type ChunkComponentProps = Props;
type Props = {
  delta: number,
  args: {
    pointNodeTexture: Pixi.Texture,
  },
  selfChunkRef: ChunkRef,
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
        z: props.selfChunkRef.z,
        chunkCoord: props.selfChunkRef.chunkCoord,
        pointNodeCoord: pointNodeCoord,
        pointNodeId: pointNodeGen.id
      })
      let childProps = {
        delta: props.delta,
        args: {
          pointNodeTexture: props.args.pointNodeTexture,
        },
        selfPointNodeRef: pointNodeRef,
        updaters: props.updaters,
        pointNodeGen,
        position: pointNodeRef.pointNodeCoord.multiply(RenderedChunkConstants.SPACING_PX),
        isSelected: props.selectedPointNode?.pointNodeId === pointNodeRef.pointNodeId,
        isAllocated: props.allocatedPointNodeSubset.contains(pointNodeRef),
      };

      let childComponent = new PointNodeComponent(childProps);
      this.children.put(pointNodeRef, childComponent);
      this.container.addChild(childComponent.container);
    }

    this.renderSelf(props);
  }

  renderSelf(props: Props) {
    this.container.position = PixiPointFrom(props.position);
  }

  public willUnmount() { }

  updateSelf(props: Props) { }
  shouldUpdate(prevProps: Props, props: Props): boolean {
    return true;
    // for (let key of (Object.keys(prevProps) as (keyof Props)[])) {
    //   if (key === 'delta' || key === 'args' || key === 'updaters') { continue; }
    //   if (key === 'allocatedPointNodeSubset') {
    //     // subsets could be different objects but have the same contents
    //     if (prevProps[key].hash() !== props[key].hash()) {
    //       return true;
    //     } else {
    //       continue;
    //     }
    //   }
    //   if (prevProps[key] !== props[key]) {
    //     return true;
    //   }
    // }
    // return false;
  }

  public update(props: Props) {
    let staleState = { ... this.state };
    this.updateSelf(props)
    if (!this.shouldUpdate(this.staleProps, props)) { return; }
    for (let [pointNodeCoord, pointNodeGen] of props.chunkGen.pointNodes.entries()) {
      const pointNodeRef = new PointNodeRef({
        z: props.selfChunkRef.z,
        chunkCoord: props.selfChunkRef.chunkCoord,
        pointNodeCoord: pointNodeCoord,
        pointNodeId: pointNodeGen.id
      })
      let childProps = {
        delta: props.delta,
        args: {
          pointNodeTexture: props.args.pointNodeTexture,
        },
        selfPointNodeRef: pointNodeRef,
        updaters: props.updaters,
        position: pointNodeRef.pointNodeCoord.multiply(RenderedChunkConstants.SPACING_PX),
        pointNodeGen,
        isSelected: props.selectedPointNode?.pointNodeId === pointNodeRef.pointNodeId,
        isAllocated: props.allocatedPointNodeSubset.contains(pointNodeRef),
      };

      let childComponent = this.children.get(pointNodeRef);
      if (childComponent) {
        childComponent.update(childProps);
      } else {
        childComponent = new PointNodeComponent(childProps);
        this.children.put(pointNodeRef, childComponent);
        this.container.addChild(childComponent.container);
      }
    }
    this.renderSelf(props);
    this.staleProps = props;
  }
}
