import * as Pixi from "pixi.js";
import { KeyboardState } from "../lib/pixi/keyboard";
import { FpsTracker } from "../lib/util/fpsTracker";
import { registerDraggable } from "../lib/pixi/DraggableHelper";
import createBunnyExample from "./BunnyExample";
import { Chunk, RenderedChunk } from "./Chunk";
import { Vector2 } from "../lib/util/geometry/vector2";
import { ZLevel } from "./ZLevel";
import { RenderedZLevel } from "./RenderedZLevel";
import { HashMap } from "../lib/util/data_structures/hash";
import { GameState, PointNodeRef } from "../data/GameState";
import { generatePointNodeTexture } from "./textures/PointNodeTexture";
import { Reticle } from "./Reticle";
import { ZLevelGenFactory } from "../dataFactory/WorldGenStateFactory";
import { assertOnlyCalledOnce, DeepReadonly, Lazy } from "../lib/util/misc";

type RootApplicationState = {}
type RootApplicationProps = {}

export class RootApplication {
  state!: RootApplicationState;
  props!: DeepReadonly<RootApplicationProps>;

  /* children */
  // Contains HUD, and other entities that don't move when game camera moves
  public fixedCameraStage!: Pixi.Container;
  // Contains game entities that move when game camera pans/zooms. Highly encouraged to have further subdivions.
  public actionStage!: Pixi.Container;
  // Contains a few entities that doesn't move when game camera moves, but located behind action stage entities, e.g. static backgrounds
  public backdropStage!: Pixi.Container;

  public keyboard!: KeyboardState;

  public fpsTracker!: FpsTracker;

  public static appSizeFromWindowSize(window: Vector2): Vector2 {
    return new Vector2({
      x: Math.min(1280, window.x),
      y: Math.min(720, window.y),
    });
  }

  /**
   * Need to provide config to set up the pixi canvas
   */
  constructor(config?: Partial<Config>) {
    assertOnlyCalledOnce("Base application constructor");
    this.config = Object.assign({}, defaultConfig, config);

    const appSize = BaseApplication.appSizeFromWindowSize(new Vector2(
      this.config.originalWindowWidth, this.config.originalWindowHeight
    ));
    this.originalAppWidth = appSize.x;
    this.originalAppHeight = appSize.y;

    this.app = new Pixi.Application({
      width: this.originalAppWidth, // both are ignored - see resize() below
      height: this.originalAppHeight,
      antialias: true, // both about the same FPS, i get around 30 fps on 1600 x 900
      transparent: true, // true -> better fps?? https://github.com/pixijs/pixi.js/issues/5580
      resolution: window.devicePixelRatio || 1, // lower -> more FPS but uglier
      // resolution: 0.5,
      // resolution: 2,
      autoDensity: true,
      powerPreference: "low-power", // the only valid one for webgl
      backgroundColor: 0xffffff, // immaterial - we recommend setting color in backdrop graphics
    });

    this.stage = this.app.stage;
    this.stage.sortableChildren = true;

    // this.fixedCameraStage = new Pixi.Sprite();
    // this.fixedCameraStage.zIndex = 1;
    // this.fixedCameraStage.sortableChildren = true;
    // this.stage.addChild(this.fixedCameraStage);

    // this.actionStage = new Pixi.Sprite();
    // this.actionStage.zIndex = 0;
    // this.actionStage.sortableChildren = true;
    // this.stage.addChild(this.actionStage);

    // this.backdropStage = new Pixi.Sprite();
    // this.backdropStage.zIndex = -1;
    // this.backdropStage.sortableChildren = true;
    // this.stage.addChild(this.backdropStage);

    // this.keyboard = new KeyboardState();
    // this.app.ticker.add(() => {
    //   this.keyboard.update();
    // })

    // this.fpsTracker = new FpsTracker();
    // this.app.ticker.add((delta) => {
    //   // delta should be approximately equal to 1
    //   this.fpsTracker.tick(delta);
    // })

    let pointNodeTexture = new Lazy(() => generatePointNodeTexture(this.app.renderer));

    // test
    // createBunnyExample({ parent: this.actionStage, ticker: this.app.ticker, x: this.app.screen.width / 2, y: this.app.screen.height / 2 });
    this.app.ticker.add((delta) => this.baseGameLoop(delta));
  }

  /**
   * Please only call once!!
   * Usage: const container = useRef<HTMLDivElement>(null); useEffect(() => { application.register(container.current!); }, []);
   */
  public register(curr: HTMLDivElement) {
    curr.appendChild(this.app.view);
  }

  // render(props: {
  //   gameState: DeepReadonly<GameState>,
  //   pixiComponentState: PixiComponentState,
  // }) { }

  baseGameLoop(delta: number) {
    


  }
}

