import * as Pixi from "pixi.js";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { ChunkGenConstants, GameState, IntentName} from "../../data/GameState";
import { generatePointNodeTexture, PointNodeTextureSet } from "../textures/PointNodeTexture";
import { ZLevelGenFactory } from "../../game/WorldGenStateFactory";
import { Const, Lazy } from "../../lib/util/misc";
import { UpdaterGeneratorType2 } from "../../lib/util/updaterGenerator";
import { ZLevelComponent, ZLevelComponentProps } from "./ZLevelComponent";
import { engageLifecycle, LifecycleHandlerBase } from "./LifecycleHandler";
import { FixedCameraStageComponent } from "./FixedCameraStageComponent";
import { TooltipInfo } from "./TooltipComponent";
import COLORS from "../colors";

type State = {
  pointNodeTexture: Lazy<PointNodeTextureSet>;
  tick: number;
  playerCurrentZ: number;
  tooltip: TooltipInfo;
}

type Props = {
  args: {
    renderer: Pixi.Renderer,
    markForceUpdate: (childInstance: any) => void,
  },
  updaters: UpdaterGeneratorType2<GameState>,
  delta: number,
  gameState: Const<GameState>,
  appSize: Vector2
}

class RootComponent2 extends LifecycleHandlerBase<Props, State> {
  public container: Pixi.Container;
  public state: State;
  private stateUpdaters: UpdaterGeneratorType2<State>;
  protected fireStateUpdaters: () => void;


  /* children */
  // Contains HUD, and other entities that don't move when game camera moves
  private fixedCameraStage: FixedCameraStageComponent;
  // Contains game entities that move when game camera pans/zooms. Highly encouraged to have further subdivions.
  private actionStage: Pixi.Container;
  // Contains a few entities that doesn't move when game camera moves, but located behind action stage entities, e.g. static backgrounds
  private backdropStage: Pixi.Container;
  // public keyboard: KeyboardState;
  private zLevel: ZLevelComponent | undefined;
  private zLevelPropsFactory: (p: Props, s: State) => ZLevelComponentProps;
  private backdrop: Pixi.Graphics;

  constructor(props: Props) {
    super(props);
    this.container = new Pixi.Container();
    this.container.sortableChildren = true;
    ({ state: this.state, stateUpdaters: this.stateUpdaters, fireStateUpdaters: this.fireStateUpdaters } =
      this.useState<State, RootComponent2>(this, {
        pointNodeTexture: new Lazy(() => generatePointNodeTexture(props.args.renderer)),
        tick: 0,
        playerCurrentZ: 0,
        tooltip: {
          visible: false,
          position: undefined,
          text: '',
        }
      }));

    const fixedCameraStagePropsFactory = (props: Props, state: State) => {
      return {
        args: {
          renderer: props.args.renderer,
          markForceUpdate: this.markForceUpdate,
        },
        delta: props.delta,
        gameState: props.gameState,
        appSize: props.appSize,
        tick: state.tick,
        tooltip: { ...state.tooltip }
      };
    }
    this.fixedCameraStage = new FixedCameraStageComponent(fixedCameraStagePropsFactory(props, this.state));
    this.addChild({
      childClass: FixedCameraStageComponent,
      instance: this.fixedCameraStage,
      propsFactory: fixedCameraStagePropsFactory,
    })

    this.actionStage = new Pixi.Sprite();
    this.actionStage.zIndex = 0;
    this.actionStage.sortableChildren = true;
    this.container.addChild(this.actionStage);

    this.backdropStage = new Pixi.Sprite();
    this.backdropStage.zIndex = -1;
    this.backdropStage.sortableChildren = true;
    this.container.addChild(this.backdropStage);

    this.backdrop = new Pixi.Graphics();
    this.backdropStage.addChild(this.backdrop);
    this.backdrop.beginFill(COLORS.backgroundBlue, 1);
    // backdrop.alpha = 0.5; // if alpha == 0, Pixi does not register this as a hittable area
    this.backdrop.interactive = true;
    // backdrop.interactiveChildren = true; // not sure what this does
    this.backdrop.drawRect(0, 0, props.appSize.x, props.appSize.y);


    this.zLevelPropsFactory = (props: Props, state: State): ZLevelComponentProps => {
      return {
        delta: props.delta,
        args: {
          pointNodeTexture: state.pointNodeTexture.get(),
          markForceUpdate: this.markForceUpdate,
        },
        z: state.playerCurrentZ,
        updaters: props.updaters,
        tooltipUpdaters: this.stateUpdaters.tooltip,
        position: props.appSize.multiply(0.5),
        zLevelGen: props.gameState.worldGen.zLevels[state.playerCurrentZ],
        selectedPointNode: props.gameState.playerUI.selectedPointNode,
        allocatedPointNodeSubset: props.gameState.playerSave.allocatedPointNodeSet,
      };
    }
    this.zLevel = new ZLevelComponent(this.zLevelPropsFactory(props, this.state));
    this.actionStage.addChild(this.zLevel.container);
    this.registerChild({
      childClass: ZLevelComponent,
      instance: this.zLevel,
      propsFactory: this.zLevelPropsFactory,
    });

  }

