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
import { PixiComponentState } from "../components/PixiComponent";
import { render } from "@testing-library/react";

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

export type BaseApplicationProps = DeepReadonly<{
  gameState: GameState,
  windowSize: Vector2,
}>

export type BaseApplicationState = {
  appSize: Vector2,
}

export class BaseApplication {
  public config!: Config;
  public app!: Pixi.Application;
  state!: BaseApplicationState;

  originalAppWidth: number;
  originalAppHeight: number;

  public static appSizeFromWindowSize(window: DeepReadonly<Vector2>): Vector2 {
    return new Vector2({
      x: Math.min(1280, window.x),
      y: Math.min(720, window.y),
    });
  }

  /**
   * Need to provide config to set up the pixi canvas
   */
  constructor(args: Partial<Config> = {}, props: BaseApplicationProps) {
    assertOnlyCalledOnce("Base application constructor");
    this.config = Object.assign({}, defaultConfig, args);

    this.state.appSize = BaseApplication.appSizeFromWindowSize(props.windowSize);
    this.originalAppWidth = this.state.appSize.x;
    this.originalAppHeight = this.state.appSize.y;

    this.app = new Pixi.Application({
      width: this.state.appSize.x,
      height: this.state.appSize.y,
      antialias: true, // both about the same FPS, i get around 30 fps on 1600 x 900
      transparent: true, // true -> better fps?? https://github.com/pixijs/pixi.js/issues/5580
      resolution: window.devicePixelRatio || 1, // lower -> more FPS but uglier
      // resolution: 0.5,
      // resolution: 2,
      autoDensity: true,
      powerPreference: "low-power", // the only valid one for webgl
      backgroundColor: 0xffffff, // immaterial - we recommend setting color in backdrop graphics
    });

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

  updateState(delta: number, props: BaseApplicationProps) {
    this.state.appSize = BaseApplication.appSizeFromWindowSize(props.windowSize);
  }

  render(delta: number, props: BaseApplicationProps) {
    this.app.renderer.resize(this.state.appSize.x, this.state.appSize.y);
  }

  baseGameLoop(delta: number) {

  }
}
