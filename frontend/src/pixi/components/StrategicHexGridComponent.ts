import * as Pixi from 'pixi.js';
import {
  LockStatus,
  NodeAllocatedStatus,
} from '../../components/GameArea/GameAreaGrid';
import { LockData } from '../../data/PlayerSaveState';
import { PixiPointFrom } from '../../lib/pixi/pixify';
import { HashMap, KeyedHashMap } from '../../lib/util/data_structures/hash';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { LazyHashMap } from '../../lib/util/lazy';
import { Const } from '../../lib/util/misc';
import COLORS from '../colors';
import { engageLifecycle, LifecycleHandlerBase } from './LifecycleHandler';

type Props = {
  args: {
    position: Vector2;
    textures: {
      circle: Pixi.Texture;
      rect: Pixi.Texture;
      square: Pixi.Texture;
    };
  };
  appSize: Vector2;
  virtualGridLocation: Const<Vector3>;
  allocationStatusMap: Const<KeyedHashMap<Vector3, NodeAllocatedStatus>>;
  fogOfWarStatusMap: Const<HashMap<Vector3, NodeAllocatedStatus>>;
  lockStatusMap: Const<HashMap<Vector3, LockStatus | undefined>>;
  lockMap: Const<LazyHashMap<Vector3, LockData | undefined>>;
};

type State = {};

class StrategicHexGridComponent extends LifecycleHandlerBase<Props, State> {
  public container: Pixi.Container;
  public state: State;
  private graphics: Pixi.Sprite;
  private hexGrid: KeyedHashMap<Vector2, Pixi.Sprite> = new KeyedHashMap();

  constructor(props: Props) {
    super(props);
    this.state = {
      numClicks: 0,
      descriptionText: '',
    };
    this.updateSelf(props);
    this.container = new Pixi.Container();

    // test graphics
    this.graphics = new Pixi.Sprite();
    this.graphics.texture = props.args.textures.circle;
    this.graphics.tint = COLORS.borderBlack;
    this.graphics.visible = false;
    this.container.addChild(this.graphics);

    // populate a grid
    // TODO(bowei): unhardcode
    for (let j = -20; j <= 20; j++) {
      for (let i = -35 + Math.floor(j / 2); i <= 35 + Math.floor(j / 2); i++) {
        const graphics = new Pixi.Sprite();
        graphics.texture = props.args.textures.circle;
        graphics.tint = COLORS.nodePink;
        // graphics.visible = false;
        // if ((i == 0 && j == 0) || (i == 5 && j == 5)) {
        //   // graphics.visible = true;
        //   graphics.tint = COLORS.borderBlack;
        // }
        graphics.position = PixiPointFrom(
          props.appSize.divide(2).add(new Vector2(30 * i - 15 * j, -26 * j))
        );
        this.container.addChild(graphics);
        this.hexGrid.put(new Vector2(i, j), graphics);
      }
    }
  }

  protected updateSelf(props: Props) {}

  protected renderSelf(props: Props) {
    this.container.position = PixiPointFrom(props.args.position);
    this.graphics.position = PixiPointFrom(props.appSize.divide(2));

    for (let [v, graphics] of this.hexGrid.entries()) {
      graphics.position = PixiPointFrom(
        props.appSize.divide(2).add(new Vector2(30 * v.x - 15 * v.y, -26 * v.y))
      );
      // if (v.x <= 1 && v.x >= -1 && v.y <= 1 && v.y >= -1) {

      // } else {
      //   continue;
      // }
      // props.allocationStatusMap.get(props.virtualGridLocation.add(Vector3.FromVector2(v)))
      const virtualLocation = props.virtualGridLocation.add(
        Vector3.FromVector2(v)
      );
      const nodeVisibleStatus =
        props.fogOfWarStatusMap.get(virtualLocation) ||
        NodeAllocatedStatus.HIDDEN;
      const nodeAllocatedStatus =
        props.allocationStatusMap.get(virtualLocation) ||
        NodeAllocatedStatus.HIDDEN;
      const lockData = props.lockMap.get(virtualLocation);
      const lockStatus = props.lockStatusMap.get(virtualLocation);

      if (nodeVisibleStatus === NodeAllocatedStatus.HIDDEN) {
        graphics.visible = false;
      } else if (nodeAllocatedStatus === NodeAllocatedStatus.TAKEN) {
        graphics.visible = true;
        graphics.tint = COLORS.borderBlack;
      } else if (
        nodeVisibleStatus === NodeAllocatedStatus.AVAILABLE ||
        nodeVisibleStatus === NodeAllocatedStatus.UNREACHABLE
      ) {
        graphics.visible = true;
        graphics.tint = COLORS.nodePink;
      }

      // graphics.anchor = PixiPointFrom(Vector2.Zero);
      // graphics.pivot = PixiPointFrom(Vector2.Zero);
      if (lockData) {
        graphics.texture = props.args.textures.rect;
        graphics.position.x -= props.args.textures.rect.width / 2;
        graphics.position.y -= props.args.textures.rect.height / 2;
        // graphics.tint = COLORS.borderBlack;
      } else {
        graphics.texture = props.args.textures.circle;
        graphics.position.x -= props.args.textures.circle.width / 2;
        graphics.position.y -= props.args.textures.circle.height / 2;
      }
    }
  }

  protected shouldUpdate(
    staleProps: Props,
    staleState: State,
    props: Props,
    state: State
  ): boolean {
    for (let key of Object.keys(staleProps) as (keyof Props)[]) {
      // if (key === 'delta' || key === 'args' || key === 'updaters') {
      if (key === 'args') {
        continue;
      }
      if (staleProps[key] !== props[key]) {
        console.log(`hexgrid shouldUpdate differed in ${key}, returning true`);
        return true;
      }
    }
    return false;
  }
}

const wrapped = engageLifecycle(StrategicHexGridComponent);
// eslint-disable-next-line
type wrapped = StrategicHexGridComponent;
export { wrapped as StrategicHexGridComponent };
export type { Props as StrategicHexGridComponentProps };
