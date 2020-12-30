import * as Pixi from "pixi.js";
import { ChunkGen, ChunkRef, GameState, PointNodeRef, ZLevelGen } from "../../data/GameState";
import { ZLevelGenFactory } from "../../game/WorldGenStateFactory";
import { PixiPointFrom } from "../../lib/pixi/pixify";
import { HashSet, KeyedHashMap } from "../../lib/util/data_structures/hash";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { Const } from "../../lib/util/misc";
import { UpdaterGeneratorType2 } from "../../lib/util/updaterGenerator";
import { RenderedChunkConstants, ChunkComponent, ChunkComponentProps } from "./ChunkComponent";
import { engageLifecycle, LifecycleHandlerBase } from "./LifecycleHandler";

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

type State = {}

export class ZLevelComponent {
  public container: Pixi.Container;
  staleProps!: Props;
  state!: State;

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

    for (let childInfo of this._children) {
      if (childInfo.instance === childInstance) { // we found the instance in our _children array, now ensure it is in force updates array then return
        if (this.forceUpdates.indexOf(childInfo) === -1) {
          this.forceUpdates.push(childInfo);
        }
        return;
      }
    }
    throw new Error(`Error, child ${childInstance} not found in ${this}`);
  }

  updateSelf(props: Props) { }
  shouldUpdate(prevProps: Props, props: Props): boolean {
    for (let key of (Object.keys(prevProps) as (keyof Props)[])) {
      if (key === 'delta' || key === 'args' || key === 'updaters') { continue; }
      if (key === 'position') {
        if (!prevProps[key].equals(props[key])) {
          console.log(`zlevel shouldUpdate differed in ${key}, returning true`);
          return true;
        } else {
          continue;
        }
      }
      if (key === 'selectedPointNode') {
        if (prevProps[key]?.hash() !== props[key]?.hash()) {
          console.log(`zlevel shouldUpdate differed in ${key}, returning true`);
          return true;
        } else {
          continue;
        }
      }
      if (prevProps[key] !== props[key]) {
        console.log(`zlevel shouldUpdate differed in ${key}, returning true`);
        return true;
      }
    }
    return false;
  }

  doChild(props: Props, chunkCoord: Vector2, chunkGen: ChunkGen): { childKey: ChunkRef, childPropsFactory: (p: Props, s: State) => ChunkComponentProps } {
    const chunkRef = new ChunkRef({
      z: props.z,
      chunkCoord,
      chunkId: chunkGen.id,
    });

    let childPropsFactory = (props: Props, state: State) => {
      let allocatedPointNodeSubset = new HashSet(
        props.allocatedPointNodeSubset.values().filter((pointNodeRef) => pointNodeRef.chunkCoord.equals(chunkRef.chunkCoord))
      );

      return {
        delta: props.delta,
        args: {
          pointNodeTexture: props.args.pointNodeTexture,
          markForceUpdate: this.markForceUpdate
        },
        selfChunkRef: chunkRef,
        updaters: props.updaters,
        position: chunkRef.chunkCoord.multiply(RenderedChunkConstants.CHUNK_SPACING_PX),
        chunkGen: chunkGen,
        // NOTE(bowei): for optimization, we dont tell other chunks about selected nodes in other chunks
        selectedPointNode: (props.selectedPointNode?.chunkCoord.equals(chunkRef.chunkCoord) ? props.selectedPointNode : undefined),
        allocatedPointNodeSubset,
      };
    }
    return {
      childKey: chunkRef,
      childPropsFactory
    };
  }

  upsertChildren(props: Props) {
    let childrenToDelete = this.children.clone(); // track which children need to be destroyed according to new props
    console.log(`zlevel component have ${this.children.size()} children`)
    for (let [chunkCoord, chunkGen] of props.zLevelGen?.chunks?.entries() || []) {
      const { childKey, childPropsFactory } = this.doChild(props, chunkCoord, chunkGen);
      let childComponent = this.children.get(childKey);
      if (childComponent) {
        childComponent.update(childPropsFactory(props, this.state));
        childrenToDelete.remove(childKey);
      } else {
        childComponent = new ChunkComponent(childPropsFactory(props, this.state));
        this.children.put(childKey, childComponent);
        this.container.addChild(childComponent.container);
        this._children.push({
          childClass: ChunkComponent,
          instance: childComponent,
          propsFactory: childPropsFactory
        });
      }
    }
    console.log(`zlevel component have ${childrenToDelete.size()} children to delete`)
    for (let [childKey, childComponent] of childrenToDelete.entries()) {
      childComponent.willUnmount();
      this.children.remove(childKey);
      this.container.removeChild(childComponent.container);
      this._children.splice(this._children.findIndex(it => it.instance === childComponent), 1);
    }
  }

  public didForceUpdateChild(instance: ChunkComponent) {
    this.container.removeChild(instance.container);
    this.container.addChild(instance.container);
  }

  public update(props: Props) {
    // let staleState = { ...this.state };
    this.updateSelf(props)
    if (!this.shouldUpdate(this.staleProps, props)) {
      // we think we don't need to update; however, we still need to
      // update the chidlren that asked us to forcefully update them
      let forceUpdates = [...this.forceUpdates];
      this.forceUpdates = [];
      for (let { instance, propsFactory } of forceUpdates) {
        instance._update(propsFactory(props, this.state)); // why are we even calling props factory here?? theres no point... we should just tell the child to use their own stale props, like this:
        // instance._forceUpdate();
        // note that children can add themselves into forceupdate next tick as well, if they need to ensure they're continuously in there

        this.didForceUpdateChild(instance);
        this.didForceUpdate();
      }
      // no need to do anything else -- stale props has not changed
      return;
    }


    this.upsertChildren(props);

    this.renderSelf(props);
    this.didUpdate();
    this.staleProps = props;
    // this.staleProps.allocatedPointNodeSubset = this.staleProps.allocatedPointNodeSubset.clone();
  }

  didUpdate() { }
  didForceUpdate() { }

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

  // bridge while we migrate to lifecycle handler
  public _update(props: Props) { this.update(props); }
}

