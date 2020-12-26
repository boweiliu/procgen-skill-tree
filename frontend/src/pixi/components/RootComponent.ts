import * as Pixi from "pixi.js";
import { KeyboardState } from "../../lib/pixi/keyboard";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { GameState, IntentName} from "../../data/GameState";
import { generatePointNodeTexture } from "../textures/PointNodeTexture";
import { ZLevelGenFactory } from "../../game/WorldGenStateFactory";
import { Const, Lazy } from "../../lib/util/misc";
import { FpsComponent } from "./FpsComponent";
import { updaterGenerator2, UpdaterGeneratorType2, UpdaterFn } from "../../lib/util/updaterGenerator";
import { ZLevelComponent } from "./ZLevelComponent";
import { ReticleComponent } from "./ReticleComponent";
import { batchifySetState } from "../../lib/util/batchify";

type State = {
  pointNodeTexture: Lazy<Pixi.Texture>;
  tick: number;
  playerCurrentZ: number;
}

type Props = {
  args: {
    renderer: Pixi.Renderer,
  },
  updaters: UpdaterGeneratorType2<GameState>,
  delta: number,
  gameState: Const<GameState>,
  appSize: Vector2
}

export class RootComponent {
  public container: Pixi.Container;
  staleProps: Props;
  state: State;
  stateUpdaters: UpdaterGeneratorType2<State>;
  fireStateUpdaters: () => void;

  /* children */
  // Contains HUD, and other entities that don't move when game camera moves
  public fixedCameraStage: Pixi.Container;
  // Contains game entities that move when game camera pans/zooms. Highly encouraged to have further subdivions.
  public actionStage: Pixi.Container;
  // Contains a few entities that doesn't move when game camera moves, but located behind action stage entities, e.g. static backgrounds
  public backdropStage: Pixi.Container;
  public keyboard!: KeyboardState;
  public fpsTracker: FpsComponent;
  public zLevel: ZLevelComponent | undefined;
  public reticle: ReticleComponent;
  public backdrop: Pixi.Graphics;

  /**
   * Need to provide config to set up the pixi canvas
   */
  constructor(props: Props) {
    this.container = new Pixi.Container();
    this.container.sortableChildren = true;
    this.staleProps = props;
    this.state = {
      pointNodeTexture: new Lazy(() => generatePointNodeTexture(props.args.renderer)),
      tick: 0,
      playerCurrentZ: 0,
    };
    const setState: UpdaterFn<State> = ((valueOrCallback) => {
      if (typeof valueOrCallback === "function") {
        this.state = valueOrCallback(this.state);
      } else {
        this.state = valueOrCallback;
      }
    })
    let [batchedSetState, fireBatch] = batchifySetState(setState);
    this.stateUpdaters = updaterGenerator2<State>(this.state, batchedSetState);
    this.fireStateUpdaters = fireBatch;

    this.fixedCameraStage = new Pixi.Sprite();
    this.fixedCameraStage.zIndex = 1;
    this.fixedCameraStage.sortableChildren = true;
    this.container.addChild(this.fixedCameraStage);

    this.actionStage = new Pixi.Sprite();
    this.actionStage.zIndex = 0;
    this.actionStage.sortableChildren = true;
    this.container.addChild(this.actionStage);

    this.backdropStage = new Pixi.Sprite();
    this.backdropStage.zIndex = -1;
    this.backdropStage.sortableChildren = true;
    this.container.addChild(this.backdropStage);

    // // this.keyboard = new KeyboardState();
    // // this.app.ticker.add(() => {
    // //   this.keyboard.update();
    // // })

    this.fpsTracker = new FpsComponent({
      delta: props.delta,
      position: new Vector2(0, 0),
      appSize: props.appSize,
    })
    this.fixedCameraStage.addChild(this.fpsTracker.container);

    this.backdrop = new Pixi.Graphics();
    this.backdropStage.addChild(this.backdrop);
    this.backdrop.beginFill(0xabcdef, 1);
    // backdrop.alpha = 0.5; // if alpha == 0, Pixi does not register this as a hittable area
    this.backdrop.interactive = true;
    // backdrop.interactiveChildren = true; // not sure what this does
    // backdrop.buttonMode = true; // changes the mouse cursor on hover to pointer; not desirable for the entire backdrop
    this.backdrop.drawRect(0, 0, props.appSize.x, props.appSize.y);


    this.reticle = new ReticleComponent({
      appSize: props.appSize
    });
    this.fixedCameraStage.addChild(this.reticle.container);

    const childProps = {
      delta: 0,
      args: {
        pointNodeTexture: this.state.pointNodeTexture.get(),
      },
      z: this.state.playerCurrentZ,
      updaters: props.updaters,
      position: props.appSize.multiply(0.5),
      zLevelGen: props.gameState.worldGen.zLevels[this.state.playerCurrentZ],
      selectedPointNode: props.gameState.playerUI.selectedPointNode,
      allocatedPointNodeSubset: props.gameState.playerSave.allocatedPointNodeSet,
    };
    if (!this.zLevel) {
      this.zLevel = new ZLevelComponent(childProps);
      this.actionStage.addChild(this.zLevel.container);
    } else {
      this.zLevel.update(childProps);
    }

    this.renderSelf(props);
    this.didMount();
  }

