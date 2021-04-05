import * as Pixi from 'pixi.js';
import { HashSet, KeyedHashMap } from '../../lib/util/data_structures/hash';
import {
  ChunkGen,
  ChunkGenConstants,
  ChunkRef,
  GameState,
  PointNodeRef,
} from '../../data/GameState';
import {
  PointNodeComponent,
  PointNodeComponentProps,
} from './PointNodeComponent';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { PixiPointFrom } from '../../lib/pixi/pixify';
import { engageLifecycle, LifecycleHandlerBase } from './LifecycleHandler';
import { RootComponentState } from './RootComponent';
import { PointNodeTextureSet } from '../textures/PointNodeTexture';

export class RenderedChunkConstants {
  //   public static SPACING_PX: number = 24;
  //   public static CHUNK_SPACING_PX: number = (ChunkGenConstants.CHUNK_DIM + 0.5) * RenderedChunkConstants.SPACING_PX;
  //   public static NODE_SIZE_PX: number = 14;
  //   public static NODE_HITAREA_PX: number = 18;
  public static SPACING_PX: number = 36;
  public static CHUNK_SPACING_PX: number =
    (ChunkGenConstants.CHUNK_DIM + 0.0) * RenderedChunkConstants.SPACING_PX;
  public static NODE_SIZE_PX: number = 22;
  public static NODE_HITAREA_PX: number =
    RenderedChunkConstants.NODE_SIZE_PX + 4;
  public static NODE_ROUNDED_PX: number = 4;
}

type Props = {
  delta: number;
  args: {
    pointNodeTexture: PointNodeTextureSet;
    markForceUpdate: (childInstance: any) => void;
  };
  selfChunkRef: ChunkRef;
  updaters: UpdaterGeneratorType2<GameState>;
  tooltipUpdaters: UpdaterGeneratorType2<RootComponentState>['tooltip'];
  position: Vector2;
  chunkGen: ChunkGen;
  selectedPointNode: PointNodeRef | undefined;
  allocatedPointNodeSubset: HashSet<PointNodeRef>;
};

type State = {};

class ChunkComponent2 extends LifecycleHandlerBase<Props, State> {
  public container: Pixi.Container;
  public state: State;

  public children: KeyedHashMap<PointNodeRef, PointNodeComponent>;

  constructor(props: Props) {
    super(props);

    this.state = {};
    this.container = new Pixi.Container();
    this.children = new KeyedHashMap();

    this.resyncChildren(props);
  }

  protected renderSelf(props: Props) {
    this.container.position = PixiPointFrom(props.position);
  }

  protected shouldUpdate(
    prevProps: Props,
    prevState: State,
    props: Props,
    state: State
  ): boolean {
    // return true;
    for (let key of Object.keys(prevProps) as (keyof Props)[]) {
      if (key === 'delta' || key === 'args' || key === 'updaters') {
        continue;
      }
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

  private resyncChildren(props: Props) {
    let childrenToDelete = this.children.clone(); // track which children need to be destroyed according to new props
    console.log(`chunk component upsert children got here`);
    // console.log(`chunk component upsert children has ${this.children.size()} children`);

    for (let [
      pointNodeCoord,
      pointNodeGen,
    ] of props.chunkGen.pointNodes.entries()) {
      const pointNodeRef = new PointNodeRef({
        z: props.selfChunkRef.z,
        chunkCoord: props.selfChunkRef.chunkCoord,
        pointNodeCoord: pointNodeCoord,
        pointNodeId: pointNodeGen.id,
      });
      let childPropsFactory = (
        props: Props,
        state: State
      ): PointNodeComponentProps => {
        return {
          delta: props.delta,
          args: {
            pointNodeTexture: props.args.pointNodeTexture,
            markForceUpdate: this.markForceUpdate,
            position: pointNodeRef.pointNodeCoord.multiply(
              RenderedChunkConstants.SPACING_PX
            ),
          },
          selfPointNodeRef: pointNodeRef,
          updaters: props.updaters,
          tooltipUpdaters: props.tooltipUpdaters,
          pointNodeGen,
          isSelected:
            props.selectedPointNode?.pointNodeId === pointNodeRef.pointNodeId,
          isAllocated: props.allocatedPointNodeSubset.contains(pointNodeRef),
        };
      };
      const childKey = pointNodeRef;

      let childComponent = this.children.get(childKey);
      if (childComponent) {
        // childComponent.update(childPropsFactory(props, this.state));
        childrenToDelete.remove(childKey);
      } else {
        childComponent = new PointNodeComponent(
          childPropsFactory(props, this.state)
        );
        this.children.put(pointNodeRef, childComponent);
        // this.container.addChild(childComponent.container);
        this.addChild({
          childClass: PointNodeComponent,
          instance: childComponent,
          propsFactory: childPropsFactory,
        });
      }
    }
    console.log(
      `chunk component to delete has ${childrenToDelete.size()} children`
    );
    for (let [childKey, childComponent] of childrenToDelete.entries()) {
      // childComponent.willUnmount();
      this.children.remove(childKey);
      // this.container.removeChild(childComponent.container);
      this.removeChild(childComponent);
    }
  }

  protected updateChildren(props: Props) {
    this.resyncChildren(props);
  }

  protected didForceUpdateChild(instance: LifecycleHandlerBase<any, any>) {
    // IMPORTANT! this is intended to raise the child that asked for a force update to the top so it isn't covered
    // by other sibling pixi containers. however this code doesnt work well during the update call, for some reason (not sure why)
    this.container.removeChild(instance.container);
    this.container.addChild(instance.container);
  }
}

const wrapped = engageLifecycle(ChunkComponent2);
// eslint-disable-next-line
type wrapped = ChunkComponent2;
export { wrapped as ChunkComponent };
export type { Props as ChunkComponentProps };
