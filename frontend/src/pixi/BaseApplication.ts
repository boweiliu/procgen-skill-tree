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
import { assertOnlyCalledOnce, DeepReadonly } from "../lib/util/misc";
import { PixiComponentState } from "../components/PixiComponent";

export type Config = {
  originalWindowWidth: number;
  originalWindowHeight: number;
  onFocusedNodeChange: (selection: PointNodeRef) => void;
};

const defaultConfig: Config = {
  originalWindowWidth: 800,
  originalWindowHeight: 800,
  onFocusedNodeChange: () => { }
};

export class BaseApplication {
  public app!: Pixi.Application;

  // root container
  public stage!: Pixi.Container;
  // Contains HUD, and other entities that don't move when game camera moves
  public fixedCameraStage!: Pixi.Container;
  // Contains game entities that move when game camera pans/zooms. Highly encouraged to have further subdivions.
  public actionStage!: Pixi.Container;
  // Contains a few entities that doesn't move when game camera moves, but located behind action stage entities, e.g. static backgrounds
  public backdropStage!: Pixi.Container;

  public keyboard!: KeyboardState;

  public config!: Config;

  public fpsTracker: FpsTracker;

  onResize: (() => void)[] = [];
  originalAppWidth: number = 1280;
  originalAppHeight: number = 720;
  randomSeed!: number;

  /**
   * Need to provide config to set up the pixi canvas
   */
  constructor(config?: Partial<Config>, app?: Pixi.Application) {
    assertOnlyCalledOnce("Application constructor");
    this.config = Object.assign({}, defaultConfig, config);
    this.randomSeed = 0xcafebabe;

    this.originalAppWidth = Math.min(1280, this.config.originalWindowWidth - 8);
    this.originalAppHeight = Math.min(720, this.config.originalWindowHeight - 8);
    this.app = app || new Pixi.Application({
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

    this.fixedCameraStage = new Pixi.Sprite();
    this.fixedCameraStage.zIndex = 1;
    this.fixedCameraStage.sortableChildren = true;
    this.stage.addChild(this.fixedCameraStage);

    this.actionStage = new Pixi.Sprite();
    this.actionStage.zIndex = 0;
    this.actionStage.sortableChildren = true;
    this.stage.addChild(this.actionStage);

    this.backdropStage = new Pixi.Sprite();
    this.backdropStage.zIndex = -1;
    this.backdropStage.sortableChildren = true;
    this.stage.addChild(this.backdropStage);

    this.keyboard = new KeyboardState();
    this.app.ticker.add(() => {
      this.keyboard.update();
    })

    this.fpsTracker = new FpsTracker();
    this.app.ticker.add((delta) => {
      // delta should be approximately equal to 1
      this.fpsTracker.tick(delta);
    })

    let pointNodeTexture = generatePointNodeTexture(this.app.renderer);

    // test
    // createBunnyExample({ parent: this.actionStage, ticker: this.app.ticker, x: this.app.screen.width / 2, y: this.app.screen.height / 2 });
  }

  /**
   * Please only call once!!
   * Usage: const container = useRef<HTMLDivElement>(null); useEffect(() => { application.register(container.current!); }, []);
   */
  public register(curr: HTMLDivElement) {
    curr.appendChild(this.app.view);
  }

  public rerender(props: {
    gameState: DeepReadonly<GameState>,
    pixiComponentState: PixiComponentState,
  }) {

  }
}
