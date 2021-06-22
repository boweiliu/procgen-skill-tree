import * as Pixi from 'pixi.js';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { GameState } from '../../data/GameState';
import {
  generatePointNodeTexture,
  PointNodeTextureSet,
} from '../textures/PointNodeTexture';
import { Const } from '../../lib/util/misc';
import { Lazy } from '../../lib/util/lazy';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import { engageLifecycle, LifecycleHandlerBase } from './LifecycleHandler';
import { FixedCameraStageComponent } from './FixedCameraStageComponent';
import { TooltipInfo } from './TooltipComponent';
import COLORS from '../colors';
import {
  extractStrategicHexGridSubState,
  StrategicHexGridComponent,
  StrategicHexGridComponentProps,
} from './StrategicHexGridComponent';
import {
  generateSimpleTextures,
  SimpleTextureSet,
} from '../textures/SimpleTextures';

type State = {
  pointNodeTexture: Lazy<PointNodeTextureSet>;
  simpleTexture: Lazy<SimpleTextureSet>;
  tick: number;
  playerCurrentZ: number;
  tooltip: TooltipInfo;
};

type Props = {
  args: {
    renderer: Pixi.Renderer;
    markForceUpdate: (childInstance: any) => void;
  };
  updaters: UpdaterGeneratorType2<GameState>;
  delta: number;
  gameState: Const<GameState>;
  appSize: Vector2;
};

class RootComponent2 extends LifecycleHandlerBase<Props, State> {
  public container: Pixi.Container;
  public state: Const<State>;
  protected stateUpdaters: UpdaterGeneratorType2<State, State>;
  protected fireStateUpdaters: () => void;

  /* children */
  // Contains HUD, and other entities that don't move when game camera moves
  private fixedCameraStage: FixedCameraStageComponent;
  // Contains game entities that move when game camera pans/zooms. Highly encouraged to have further subdivions.
  private actionStage: Pixi.Container;
  // Contains a few entities that doesn't move when game camera moves, but located behind action stage entities, e.g. static backgrounds
  private backdropStage: Pixi.Container;
  // public keyboard: KeyboardState;
  private strategicHexGrid: StrategicHexGridComponent;

  private backdrop: Pixi.Graphics;

  constructor(props: Props) {
    super(props);
    this.container = new Pixi.Container();
    this.container.sortableChildren = true;

    // Initialize state, and also set up state updaters & batched fire callback
    ({
      state: this.state,
      stateUpdaters: this.stateUpdaters,
      fireStateUpdaters: this.fireStateUpdaters,
    } = this.useState<State, RootComponent2>(this, {
      pointNodeTexture: new Lazy(() =>
        generatePointNodeTexture(props.args.renderer)
      ),
      simpleTexture: new Lazy(() =>
        generateSimpleTextures(props.args.renderer)
      ),
      tick: 0,
      playerCurrentZ: 0,
      tooltip: {
        visible: false,
        position: undefined,
        text: '',
      },
    }));

    const fixedCameraStagePropsFactory = (
      props: Props,
      state: Const<State>
    ) => {
      return {
        args: {
          renderer: props.args.renderer,
          markForceUpdate: this.markForceUpdate,
        },
        delta: props.delta,
        gameState: props.gameState,
        appSize: props.appSize,
        tick: state.tick,
        tooltip: { ...state.tooltip },
      };
    };
    this.fixedCameraStage = new FixedCameraStageComponent(
      fixedCameraStagePropsFactory(props, this.state)
    );
    this.addChild({
      childClass: FixedCameraStageComponent,
      instance: this.fixedCameraStage,
      propsFactory: fixedCameraStagePropsFactory,
    });

    this.actionStage = new Pixi.Sprite();
    this.actionStage.zIndex = 0;
    this.actionStage.sortableChildren = true;
    this.container.addChild(this.actionStage);

    const strategicHexGridPropsFactory = (
      props: Props,
      state: Const<State>
    ): StrategicHexGridComponentProps => {
      const { gameState } = props;
      return {
        delta: props.delta,
        args: {
          position: Vector2.Zero,
          textures: state.simpleTexture.get(),
        },
        updaters: props.updaters,
        appSize: props.appSize,
        gameState: extractStrategicHexGridSubState(gameState),
      };
    };
    this.strategicHexGrid = new StrategicHexGridComponent(
      strategicHexGridPropsFactory(props, this.state)
    );
    this.addChild({
      childClass: StrategicHexGridComponent,
      instance: this.strategicHexGrid,
      propsFactory: strategicHexGridPropsFactory,
    });

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
  }

  protected updateSelf(props: Props) {
    this.stateUpdaters.tick.enqueueUpdate((prev) => prev + 1);
  }

  protected renderSelf(props: Props) {
    this.backdrop.width = props.appSize.x;
    this.backdrop.height = props.appSize.y;
  }

  protected didMount() {
    // const { updaters } = this._staleProps;
  }

  protected didUpdate() {
    // const { updaters } = this._staleProps;
  }
}

const wrapped = engageLifecycle(RootComponent2);
// eslint-disable-next-line
type wrapped = RootComponent2;
export { wrapped as RootComponent };
export type { Props as RootComponentProps, State as RootComponentState };
