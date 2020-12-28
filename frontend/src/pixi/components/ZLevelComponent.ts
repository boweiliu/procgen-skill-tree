import * as Pixi from "pixi.js";
import { ChunkGen, ChunkRef, GameState, PointNodeRef, ZLevelGen } from "../../data/GameState";
import { ZLevelGenFactory } from "../../game/WorldGenStateFactory";
import { PixiPointFrom } from "../../lib/pixi/pixify";
import { HashSet, KeyedHashMap } from "../../lib/util/data_structures/hash";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { Const } from "../../lib/util/misc";
import { UpdaterGeneratorType2 } from "../../lib/util/updaterGenerator";
import { RenderedChunkConstants, ChunkComponent, ChunkComponentProps } from "./ChunkComponent";

type Props = {
  delta: number,
  args: {
    pointNodeTexture: Pixi.Texture,
    markForceUpdate: (childInstance: any) => void,
  },
  z: number,
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

  public _children: {childClass :any, instance: any, propsFactory: Function}[] = []
  public forceUpdates: {childClass :any, instance: any, propsFactory: Function}[] = []

  constructor(props: Props) {
    this.staleProps = props;
    this.state = {};
    this.container = new Pixi.Container();

    this.upsertChildren(props);

    this.renderSelf(props);
    this.didMount();
  }

  renderSelf(props: Props) {
    this.container.position = PixiPointFrom(props.position);
  }

  /** callback passed to child - since child is not a pure component, it needs to inform us of updates if otherwise we wouldnt update */
  markForceUpdate = (childInstance: any) => {
    this.staleProps.args.markForceUpdate(this); // mark us for update in OUR parent
    if ((this._children as any[]).indexOf(childInstance) === -1) {
      throw new Error(`Error, child ${childInstance} not found in ${this}`);
    } else {
      this.forceUpdates.push(this._children[(this._children as any[]).indexOf(childInstance)])
    }
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
      if (prevProps[key] !== props[key]) {
        return true;
      }
    }
    return false;
  }

  doChild(props: Props, chunkCoord: Vector2, chunkGen: ChunkGen): { childKey: ChunkRef, childProps: ChunkComponentProps } {
    const chunkRef = new ChunkRef({
      z: props.z,
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
        markForceUpdate: this.markForceUpdate
      },
      selfChunkRef: chunkRef,
      updaters: props.updaters,
      position: chunkRef.chunkCoord.multiply(RenderedChunkConstants.CHUNK_SPACING_PX),
      chunkGen: chunkGen,
      selectedPointNode: props.selectedPointNode,
      allocatedPointNodeSubset,
    }
    return {
      childKey: chunkRef,
      childProps
    };
  }

  upsertChildren(props: Props) {
    let childrenToDelete = this.children.clone(); // track which children need to be destroyed according to new props
    console.log(`zlevel component have ${this.children.size()} children`)
    for (let [chunkCoord, chunkGen] of props.zLevelGen?.chunks?.entries() || []) {
      const { childKey, childProps } = this.doChild(props, chunkCoord, chunkGen);
      let childComponent = this.children.get(childKey);
      if (childComponent) {
        childComponent.update(childProps);
        childrenToDelete.remove(childKey);
      } else {
        childComponent = new ChunkComponent(childProps);
        this.children.put(childKey, childComponent);
        this.container.addChild(childComponent.container);
      }
    }
    console.log(`zlevel component have ${childrenToDelete.size()} children to delete`)
    for (let [childKey, childComponent] of childrenToDelete.entries()) {
      childComponent.willUnmount();
      this.children.remove(childKey);
      this.container.removeChild(childComponent.container);
    }
  }

  public update(props: Props) {
    // let staleState = { ...this.state };
    this.updateSelf(props)
    if (!this.shouldUpdate(this.staleProps, props)) { return; }

    this.upsertChildren(props);

    this.renderSelf(props);
    this.didUpdate(this.staleProps, props);
    this.staleProps = props;
    // this.staleProps.allocatedPointNodeSubset = this.staleProps.allocatedPointNodeSubset.clone();
  }

  didUpdate(prevProps: Props, props: Props) {

  }

  public willUnmount() { }

  didMount() {
    const { updaters } = this.staleProps;
    // if we mounted but our data is not generated, please generate ourselves
    updaters.worldGen.zLevels.enqueueUpdate((prev, prevGameState) => {
      if (!prev[this.staleProps.z]) {
        return { [this.staleProps.z]: new ZLevelGenFactory({}).create({ seed: prevGameState.worldGen.seed, z: this.staleProps.z }) };
      }
      return prev;
    })
  }
}


export type { Props as ZLevelComponentProps };