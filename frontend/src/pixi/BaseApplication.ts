import * as Pixi from "pixi.js";
import { Vector2 } from "../lib/util/geometry/vector2";
import { GameState, WindowState } from "../data/GameState";
import { assertOnlyCalledOnce, DeepReadonly, updaterGenerator, UpdaterGeneratorType } from "../lib/util/misc";
import { GameStateFactory } from "../dataFactory/GameStateFactory";

export type Config = {
  originalWindowWidth: number;
  originalWindowHeight: number;
};

const defaultConfig: Config = {
  originalWindowWidth: 800,
  originalWindowHeight: 800,
};

export type BaseApplicationProps = DeepReadonly<MutableProps>

type MutableProps = {
  gameState: GameState,
  pixiComponentState: WindowState, // shim
}

export type BaseApplicationUpdaters = {
  gameState: UpdaterGeneratorType<GameState>,
};

export type BaseApplicationState = {
  appSize: Vector2,
}

export class BaseApplication {
  public config!: Config;
  originalAppWidth: number;
  originalAppHeight: number;
  public app!: Pixi.Application;

  public globalEventQueue: ((...args: any[]) => void)[] = [];
  state!: BaseApplicationState;
  updaters!: BaseApplicationUpdaters;

  gameState!: GameState;
  props!: MutableProps;
  // nextProps!: MutableProps | undefined;

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

    this.state.appSize = BaseApplication.appSizeFromWindowSize(new Vector2(props.pixiComponentState.innerWidth, props.pixiComponentState.innerHeight));
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
    this.state.appSize = BaseApplication.appSizeFromWindowSize(new Vector2(props.pixiComponentState.innerWidth, props.pixiComponentState.innerHeight));
  }

  // shim, called from react, possibly many times , possibly at any time, including during the baseGameLoop below
  rerender(props: {
    gameStateUpdaters: UpdaterGeneratorType<GameState>,
    pixiComponentState: DeepReadonly<WindowState>,
    // needed to avoid double-updates
    prevGameState: DeepReadonly<GameState>,
    gameState: DeepReadonly<GameState>,
  }) {
    this.globalEventQueue.push(() => {
      this.props.pixiComponentState = props.pixiComponentState;
      this.updaters.gameState = props.gameStateUpdaters; // optional
    })
  }

  render(delta: number, props: BaseApplicationProps) {
    this.app.renderer.resize(this.state.appSize.x, this.state.appSize.y);
  }


  blockedReactUpdate: { old: GameState, new: GameState } | undefined;

  baseGameLoop(delta: number) {
    // now: read the value of this.gameState
    let startGameState = this.gameState
    // generates a new object by shallow copying
    let setStartGameState = (arg: GameState | ((old: GameState) => GameState)) => {
      if (typeof arg === 'function') {
        startGameState = { ...arg(startGameState) };
      } else {
        startGameState = { ...arg }
      }
    }

    // apply changes to gameState - this should be synchronous, or at least locked
    let updater = updaterGenerator<GameState>(startGameState, setStartGameState);
    for (let eventAction of this.globalEventQueue) {
      eventAction(updater); // includes actions sent down from react
    }

    // pass the new game state back up
    this.gameState = startGameState;
    // note that react will view this as a state change and trigger this.rerender immediately, so we need to block that
    this.updaters.gameState.update((old: GameState): GameState => {
      this.blockedReactUpdate = { old, new: this.gameState };
      return this.gameState;
    });

  }
}