  protected updateSelf(props: Props) {
    this.state.tick++;

    const activeIntent = props.gameState.intent.activeIntent;
    let deltaX = 0;
    let deltaY = 0;
    const unit = 5 * props.delta;
    // if we want to pan [the hud] west (i.e. the left key was pressed), action stage needs to move east
    if (activeIntent[IntentName.PAN_WEST]) deltaX += unit;
    if (activeIntent[IntentName.PAN_EAST]) deltaX += -unit;
    // if we want to pan south (i.e. the down key was pressed), action stage needs to move north to give the impression
    // the hud is moving south. note that north is negative y direction since top left is 0,0
    if (activeIntent[IntentName.PAN_SOUTH]) deltaY += -unit;
    if (activeIntent[IntentName.PAN_NORTH]) deltaY += unit;
    this.actionStage.x += deltaX;
    this.actionStage.y += deltaY;

    if (props.gameState.intent.newIntent[IntentName.TRAVEL_IN]) {
      this.state.playerCurrentZ--;

      // scale by a factor of 9
      this.actionStage.x *= ChunkGenConstants.CHUNK_DIM;
      this.actionStage.y *= ChunkGenConstants.CHUNK_DIM;

      // console.log({ currentZ: this.state.playerCurrentZ });
    }
    if (props.gameState.intent.newIntent[IntentName.TRAVEL_OUT]) {
      this.state.playerCurrentZ++;

      this.actionStage.x /= ChunkGenConstants.CHUNK_DIM;
      this.actionStage.y /= ChunkGenConstants.CHUNK_DIM;
      // console.log({ currentZ: this.state.playerCurrentZ });
    }
  }

  protected renderSelf(props: Props) {
    this.backdrop.width = props.appSize.x;
    this.backdrop.height = props.appSize.y;
  }

  protected didMount() {
    const { updaters } = this._staleProps;
    this.backdrop.addListener('pointerdown', (event) => {
      updaters.playerUI.selectedPointNode.enqueueUpdate((prev, whole) => {
        return undefined;
      })
    });
  }

  protected didUpdate() {
    const { updaters } = this._staleProps;
    // if we find ourselves a little idle, start pregenerating other layers
    if (this.state.tick > 60 && !this._staleProps.gameState.worldGen.zLevels[-1]) {
      updaters.worldGen.zLevels.enqueueUpdate((prev, prevGameState) => {
        if (!prev[-1]) {
          prev[-1] = new ZLevelGenFactory({}).create({ seed: prevGameState.worldGen.seed, z: -1 });
          return {...prev};
        } else {
          return prev;
        }
      })
    }
    if (this.state.tick > 120 && !this._staleProps.gameState.worldGen.zLevels[1]) {
      updaters.worldGen.zLevels.enqueueUpdate((prev, prevGameState) => {
        if (!prev[1]) {
          prev[1] = new ZLevelGenFactory({}).create({ seed: prevGameState.worldGen.seed, z: 1 });
          return {...prev};
        } else {
          return prev;
        }
      })
    }
  }

}


const wrapped = engageLifecycle(RootComponent2);
// eslint-disable-next-line
type wrapped = RootComponent2;
export { wrapped as RootComponent };
export type { Props as RootComponentProps, State as RootComponentState };