import * as Pixi from "pixi.js";
import { HashSet, KeyedHashMap } from "../../lib/util/data_structures/hash";
import { ChunkGen, ChunkGenConstants, ChunkRef, GameState, PointNodeRef } from "../../data/GameState";
import { PointNodeComponent, PointNodeComponentProps } from "./PointNodeComponent";
import { UpdaterGeneratorType2 } from "../../lib/util/updaterGenerator";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { PixiPointFrom } from "../../lib/pixi/pixify";
import { engageLifecycle, LifecycleHandlerBase } from "./LifecycleHandler";

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

type Props = {
  delta: number,
  args: {
    pointNodeTexture: Pixi.Texture,
    markForceUpdate: (childInstance: any) => void,
  },
  selfChunkRef: ChunkRef,
  updaters: UpdaterGeneratorType2<GameState>,
  position: Vector2,
  chunkGen: ChunkGen,
  selectedPointNode: PointNodeRef | undefined,
  allocatedPointNodeSubset: HashSet<PointNodeRef>,
}

type State = {}

export class ChunkComponent {
  public container: Pixi.Container;
  staleProps!: Props;
  state!: State;

  public children: KeyedHashMap<PointNodeRef, PointNodeComponent>;
  
  public _children: {childClass :any, instance: any, propsFactory: Function}[] = []
  public forceUpdates: {childClass :any, instance: any, propsFactory: Function}[] = []

  constructor(props: Props) {
    this.staleProps = props;
    this.state = {};
    this.container = new Pixi.Container();
    this.children = new KeyedHashMap();

    this.upsertChildren(props);

    this.renderSelf(props);
  }

  renderSelf(props: Props) {
    this.container.position = PixiPointFrom(props.position);
  }

  public willUnmount() { }

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
    // return true;
    for (let key of (Object.keys(prevProps) as (keyof Props)[])) {
      if (key === 'delta' || key === 'args' || key === 'updaters') { continue; }
      if (key === 'position') {
        if (!prevProps[key].equals(props[key])) {
          console.log(`chunk shouldUpdate differed in ${key}, returning true`);
          return true;
        } else {
          continue;
        }
      }
      if (key === 'selectedPointNode') {
        if (prevProps[key]?.hash() !== props[key]?.hash()) {
          console.log(`chunk shouldUpdate differed in ${key}, returning true`);
          return true;
        } else {
          continue;
        }
      }
      if (key === 'selfChunkRef') {
        if (prevProps[key]?.hash() !== props[key]?.hash()) {
          console.log(`chunk shouldUpdate differed in ${key}, returning true`);
          return true;
        } else {
          continue;
        }
      }
      if (key === 'allocatedPointNodeSubset') {
        // subsets could be different objects but have the same contents
        if (!prevProps[key].equals(props[key])) {
          // console.log(`prevProps: ${JSON.stringify(prevProps[key])}`);
          // console.log(`props: ${JSON.stringify(props[key])}`);
          console.log(`chunk shouldUpdate differed in ${key}, returning true`);
          return true;
        } else {
          continue;
        }
      }
      if (prevProps[key] !== props[key]) {
        console.log(`chunk shouldUpdate differed in ${key}, returning true`);
        return true;
      }
    }
    return false;
  }

  upsertChildren(props: Props) {
    let childrenToDelete = this.children.clone(); // track which children need to be destroyed according to new props
    console.log(`chunk component upsert children got here`);
    // console.log(`chunk component upsert children has ${this.children.size()} children`);

    for (let [pointNodeCoord, pointNodeGen] of props.chunkGen.pointNodes.entries()) {
      const pointNodeRef = new PointNodeRef({
        z: props.selfChunkRef.z,
        chunkCoord: props.selfChunkRef.chunkCoord,
        pointNodeCoord: pointNodeCoord,
        pointNodeId: pointNodeGen.id
      })
      let childPropsFactory = (props: Props, state: State) => {
        return {
          delta: props.delta,
          args: {
            pointNodeTexture: props.args.pointNodeTexture,
            markForceUpdate: this.markForceUpdate,
          },
          selfPointNodeRef: pointNodeRef,
          updaters: props.updaters,
          position: pointNodeRef.pointNodeCoord.multiply(RenderedChunkConstants.SPACING_PX),
          pointNodeGen,
          isSelected: props.selectedPointNode?.pointNodeId === pointNodeRef.pointNodeId,
          isAllocated: props.allocatedPointNodeSubset.contains(pointNodeRef),
        };
      }
      const childKey = pointNodeRef;

      let childComponent = this.children.get(childKey);
      if (childComponent) {
        childComponent.update(childPropsFactory(props, this.state));
        childrenToDelete.remove(childKey);
      } else {
        childComponent = new PointNodeComponent(childPropsFactory(props, this.state));
        this.children.put(pointNodeRef, childComponent);
        this.container.addChild(childComponent.container);
        this._children.push({
          childClass: ChunkComponent,
          instance: childComponent,
          propsFactory: childPropsFactory
        });
      }
    }
    // console.log(`chunk component to delete has ${childrenToDelete.size()} children`);
    for (let [childKey, childComponent] of childrenToDelete.entries()) {
      childComponent.willUnmount();
      this.children.remove(childKey);
      this.container.removeChild(childComponent.container);
      this._children.splice(this._children.findIndex(it => it.instance === childComponent), 1);
    }
  }

  public didForceUpdateChild(instance: PointNodeComponent) {
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
      }
      // no need to do anything else -- stale props has not changed
      return;
    }

    this.upsertChildren(props);

    this.renderSelf(props);
    this.staleProps = props;
  }

  // bridge while we migrate to lifecycle handler
  public _update(props: Props) { this.update(props); }
}

