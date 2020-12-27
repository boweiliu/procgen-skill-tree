import * as Pixi from "pixi.js";
import { Vector2 } from "../lib/util/geometry/vector2";
import { GameState, WindowState } from "../data/GameState";
import { assertOnlyCalledOnce, Const } from "../lib/util/misc";
import { RootComponent } from "./components/RootComponent";
import { UpdaterGeneratorType2 } from "../lib/util/updaterGenerator";

type Props = {
  args: {
    fireBatch: () => void,
    isSecondConstructorCall: boolean
  },
  updaters: UpdaterGeneratorType2<GameState>, // aka updaters
  windowState: Const<WindowState>,
  gameState: Const<GameState>,
}

type State = {
  appSize: Vector2,
  originalAppSize: Vector2,
}

function appSizeFromWindowSize(window?: Const<Vector2>): Vector2 {
  return new Vector2({
    x: Math.min(1920, (window?.x || Infinity) - 24),
    y: Math.min(1080, (window?.y || Infinity) - 24),
  });
}

export class PixiReactBridge {
  public app!: Pixi.Application;

  state!: State;
  props!: Props;

  RootComponent: RootComponent | undefined;
  onTick!: (d: number) => void;

  /**
   * NOTE: for lifecycle convenience, we allow initializing with essentially empty props, and to finish the initialization
   * lazily at the first rerender() call
   */
  constructor(props?: Props, isSecondConstructorCall: boolean = false) {
    // verify that we are not loading this twice when we expect to load it only once -- bad for performance!!
    if (!(props?.args?.isSecondConstructorCall || isSecondConstructorCall)) {
      // assertOnlyCalledOnce("Pixi react bridge constructor"); // annoying with react hot reload, disable for now}
    }

    // let appSize = appSizeFromWindowSize(
    //   props.windowState && new Vector2(props.windowState.innerWidth, props.windowState.innerHeight)
    // );
    let appSize = new Vector2(800, 600);
    this.state = {
      appSize,
      originalAppSize: appSize
    }

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

    // this.RootComponent = new RootComponent({
    //   args: {
    //     renderer: this.app.renderer,
    //   },
    //   updaters: this.props.updaters,
    //   delta: 0,
    //   gameState: this.props.gameState,
    //   appSize: this.state.appSize,
    // })
    // this.app.stage.addChild(this.RootComponent.container);

    // this.renderSelf(this.props);

    // // test
    // // createBunnyExample({ parent: this.app.stage, ticker: this.app.ticker, x: this.app.screen.width / 2, y: this.app.screen.height / 2 });
    // this.didMount();
  }

  public pause() {
    this.app.ticker.remove(this.onTick);
  }
  public destroy() {
    this.app.destroy(true, { children: true, texture: true, baseTexture: true });
  }

  public didMount() {
    this.onTick = (delta) => this.baseGameLoop(delta);
    this.onTick = this.onTick.bind(this);
    this.app.ticker.add(this.onTick);
  }

  /**
   * Please only call once!!
   * Usage: const container = useRef<HTMLDivElement>(null); useEffect(() => { application.register(container.current!); }, []);
   */
  public register(curr: HTMLDivElement) {
    curr.appendChild(this.app.view);
  }

  public update(props: Props) {
    this.props = props;
  }

  updateSelf(props: Props) {
    this.state.appSize = appSizeFromWindowSize(new Vector2(props.windowState.innerWidth, props.windowState.innerHeight));
  }

  // shim, called from react, possibly many times , possibly at any time, including during the baseGameLoop below
  // props should be a referentially distinct object from props the last time this was called
  rerender(props: Props) {
    console.log("base app rerender called", { playerUI: props.gameState.playerUI });
    this.props = props;
    if (!this.RootComponent) {
      // finish initialization
      this.RootComponent = new RootComponent({
        args: {
          renderer: this.app.renderer,
        },
        updaters: this.props.updaters,
        delta: 0,
        gameState: this.props.gameState,
        appSize: this.state.appSize,
      })
      this.app.stage.addChild(this.RootComponent.container);

      this.renderSelf(this.props);

      // test
      // createBunnyExample({ parent: this.app.stage, ticker: this.app.ticker, x: this.app.screen.width / 2, y: this.app.screen.height / 2 });
      this.didMount();
    }
  }

  renderSelf(props: Props) {
    this.app.renderer.resize(this.state.appSize.x, this.state.appSize.y);
  }

  public didUpdate(props: Props) {
  }

  baseGameLoop(delta: number) {
    // assume props is up to date
    this.updateSelf(this.props);
    // send props downwards
    this.RootComponent?.update({
      args: {
        renderer: this.app.renderer,
      },
      updaters: this.props.updaters,
      delta,
      gameState: this.props.gameState,
      appSize: this.state.appSize,
    });
    
    this.renderSelf(this.props);
    this.didUpdate(this.props); // add updaters to queue if we want them for next cycle
    this.props.args.fireBatch(); // fire enqueued game state updates, which should come back from react in the rerender()
  }
}