class ZLevelComponent2 extends LifecycleHandlerBase<Props, State> {
  public container: Pixi.Container;
  protected state: State;

  public children: KeyedHashMap<ChunkRef, ChunkComponent> = new KeyedHashMap();

  constructor(props: Props) {
    super(props);
    this.state = {};
    this.container = new Pixi.Container();

    this.upsertChildren(props);
  }

  protected renderSelf(props: Props) {
    this.container.position = PixiPointFrom(props.position);
  }

  protected didMount() {
    const { updaters } = this._staleProps;
    // if we mounted but our data is not generated, please generate ourselves
    updaters.worldGen.zLevels.enqueueUpdate((prev, prevGameState) => {
      if (!prev[this._staleProps.z]) {
        return { [this._staleProps.z]: new ZLevelGenFactory({}).create({ seed: prevGameState.worldGen.seed, z: this._staleProps.z }) };
      }
      return prev;
    })
  }

  protected didForceUpdateChild(instance: LifecycleHandlerBase<any, any>) {
    // IMPORTANT! this is intended to raise the child that asked for a force update to the top so it isn't covered
    // by other sibling pixi containers. however this code doesnt work well during the update call, for some reason (not sure why)
    this.container.removeChild(instance.container);
    this.container.addChild(instance.container);
  }

  protected shouldUpdate(prevProps: Props, prevState: State, props: Props, state: State): boolean {
    for (let key of (Object.keys(prevProps) as (keyof Props)[])) {
      if (key === 'delta' || key === 'args' || key === 'updaters') { continue; }
      if (key === 'position') {
        if (!prevProps[key].equals(props[key])) {
          console.log(`zlevel shouldUpdate differed in ${key}, returning true`);
          return true;
        } else {
          continue;
        }
      }
      if (key === 'selectedPointNode') {
        if (prevProps[key]?.hash() !== props[key]?.hash()) {
          console.log(`zlevel shouldUpdate differed in ${key}, returning true`);
          return true;
        } else {
          continue;
        }
      }
      if (prevProps[key] !== props[key]) {
        console.log(`zlevel shouldUpdate differed in ${key}, returning true`);
        return true;
      }
    }
    return false;
  }

  private upsertChildren(props: Props) {
    let childrenToDelete = this.children.clone(); // track which children need to be destroyed according to new props
    console.log(`zlevel component have ${this.children.size()} children`)
    for (let [chunkCoord, chunkGen] of props.zLevelGen?.chunks?.entries() || []) {
      const { childKey, childPropsFactory } = this.doChild(props, chunkCoord, chunkGen);
      let childComponent = this.children.get(childKey);
      if (childComponent) {
        // childComponent.update(childPropsFactory(props, this.state));
        childrenToDelete.remove(childKey);
      } else {
        childComponent = new ChunkComponent(childPropsFactory(props, this.state));
        this.children.put(childKey, childComponent);
        // this.container.addChild(childComponent.container);
        this.addChild({
          childClass: ChunkComponent,
          instance: childComponent,
          propsFactory: childPropsFactory
        });
      }
    }
    console.log(`zlevel component have ${childrenToDelete.size()} children to delete`)
    for (let [childKey, childComponent] of childrenToDelete.entries()) {
      // childComponent.willUnmount();
      this.children.remove(childKey);
      // this.container.removeChild(childComponent.container);
      // this._children.splice(this._children.findIndex(it => it.instance === childComponent), 1);
      this.removeChild(childComponent);
    }
  }

  private doChild(props: Props, chunkCoord: Vector2, chunkGen: ChunkGen): { childKey: ChunkRef, childPropsFactory: (p: Props, s: State) => ChunkComponentProps } {
    const chunkRef = new ChunkRef({
      z: props.z,
      chunkCoord,
      chunkId: chunkGen.id,
    });

    let childPropsFactory = (props: Props, state: State) => {
      let allocatedPointNodeSubset = new HashSet(
        props.allocatedPointNodeSubset.values().filter((pointNodeRef) => pointNodeRef.chunkCoord.equals(chunkRef.chunkCoord))
      );

      return {
        delta: props.delta,
        args: {
          pointNodeTexture: props.args.pointNodeTexture,
          markForceUpdate: this.markForceUpdate
        },
        selfChunkRef: chunkRef,
        updaters: props.updaters,
        position: chunkRef.chunkCoord.multiply(RenderedChunkConstants.CHUNK_SPACING_PX),
        chunkGen: chunkGen,
        // NOTE(bowei): for optimization, we dont tell other chunks about selected nodes in other chunks
        selectedPointNode: (props.selectedPointNode?.chunkCoord.equals(chunkRef.chunkCoord) ? props.selectedPointNode : undefined),
        allocatedPointNodeSubset,
      };
    }
    return {
      childKey: chunkRef,
      childPropsFactory
    };
  }

}

const wrapped = engageLifecycle(ZLevelComponent2);
// eslint-disable-next-line
type wrapped = ZLevelComponent2;
// export { wrapped as ZLevelComponent };
export type { Props as ZLevelComponentProps };