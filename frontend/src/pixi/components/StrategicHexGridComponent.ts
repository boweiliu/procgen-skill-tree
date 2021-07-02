import * as Pixi from 'pixi.js';
import chroma from 'chroma-js';
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
  nodeContentsToColor,
} from '../../game/worldGen/nodeContents/NodeContentsRendering';
import { PixiPointFrom } from '../../lib/pixi/pixify';
import { KeyedHashMap } from '../../lib/util/data_structures/hash';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { Const, extractDeps, extractAccessPaths } from '../../lib/util/misc';
import { interpolateColor } from '../../lib/util/color';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import COLORS from '../colors';
import { SimpleTextureSet, UiScale } from '../textures/SimpleTextures';
import { engageLifecycle, LifecycleHandlerBase } from './LifecycleHandler';
import { PIXI_TICKS_PER_SECOND } from '../PixiReactBridge';
import { uiScaleFromAppSize } from '../../components/GameArea/GameAreaInterface';
import { Lazy } from '../../lib/util/lazy';

type Props = {
  delta: number;
  args: {
    position: Vector2;
    textures: Const<Lazy<SimpleTextureSet>>;
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

type State = {
  phases: { [x: number]: number };
};

type HexGridAnimation = {
  max: number;
  min: number;
  periodSecs: number;
  mode: 'start-max ease-in-out' | 'start-max ease-in';
  phase: number;
};

type HexGridData = {
  animation: HexGridAnimation | null;
  cursorAnimation: HexGridAnimation | null;
  node: Pixi.Sprite;
  cursor: Pixi.Sprite | null;
};

// sqrt(3)/2 approximation - see hexGridPx
function strategicHexGridPxFromUiScale(pixiUiScale: UiScale) {
  return pixiUiScale === 'x-small'
    ? new Vector2(15, 13)
    : pixiUiScale === 'small'
    ? new Vector2(22, 19)
    : pixiUiScale === 'medium' || pixiUiScale === 'large'
    ? new Vector2(30, 26)
    : new Vector2(45, 39);
}

// TODO(bowei): compute this to be big enough
// const strategicHexGridDims = new Vector2(35, 20);
// const strategicHexGridDims = new Vector2(6, 12);
const strategicHexGridDims = new Vector2(48, 24);

class StrategicHexGridComponent extends LifecycleHandlerBase<Props, State> {
  public container: Pixi.Container;
  public state: Const<State>;
  // private graphics: Pixi.Sprite;
  private hexGrid: KeyedHashMap<Vector2, HexGridData> = new KeyedHashMap();

  constructor(props: Props) {
    super(props);
    this.state = this.useState(this, {
      phases: {},
    }).state;
    this.updateSelf(props);
    this.container = new Pixi.Container();

    // test graphics
    // this.graphics = new Pixi.Sprite();
    // this.graphics.texture = props.args.textures.circle;
    // this.graphics.tint = COLORS.borderBlack;
    // this.graphics.visible = false;
    // this.container.addChild(this.graphics);

    // sqrt(3)/2 approximation - see hexGridPx
    const strategicHexGridPx = strategicHexGridPxFromUiScale(
      uiScaleFromAppSize(props.appSize)
    );

    // populate a grid
    // TODO(bowei): unhardcode
    for (let j = -strategicHexGridDims.y; j <= strategicHexGridDims.y; j++) {
      for (
        let i = -strategicHexGridDims.x + Math.floor(j / 2);
        i <= strategicHexGridDims.x + Math.floor(j / 2);
        i++
      ) {
        const graphics = new Pixi.Sprite();
        // graphics.texture = props.args.textures.get().circle;
        graphics.tint = COLORS.nodePink;
        // graphics.visible = false;
        // if ((i == 0 && j == 0) || (i == 5 && j == 5)) {
        //   // graphics.visible = true;
        //   graphics.tint = COLORS.borderBlack;
        // }
        graphics.position = PixiPointFrom(
          props.appSize
            .divide(2)
            .add(
              new Vector2(
                strategicHexGridPx.x * i - (strategicHexGridPx.x / 2) * j,
                -strategicHexGridPx.y * j
              )
            )
        );
        this.container.addChild(graphics);
        this.hexGrid.put(new Vector2(i, j), {
          node: graphics,
          animation: null,
          cursor: null,
          cursorAnimation: null,
        });
      }
    }
  }

  /**
   * Progress animation state (which needs to happen even if non-delta props do not change)
   * @param props
   */
  protected updateSelf(props: Props) {
    // const { delta } = props;
    const delta = 1; // ignore lags and freezes because color is not required to be continuous

    if (
      props.gameState.playerUI.strategicSearch !==
      this._staleProps.gameState.playerUI.strategicSearch
    ) {
      // reset phases
      this.stateUpdaters!.phases.enqueueUpdate((prev) => {
        const result = { ...prev };
        for (let keyString of Object.keys(result)) {
          let keyNumber = parseInt(keyString);
          result[keyNumber] = 0;
        }
        return result;
      });
    }

    for (let data of this.hexGrid.values()) {
      const { node: graphics, animation } = data;
      if (animation) {
        // the last frame was rendered at this phase in the animation
        let phase =
          this.state.phases[animation.periodSecs] || animation.phase || 0;

        // increment it. phase of 1 == a full period == animation.period secs
        let newPhase =
          (phase +
            (delta * (1 / PIXI_TICKS_PER_SECOND) * 1) / animation.periodSecs) %
          1;

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

        // update it in state
        this.stateUpdaters!.phases.enqueueUpdate((prev) => {
          const result = { ...prev };
          result[animation.periodSecs] = newPhase;
          return result;
        });
      }

      if (data.cursor && data.cursorAnimation) {
        let animation = data.cursorAnimation;

        // the last frame was rendered at this phase in the animation
        let phase = animation.phase || 0;

        // increment it. phase of 1 == a full period == animation.period secs
        let newPhase =
          (phase +
            (delta * (1 / PIXI_TICKS_PER_SECOND) * 1) / animation.periodSecs) %
          1;

        // animation starts with bezierX == 0, goes up to 1, then back down
        let bezierX = 1 - Math.abs(newPhase * 2 - 1);
        /* NOTE(bowei): specifically ease-in-out. we want to draw attention both to the lit-up state and to the base state. */
        // ease-in
        // let bezierY = ( bezierX * bezierX); // we use the shitty approximation cubicBezier(0.42,0,1,1) == x ** 2.
        // let bezierY = (bezierX * bezierX) * (1.5 - 0.5 * bezierX); // adjustment to decrease the slope at x=1 from 2 to 1.5
        // ease-in-out
        let bezierY = bezierX * bezierX;

        // calculate the proper tint now
        let tintProp = 1 - bezierY; // animation should start with tint == 1, go back down to 0, go back up

        // set the tint
        data.cursor.tint = interpolateColor({
          target: animation.max,
          base: animation.min,
          proportion: tintProp,
        });

        // update phase on animation object
        animation.phase = newPhase;
      }
    }
  }

  protected renderSelf(props: Props) {
    const { gameState } = props;
    this.container.position = PixiPointFrom(props.args.position);
    // this.graphics.position = PixiPointFrom(props.appSize.divide(2));

    // sqrt(3)/2 approximation - see hexGridPx
    const strategicHexGridPx = strategicHexGridPxFromUiScale(
      uiScaleFromAppSize(props.appSize)
    );

    for (let [v, data] of this.hexGrid.entries()) {
      const { node: graphics } = data;

      const basePosition = props.appSize
        .divide(2)
        .add(
          new Vector2(
            strategicHexGridPx.x * v.x - (strategicHexGridPx.x / 2) * v.y,
            -strategicHexGridPx.y * v.y
          )
        );
      // graphics.position = PixiPointFrom(basePosition);
      let baseTint: number = 0x000000;

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

      let visible: boolean = true;
      if (nodeTakenStatus.taken) {
        graphics.visible = true;
        baseTint = COLORS.borderBlack;
        // graphics.tint = COLORS.borderBlack;
      } else if (nodeReachableStatus.reachable) {
        // only recolor if it is not locked
        if (!lockData || lockStatus === LockStatus.OPEN) {
          graphics.visible = true;
          baseTint = COLORS.nodeLavender;
          // graphics.tint = COLORS.nodeLavender;
        } else {
          // use the ordinary visible-but-unreachable coloring
          graphics.visible = true;
          baseTint = COLORS.nodePink;
          // graphics.tint = COLORS.nodePink;
        }
      } else if (nodeVisibleStatus.visible) {
        graphics.visible = true;
        baseTint = COLORS.nodePink;
        // graphics.tint = COLORS.nodePink;
      } else {
        // hidden
        graphics.visible = true;
        visible = false;
        baseTint = COLORS.nodePink;
      }

      // add onclick so that clicking on the node causes selected node tab to update
      if (graphics.visible) {
        graphics.interactive = true;
        graphics.buttonMode = true;
        graphics.removeAllListeners(); // NOTE(bowei): there's a double render which would otherwise attach 2 event handlers.
        graphics.on('pointerdown', () => {
          console.log('pointerdown in strategic hex grid pixi', {
            nodeLocation,
          });
          props.updaters.playerUI.cursoredNodeLocation.enqueueUpdate((prev) => {
            console.log('enqueue update in pointerdown in strategic hex grid', {
              prev,
              nodeLocation,
            });
            if (prev && prev.equals(nodeLocation)) {
              return null;
            }
            return nodeLocation;
          });
        });
      } else {
        graphics.interactive = false;
        graphics.buttonMode = false;
      }

      // graphics.anchor = PixiPointFrom(Vector2.Zero);
      // graphics.pivot = PixiPointFrom(Vector2.Zero);
      const textures = props.args.textures.get();
      if (!nodeVisibleStatus.visible) {
        graphics.texture = textures.dot;
        graphics.position = PixiPointFrom(basePosition);
        graphics.position.x -= textures.dot.width / 2;
        graphics.position.y -= textures.dot.height / 2;
      } else if (lockData && lockStatus !== LockStatus.OPEN) {
        graphics.texture = textures.rect;
        graphics.position = PixiPointFrom(basePosition);
        graphics.position.x -= textures.rect.width / 2;
        graphics.position.y -= textures.rect.height / 2;
        // graphics.tint = COLORS.borderBlack;
      } else {
        graphics.texture = textures.circle;
        graphics.position = PixiPointFrom(basePosition);
        graphics.position.x -= textures.circle.width / 2;
        graphics.position.y -= textures.circle.height / 2;
      }

      const nodeContents = gameState.worldGen.nodeContentsMap.get(nodeLocation);

      // give color (hue, saturation) to the node according to its contents, but keep the value (grayness) from tint
      if (visible) {
        if (
          gameState.playerUI.strategicSearch.colors.enabled === 'Yes' ||
          (gameState.playerUI.strategicSearch.colors.enabled ===
            'Only unallocated' &&
            !nodeTakenStatus.taken)
        ) {
          const nodeContentsLch = chroma(
            nodeContentsToColor(nodeContents)
          ).lch();
          const originalLch = chroma(baseTint).lch();
          baseTint = chroma
            .lch(
              originalLch[0],
              // nodeContentsLch[1],
              0.5 * (originalLch[1] + nodeContentsLch[1]),
              nodeContentsLch[2]
            )
            .num();
        }
      }

      const matched = matchStrategicSearch({
        nodeContents,
        query: gameState.playerUI.strategicSearch,
      });

      // If was selected by the highlight search, make it shiny
      if (matched && visible) {
        const animation: HexGridAnimation = {
          // max: addColor(COLORS.nodeBlue, graphics.tint),
          max: interpolateColor({
            color: baseTint,
            opacity: 0.75,
            background: COLORS.white,
          }),
          // max: graphics.tint === COLORS.borderBlack ? COLORS.nodeLavender : COLORS.nodeBlue,
          // max: COLORS.nodeBlue,
          // max: graphics.tint,
          min: baseTint,
          periodSecs: 2,
          mode: 'start-max ease-in-out',
          phase: data.animation ? data.animation.phase : 0,
        };
        // TODO(bowei): properly encapsulate this in like a useEffect/useMemo to detect changes and only trigger in that case
        // if (gameState.playerUI.strategicSearch === this._staleProps.gameState.playerUI.strategicSearch) {
        //   animation.phase = 0;
        // }
        data.animation = animation;
      } else {
        graphics.tint = baseTint;
        data.animation = null;
      }

      // put a cursor near the node if it has been selected
      if (props.gameState.playerUI.cursoredNodeLocation?.equals(nodeLocation)) {
        if (!data.cursor) {
          const cursor = new Pixi.Sprite();
          cursor.texture = textures.verticalLine;
          // cursor.tint = graphics.tint;
          // cursor.tint = addColor(COLORS.nodeBlue, graphics.tint);
          cursor.tint = COLORS.borderWhite;
          this.container.addChild(cursor);
          data.cursor = cursor;

          data.cursorAnimation = {
            max: COLORS.borderWhite,
            min: interpolateColor({
              color: COLORS.borderWhite,
              opacity: 0.25,
              background: COLORS.backgroundBlue,
            }),
            periodSecs: 1,
            mode: 'start-max ease-in',
            phase: 0,
          };
        }
      } else {
        if (data.cursor) {
          this.container.removeChild(data.cursor);
        }
        data.cursor = null;
      }
      if (data.cursor) {
        data.cursor.position = PixiPointFrom(basePosition);
        // data.cursor.position.x -= props.args.textures.verticalLine.width / 2;
        data.cursor.position.x -= strategicHexGridPx.x / 2; // - props.args.textures.verticalLine.width / 3;
        data.cursor.position.x += textures.verticalLine.width / 3;
        // data.cursor.position.x += props.args.textures.verticalLine.width / 2;
        // data.cursor.position.x += props.args.textures.circle.width / 2;
        data.cursor.position.y -= textures.verticalLine.height / 2;
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
    staleState: Const<State>,
    props: Props,
    state: Const<State>
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
    // for (let key of Object.keys(staleState) as (keyof State)[]) {
    //   // check if state changed...?
    // }
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
  // console.log({ terms });
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