  shouldUpdate(prevProps: Props, props: Props): boolean {

    let prevSize = prevProps.gameState.playerSave.allocatedPointNodeSet.size()
    let nextSize = props.gameState.playerSave.allocatedPointNodeSet.size()
    if (prevSize !== nextSize) { console.log('rootapp shouldUpdate', { prevSize, nextSize }); }
    return true;
  }

  public update(props: Props) {
    this.fireStateUpdaters();
    if (!this.shouldUpdate(this.staleProps, props)) { return; }
    this.updateSelf(props)
    // this.keyboard.update(props);
    this.fpsTracker.update({
      delta: props.delta,
      position: new Vector2(0, 0),
      appSize: props.appSize,
    })

    const childProps = {
      delta: 0,
      args: {
        pointNodeTexture: this.state.pointNodeTexture.get(),
      },
      z: this.state.playerCurrentZ,
      updaters: props.updaters,
      position: props.appSize.multiply(0.5),
      zLevelGen: props.gameState.worldGen.zLevels[this.state.playerCurrentZ],
      selectedPointNode: props.gameState.playerUI.selectedPointNode,
      allocatedPointNodeSubset: props.gameState.playerSave.allocatedPointNodeSet,
    };
    if (!this.zLevel) {
      this.zLevel = new ZLevelComponent(childProps);
      this.actionStage.addChild(this.zLevel.container);
    } else {
      this.zLevel.update(childProps);
    }

    this.reticle.update({
      appSize: props.appSize
    })
    this.renderSelf(props);
    this.didUpdate(this.staleProps, props);
    this.staleProps = props;
  }

  updateSelf(props: Props) {
    this.state.tick++;

    const activeIntent = props.gameState.intent.activeIntent;
    let deltaX = 0;
    let deltaY = 0;
    const unit = 5;
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
      console.log({ currentZ: this.state.playerCurrentZ });
    }
    if (props.gameState.intent.newIntent[IntentName.TRAVEL_OUT]) {
      this.state.playerCurrentZ++;
      console.log({ currentZ: this.state.playerCurrentZ });
    }
  }

  renderSelf(props: Props) {
    this.backdrop.width = props.appSize.x;
    this.backdrop.height = props.appSize.y;
  }

  didMount() {
    const { updaters } = this.staleProps;
    this.backdrop.addListener('pointerdown', (event) => {
      updaters.playerUI.selectedPointNode.enqueueUpdate((prev, whole) => {
        return undefined;
      })
    });
  }

  public willUnmount() {
  }

  didUpdate(prevProps: Props, props: Props) {
    const { updaters } = this.staleProps;
    // if we find ourselves a little idle, start pregenerating other layers
    if (this.state.tick > 60 && !props.gameState.worldGen.zLevels[-1]) {
      updaters.worldGen.zLevels.enqueueUpdate((prev, prevGameState) => {
        if (!prev[-1]) {
          prev[-1] = new ZLevelGenFactory({}).create({ seed: prevGameState.worldGen.seed, z: -1 });
          return {...prev};
        } else {
          return prev;
        }
      })
    }
    if (this.state.tick > 120 && !props.gameState.worldGen.zLevels[1]) {
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

