import * as Pixi from "pixi.js";
import { ChunkGen, ChunkRef, GameState, PointNodeRef, ZLevelGen } from "../../data/GameState";
import { ZLevelGenFactory } from "../../game/WorldGenStateFactory";
import { PixiPointFrom } from "../../lib/pixi/pixify";
import { HashSet, KeyedHashMap } from "../../lib/util/data_structures/hash";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { Const } from "../../lib/util/misc";
import { UpdaterGeneratorType2 } from "../../lib/util/updaterGenerator";
import { PointNodeTextureSet } from "../textures/PointNodeTexture";
import { RenderedChunkConstants, ChunkComponent, ChunkComponentProps } from "./ChunkComponent";
import { engageLifecycle, LifecycleHandlerBase } from "./LifecycleHandler";
import { RootComponentState } from "./RootComponent";

type Props = {
  delta: number,
  args: {
    pointNodeTexture: PointNodeTextureSet,
    markForceUpdate: (childInstance: any) => void,
  },
  z: number,
  updaters: UpdaterGeneratorType2<GameState>,
  tooltipUpdaters: UpdaterGeneratorType2<RootComponentState>['tooltip'],
  position: Vector2,
  zLevelGen: Const<ZLevelGen> | undefined,
  selectedPointNode: PointNodeRef | undefined,
  allocatedPointNodeSubset: Const<HashSet<PointNodeRef>>,
}

type State = {}

class ZLevelComponent2 extends LifecycleHandlerBase<Props, State> {
  public container: Pixi.Container;
  public state: State;

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

  protected updateChildren(props: Props) {
    this.upsertChildren(props);
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
        tooltipUpdaters: props.tooltipUpdaters,
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
export { wrapped as ZLevelComponent };
export type { Props as ZLevelComponentProps };