class ChunkComponent2 extends LifecycleHandlerBase<Props, State> {
  public container: Pixi.Container;
  protected state: State;

  public children: KeyedHashMap<PointNodeRef, PointNodeComponent>;

  constructor(props: Props) {
    super(props);

    this.state = {};
    this.container = new Pixi.Container();
    this.children = new KeyedHashMap();

    this.upsertChildren(props);
  }

  protected renderSelf(props: Props) {
    this.container.position = PixiPointFrom(props.position);
  }

  protected shouldUpdate(prevProps: Props, prevState: State, props: Props, state: State): boolean {
    // return true;
    for (let key of (Object.keys(prevProps) as (keyof Props)[])) {
      if (key === 'delta' || key === 'args' || key === 'updaters') { continue; }
      if (key === 'position') {
        if (!prevProps[key].equals(props[key])) {
          console.log(`chunk shouldUpdate differed in ${key}, returning true`);
          return true;
        } else {
          continue;
        }
      }
      if (key === 'selectedPointNode') {
        if (prevProps[key]?.hash() !== props[key]?.hash()) {
          console.log(`chunk shouldUpdate differed in ${key}, returning true`);
          return true;
        } else {
          continue;
        }
      }
      if (key === 'selfChunkRef') {
        if (prevProps[key]?.hash() !== props[key]?.hash()) {
          console.log(`chunk shouldUpdate differed in ${key}, returning true`);
          return true;
        } else {
          continue;
        }
      }
      if (key === 'allocatedPointNodeSubset') {
        // subsets could be different objects but have the same contents
        if (!prevProps[key].equals(props[key])) {
          // console.log(`prevProps: ${JSON.stringify(prevProps[key])}`);
          // console.log(`props: ${JSON.stringify(props[key])}`);
          console.log(`chunk shouldUpdate differed in ${key}, returning true`);
          return true;
        } else {
          continue;
        }
      }
      if (prevProps[key] !== props[key]) {
        console.log(`chunk shouldUpdate differed in ${key}, returning true`);
        return true;
      }
    }
    return false;
  }

  private upsertChildren(props: Props) {
    let childrenToDelete = this.children.clone(); // track which children need to be destroyed according to new props
    console.log(`chunk component upsert children got here`);
    // console.log(`chunk component upsert children has ${this.children.size()} children`);

    for (let [pointNodeCoord, pointNodeGen] of props.chunkGen.pointNodes.entries()) {
      const pointNodeRef = new PointNodeRef({
        z: props.selfChunkRef.z,
        chunkCoord: props.selfChunkRef.chunkCoord,
        pointNodeCoord: pointNodeCoord,
        pointNodeId: pointNodeGen.id
      })
      let childPropsFactory = (props: Props, state: State) => {
        return {
          delta: props.delta,
          args: {
            pointNodeTexture: props.args.pointNodeTexture,
            markForceUpdate: this.markForceUpdate,
          },
          selfPointNodeRef: pointNodeRef,
          updaters: props.updaters,
          position: pointNodeRef.pointNodeCoord.multiply(RenderedChunkConstants.SPACING_PX),
          pointNodeGen,
          isSelected: props.selectedPointNode?.pointNodeId === pointNodeRef.pointNodeId,
          isAllocated: props.allocatedPointNodeSubset.contains(pointNodeRef),
        };
      }
      const childKey = pointNodeRef;

      let childComponent = this.children.get(childKey);
      if (childComponent) {
        childComponent.update(childPropsFactory(props, this.state));
        childrenToDelete.remove(childKey);
      } else {
        childComponent = new PointNodeComponent(childPropsFactory(props, this.state));
        this.children.put(pointNodeRef, childComponent);
        // this.container.addChild(childComponent.container);
        this.addChild({
          childClass: PointNodeComponent,
          instance: childComponent,
          propsFactory: childPropsFactory
        });
      }
    }
    // console.log(`chunk component to delete has ${childrenToDelete.size()} children`);
    for (let [childKey, childComponent] of childrenToDelete.entries()) {
      childComponent.willUnmount();
      this.children.remove(childKey);
      // this.container.removeChild(childComponent.container);
      this.removeChild(childComponent);
    }
  }

  protected didForceUpdateChild(instance: LifecycleHandlerBase<any, any>) {
    this.container.removeChild(instance.container);
    this.container.addChild(instance.container);
  }
}




const wrapped = engageLifecycle(ChunkComponent);
// eslint-disable-next-line
type wrapped = ChunkComponent;
// export { wrapped as ChunkComponent };
export type { Props as ChunkComponentProps };
