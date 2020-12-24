import * as Pixi from "pixi.js";
import { ChunkRef, GameState, PointNodeRef, ZLevelGen } from "../../data/GameState";
import { ZLevelGenFactory } from "../../dataFactory/WorldGenStateFactory";
import { PixiPointFrom } from "../../lib/pixi/pixify";
import { HashSet, KeyedHashMap } from "../../lib/util/data_structures/hash";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { Const } from "../../lib/util/misc";
import { UpdaterGeneratorType2 } from "../../lib/util/updaterGenerator";
import { RenderedChunkConstants, ChunkComponent } from "./ChunkComponent";

type Props = {
  delta: number,
  args: {
    pointNodeTexture: Pixi.Texture,
    z: number,
  },
  updaters: UpdaterGeneratorType2<GameState>,
  position: Vector2,
  zLevelGen: Const<ZLevelGen> | undefined,
  selectedPointNode: PointNodeRef | undefined,
  allocatedPointNodeSubset: Const<HashSet<PointNodeRef>>,
}

export class ZLevelComponent {
  public container: Pixi.Container;
  staleProps!: Props;
  state!: {};

  public children: KeyedHashMap<ChunkRef, ChunkComponent> = new KeyedHashMap();

  constructor(props: Props) {
    this.staleProps = props;
    this.state = {};
    this.container = new Pixi.Container();

    for (let [chunkCoord, chunkGen] of props.zLevelGen?.chunks?.entries() || []) {
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

    this.renderSelf(props);
    this.didMount();
  }

  renderSelf(props: Props) {
    this.container.position = PixiPointFrom(props.position);
  }

  updateSelf(props: Props) { }
  shouldUpdate(prevProps: Props, props: Props): boolean {
    for (let key of (Object.keys(prevProps) as (keyof Props)[])) {
      if (key === 'delta' || key === 'args' || key === 'updaters') { continue; }
      if (key === 'position') {
        if (!prevProps[key].equals(props[key])) {
          return true;
        } else {
          continue;
        }
      }
      if (key === 'allocatedPointNodeSubset') {
        if (prevProps[key].hash() !== props[key].hash()) {
          return true;
        } else {
          continue;
        }
      }
      if (prevProps[key] !== props[key]) {
        return true;
      }
    }
    return false;
  }

  public update(props: Props) {
    if (!this.shouldUpdate(this.staleProps, props)) { return; }
    this.updateSelf(props);
    for (let [chunkCoord, chunkGen] of props.zLevelGen?.chunks?.entries() || []) {
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
      let childComponent = this.children.get(chunkRef);
      if (childComponent) {
        childComponent.update(childProps);
      } else {
        childComponent = new ChunkComponent(childProps);
        this.children.put(chunkRef, childComponent);
        this.container.addChild(childComponent.container);
      }
    }
    this.renderSelf(props);
    this.didUpdate(this.staleProps, props);
    this.staleProps = props;
    // this.staleProps.allocatedPointNodeSubset = this.staleProps.allocatedPointNodeSubset.clone();
  }

  didUpdate(prevProps: Props, props: Props) {

  }

  didMount() {
    const { args, updaters } = this.staleProps;
    // if we mounted but our data is not generated, please generate ourselves
    updaters.worldGen.zLevels.update((prev, prevGameState) => {
      if (!prev[args.z]) {
        return { [args.z]: new ZLevelGenFactory({}).create({ seed: prevGameState.worldGen.seed, z: args.z }) };
      }
      return prev;
    })
    // updaters.playerSave.allocatedPointNodeSet.update((prev, prevGameState) => {
    //   if (prev.size() === 0) {
    //     let startNode = prevGameState.worldGen.zLevels[0].chunks.get(new Vector2(0, 0))?.pointNodes.get(new Vector2(0, 0));
    //     if (startNode) {
    //       prev.put(new PointNodeRef({
    //         z: 0,
    //         chunkCoord: new Vector2(0, 0),
    //         pointNodeCoord: new Vector2(0, 0),
    //         pointNodeId: startNode?.id
    //       }))
    //       return prev.clone();
    //     }
    //   }
    //   return prev;
    // })
  }
}
