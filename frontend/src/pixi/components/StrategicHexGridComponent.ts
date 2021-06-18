import * as Pixi from 'pixi.js';
import { GameState } from '../../data/GameState';
import {
  LockStatus,
  NodeReachableStatus,
  NodeTakenStatus,
  NodeVisibleStatus,
} from '../../data/NodeStatus';
import { StrategicSearchState } from '../../data/PlayerUIState';
import { NodeContents } from '../../game/worldGen/nodeContents/NodeContentsFactory';
import {
  AttributeDescriptionReverseMap,
  ModifierDescriptionReverseMap,
} from '../../game/worldGen/nodeContents/NodeContentsRendering';
import { PixiPointFrom } from '../../lib/pixi/pixify';
import { KeyedHashMap } from '../../lib/util/data_structures/hash';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import {
  Const,
  extractDeps,
  extractAccessPaths,
  interpolateColor,
  addColor,
} from '../../lib/util/misc';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
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
  updaters: UpdaterGeneratorType2<GameState, GameState>;
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
      strategicSearch: gameState.playerUI.strategicSearch,
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
  private animations: KeyedHashMap<Vector2, any> = new KeyedHashMap();

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
      const animation = this.animations.get(v);
      if (!animation) continue;

      // the last frame was rendered at this phase in the animation
      let phase = animation.phase || 0;

      // increment it. phase of 1 == a full period == animation.period secs
      let newPhase =
        (phase + (delta * (1 / 60) * 1) / animation.periodSecs) % 1;

      // animation starts with bezierX == 0, goes up to 1, then back down
      let bezierX = 1 - Math.abs(newPhase * 2 - 1);
      /* NOTE(bowei): specifically ease-in-out. we want to draw attention both to the lit-up state and to the base state. */
      // ease-in
      // let bezierY = ( bezierX * bezierX); // we use the shitty approximation cubicBezier(0.42,0,1,1) == x ** 2.
      // let bezierY = (bezierX * bezierX) * (1.5 - 0.5 * bezierX); // adjustment to decrease the slope at x=1 from 2 to 1.5
      // ease-in-out
      let bezierY =
        bezierX < 0.5
          ? 2 * (bezierX * bezierX)
          : 1 - 2 * (1 - bezierX) * (1 - bezierX);

      // calculate the proper tint now
      let tintProp = 1 - bezierY; // animation should start with tint == 1, go back down to 0, go back up

      // set the tint
      // tintProp = tintProp * .75 + 0.25; // minimum opacity = 0.25
      graphics.tint = interpolateColor({
        target: animation.max,
        base: animation.min,
        proportion: tintProp,
      });
      // console.log({ delta, phase, newPhase, bezierX, tintProp, tint: graphics.tint });

      // update phase on animation object
      animation.phase = newPhase;
      // animation
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
      const nodeLocation = gameState.playerUI.virtualGridLocation.add(
        Vector3.FromVector2(v)
      );
      const nodeVisibleStatus =
        gameState.computed.fogOfWarStatusMap?.get(nodeLocation) ||
        NodeVisibleStatus.false;
      const nodeTakenStatus =
        gameState.playerSave.allocationStatusMap.get(nodeLocation) ||
        NodeTakenStatus.false;
      const nodeReachableStatus =
        gameState.computed.reachableStatusMap?.get(nodeLocation) ||
        NodeReachableStatus.false;
      const lockData = gameState.worldGen.lockMap.get(nodeLocation);
      const lockStatus = gameState.computed.lockStatusMap?.get(nodeLocation);

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

      if (graphics.visible) {
        graphics.interactive = true;
        graphics.buttonMode = true;
        graphics.on('pointerdown', () => {
          props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate((prev) => {
            return nodeLocation;
          });
        });
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

      const nodeContents = gameState.worldGen.nodeContentsMap.get(nodeLocation);

      const matched = matchStrategicSearch({
        nodeContents,
        query: gameState.playerUI.strategicSearch,
      });

      if (matched) {
        // graphics.texture = props.args.textures.square;
        // graphics.position = PixiPointFrom(basePosition);
        // graphics.position.x -= props.args.textures.square.width / 2;
        // graphics.position.y -= props.args.textures.square.height / 2;
        // graphics.tint = COLORS.nodeBlue;
        this.animations.put(v, {
          max: addColor(COLORS.nodeBlue, graphics.tint),
          // max: graphics.tint === COLORS.borderBlack ? COLORS.nodeLavender : COLORS.nodeBlue,
          // max: COLORS.nodeBlue,
          // max: graphics.tint,
          min: graphics.tint,
          periodSecs: 2,
          mode: 'start-min ease-in-out',
          phase: 0,
        });
      } else {
        this.animations.put(v, null);
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
      if (key === 'delta' || key === 'args' || key === 'updaters') {
        // if (key === 'args' || key === 'delta') {
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

export function matchStrategicSearch(args: {
  nodeContents: NodeContents;
  query: StrategicSearchState;
}): boolean {
  const { nodeContents, query } = args;

  // missing query! return no matches
  if (!query) {
    return false;
  }

  // first separate out the terms
  const highlight1 = query.highlight1.value;
  const terms = highlight1
    .split(' ')
    .filter((it) => !!it)
    .map((wrappedTerm) => wrappedTerm.slice(1, wrappedTerm.length - 1));

  // missing query! return no matches
  if (terms.length === 0) {
    return false;
  }

  // for ALL of the terms, make sure node contents matches
  let unmatchedTerm: string | null = null;
  console.log({ terms });
  for (let term of terms) {
    // is the term a attribute or modifier?
    const maybeAttribute = AttributeDescriptionReverseMap[term];
    const maybeModifier = ModifierDescriptionReverseMap[term];
    if (!!maybeAttribute) {
      if (
        nodeContents.lines?.[0]?.attribute === maybeAttribute ||
        nodeContents.lines?.[1]?.attribute === maybeAttribute
      ) {
        // console.log("matched by attribute" , maybeAttribute);
      } else {
        unmatchedTerm = maybeAttribute;
        break;
      }
    } else if (!!maybeModifier) {
      if (
        nodeContents.lines?.[0]?.modifier === maybeModifier ||
        nodeContents.lines?.[1]?.modifier === maybeModifier
      ) {
        // console.log("matched by modifier" , maybeModifier);
      } else {
        unmatchedTerm = maybeModifier;
        break;
      }
    } else if (term === '*') {
      if (
        nodeContents.lines?.[0]?.attribute ||
        nodeContents.lines?.[1]?.attribute
      ) {
        // console.log("matched by wild card attribute");
      } else {
        unmatchedTerm = term;
        break;
      }
    } else {
      console.error('unparsed term: ', term);
      return false;
    }
  }
  if (unmatchedTerm) {
    return false; // match failed
  }
  return true;
}
