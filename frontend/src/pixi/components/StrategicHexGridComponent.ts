import * as Pixi from 'pixi.js';
import { GameState } from '../../data/GameState';
import {
  LockStatus,
  NodeReachableStatus,
  NodeTakenStatus,
  NodeVisibleStatus,
} from '../../data/NodeStatus';
import { Attribute } from '../../game/worldGen/nodeContents/NodeContentsFactory';
import { PixiPointFrom } from '../../lib/pixi/pixify';
import { KeyedHashMap } from '../../lib/util/data_structures/hash';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { Const, extractDeps, extractAccessPaths } from '../../lib/util/misc';
import COLORS from '../colors';
import { engageLifecycle, LifecycleHandlerBase } from './LifecycleHandler';

type Props = {
  delta: number;
  args: {
    position: Vector2;
    textures: {
      circle: Pixi.Texture;
      rect: Pixi.Texture;
      square: Pixi.Texture;
    };
  };
  appSize: Vector2;
  gameState: StrategicHexGridSubState;
};

/**
 * The subset of the game state that is relevant to game area components.
 */
export function extractStrategicHexGridSubState(gameState: Const<GameState>) {
  return {
    playerUI: {
      virtualGridLocation: gameState.playerUI.virtualGridLocation,
      cursoredNodeLocation: gameState.playerUI.cursoredNodeLocation,
    },
    playerSave: {
      allocationStatusMap: gameState.playerSave.allocationStatusMap,
    },
    computed: {
      fogOfWarStatusMap: gameState.computed.fogOfWarStatusMap,
      reachableStatusMap: gameState.computed.reachableStatusMap,
      lockStatusMap: gameState.computed.lockStatusMap,
    },
    worldGen: {
      nodeContentsMap: gameState.worldGen.nodeContentsMap,
      lockMap: gameState.worldGen.lockMap,
    },
  };
}
export type StrategicHexGridSubState = ReturnType<
  typeof extractStrategicHexGridSubState
>;
export const depsStrategicHexGridSubState = extractDeps(
  extractStrategicHexGridSubState
);

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

  protected updateSelf(props: Props) {
    const { delta } = props;
    for (let [v, graphics] of this.hexGrid.entries()) {
      // graphics.tint
    }
  }

  protected renderSelf(props: Props) {
    this.container.position = PixiPointFrom(props.args.position);
    this.graphics.position = PixiPointFrom(props.appSize.divide(2));
    const { gameState } = props;

    for (let [v, graphics] of this.hexGrid.entries()) {
      const basePosition = props.appSize
        .divide(2)
        .add(new Vector2(30 * v.x - 15 * v.y, -26 * v.y)); // 30 x 26 hex units
      graphics.position = PixiPointFrom(basePosition);
      // if (v.x <= 1 && v.x >= -1 && v.y <= 1 && v.y >= -1) {

      // } else {
      //   continue;
      // }
      // props.allocationStatusMap.get(props.virtualGridLocation.add(Vector3.FromVector2(v)))
      const virtualLocation = gameState.playerUI.virtualGridLocation.add(
        Vector3.FromVector2(v)
      );
      const nodeVisibleStatus =
        gameState.computed.fogOfWarStatusMap?.get(virtualLocation) ||
        NodeVisibleStatus.false;
      const nodeTakenStatus =
        gameState.playerSave.allocationStatusMap.get(virtualLocation) ||
        NodeTakenStatus.false;
      const nodeReachableStatus =
        gameState.computed.reachableStatusMap?.get(virtualLocation) ||
        NodeReachableStatus.false;
      const lockData = gameState.worldGen.lockMap.get(virtualLocation);
      const lockStatus = gameState.computed.lockStatusMap?.get(virtualLocation);

      if (nodeTakenStatus.taken) {
        graphics.visible = true;
        graphics.tint = COLORS.borderBlack;
      } else if (nodeReachableStatus.reachable) {
        // only recolor if it is not locked
        if (!lockData || lockStatus === LockStatus.OPEN) {
          graphics.visible = true;
          graphics.tint = COLORS.nodeLavender;
        } else {
          // use the ordinary visible-but-unreachable coloring
          graphics.visible = true;
          graphics.tint = COLORS.nodePink;
        }
      } else if (nodeVisibleStatus.visible) {
        graphics.visible = true;
        graphics.tint = COLORS.nodePink;
      } else {
        // hidden
        graphics.visible = false;
      }

      // graphics.anchor = PixiPointFrom(Vector2.Zero);
      // graphics.pivot = PixiPointFrom(Vector2.Zero);
      if (lockData && lockStatus !== LockStatus.OPEN) {
        graphics.texture = props.args.textures.rect;
        graphics.position = PixiPointFrom(basePosition);
        graphics.position.x -= props.args.textures.rect.width / 2;
        graphics.position.y -= props.args.textures.rect.height / 2;
        // graphics.tint = COLORS.borderBlack;
      } else {
        graphics.texture = props.args.textures.circle;
        graphics.position = PixiPointFrom(basePosition);
        graphics.position.x -= props.args.textures.circle.width / 2;
        graphics.position.y -= props.args.textures.circle.height / 2;
      }

      const nodeContents = gameState.worldGen.nodeContentsMap.get(
        virtualLocation
      );
      if (
        nodeContents.lines?.[0]?.attribute === Attribute.RED0 ||
        nodeContents.lines?.[1]?.attribute === Attribute.RED0
      ) {
        // graphics.texture = props.args.textures.square;
        // graphics.position = PixiPointFrom(basePosition);
        // graphics.position.x -= props.args.textures.square.width / 2;
        // graphics.position.y -= props.args.textures.square.height / 2;
        // graphics.tint = COLORS.nodeBlue;
      }
    }
  }

  /**
   * @param staleProps
   * @param staleState
   * @param props
   * @param state
   * @returns false if staleProps == nextProps and staleState == state (which will cause the component to be memoized)
   *          true if the props or state differ anywhere
   */
  protected shouldUpdate(
    staleProps: Props,
    staleState: State,
    props: Props,
    state: State
  ): boolean {
    for (let key of Object.keys(staleProps) as (keyof Props)[]) {
      // if (key === 'delta' || key === 'args' || key === 'updaters') {
      if (key === 'args' || key === 'delta') {
        continue;
      }
      if (key === 'gameState') {
        const staleGameState = staleProps[key];
        const gameState = props[key];
        const staleDeps = depsStrategicHexGridSubState(staleGameState);
        const deps = depsStrategicHexGridSubState(gameState);
        for (let i = 0; i < staleDeps.length; i++) {
          if (deps[i] !== staleDeps[i]) {
            console.log(
              `hexgrid substate differed in ${i} : ${extractAccessPaths(
                extractStrategicHexGridSubState
              )[i].join('.')}, returning true for shouldupdate`
            );
            return true;
          }
        }
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
