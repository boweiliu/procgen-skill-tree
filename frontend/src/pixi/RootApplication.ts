import * as Pixi from "pixi.js";
import { KeyboardState } from "../lib/pixi/keyboard";
import { Vector2 } from "../lib/util/geometry/vector2";
import { GameState} from "../data/GameState";
import { generatePointNodeTexture } from "./textures/PointNodeTexture";
import { ZLevelGenFactory } from "../dataFactory/WorldGenStateFactory";
import { assertOnlyCalledOnce, Const, Lazy } from "../lib/util/misc";
import { FpsComponent } from "./components/FpsComponent";
import { UpdaterGeneratorType2 } from "../lib/util/updaterGenerator";
import { ZLevelComponent } from "./components/ZLevelComponent";
import { ReticleComponent } from "./components/ReticleComponent";

type State = {
  pointNodeTexture: Lazy<Pixi.Texture>;
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

export class RootApplication {
  public container: Pixi.Container;
  staleProps: Props;
  state: State;

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

  /**
   * Need to provide config to set up the pixi canvas
   */
  constructor(props: Props) {
    this.staleProps = props;
    this.state = {
      pointNodeTexture: new Lazy(() => generatePointNodeTexture(props.args.renderer))
    };
    this.container = new Pixi.Container();

    this.container.sortableChildren = true;

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

    const backdrop = new Pixi.Graphics();
    this.backdropStage.addChild(backdrop);
    backdrop.beginFill(0xabcdef, 1);
    // backdrop.alpha = 0.5; // if alpha == 0, Pixi does not register this as a hittable area
    backdrop.interactive = true;
    // backdrop.interactiveChildren = true; // not sure what this does
    // backdrop.buttonMode = true; // changes the mouse cursor on hover to pointer; not desirable for the entire backdrop
    backdrop.drawRect(0, 0, props.appSize.x, props.appSize.y);


    this.reticle = new ReticleComponent({
      appSize: props.appSize
    });
    this.fixedCameraStage.addChild(this.reticle.container);

    this.renderSelf(props);
    this.didMount();
  }

  shouldUpdate(prevProps: Props, props: Props): boolean {
    return true;
  }

  public update(props: Props) {
    if (!this.shouldUpdate(this.staleProps, props)) { return; }
    this.updateSelf(props)
    // this.keyboard.update(props);
    this.fpsTracker.update({
      delta: props.delta,
      position: new Vector2(0, 0),
      appSize: props.appSize,
    })

    if (props.gameState.worldGen.zLevels[0]) {
      const childProps = {
        delta: 0,
        args: {
          pointNodeTexture: this.state.pointNodeTexture.get(),
          z: 0,
        },
        updaters: props.updaters,
        position: props.appSize.multiply(0.5),
        zLevelGen: props.gameState.worldGen.zLevels[0],
        selectedPointNode: props.gameState.playerUI.selectedPointNode,
        allocatedPointNodeSubset: props.gameState.playerSave.allocatedPointNodeSet,
      };
      if (!this.zLevel) {
        this.zLevel = new ZLevelComponent(childProps);
        this.actionStage.addChild(this.zLevel.container);
      } else {
        this.zLevel.update(childProps);
      }
    }

    this.reticle.update({
      appSize: props.appSize
    })
    this.renderSelf(props);
    this.didUpdate();
  }

  updateSelf(props: Props) {
  }
  renderSelf(props: Props) {
  }
  didMount() {
    const { updaters } = this.staleProps;
    assertOnlyCalledOnce("root application did mount");
    updaters.worldGen.zLevels.update((prev, prevGameState) => {
      assertOnlyCalledOnce("root application callback");
      if (!prev[0]) {
        return [new ZLevelGenFactory({}).create({ seed: prevGameState.worldGen.seed, z: 0 })];
      }
      return prev;
    })
  }
  willUnmount(props: Props) {
  }
  didUpdate() {
  }
}

