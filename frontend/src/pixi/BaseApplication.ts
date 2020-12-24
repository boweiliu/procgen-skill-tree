import * as Pixi from "pixi.js";
import { Vector2 } from "../lib/util/geometry/vector2";
import { GameState, WindowState } from "../data/GameState";
import { assertOnlyCalledOnce, DeepReadonly } from "../lib/util/misc";
import { RootComponent } from "./components/RootComponent";
import { UpdaterGeneratorType2 } from "../lib/util/updaterGenerator";

type Props = {
  args: {
    fireBatch: () => void,
    isSecondConstructorCall: boolean
  },
  updaters: UpdaterGeneratorType2<GameState>, // aka updaters
  pixiComponentState: DeepReadonly<WindowState>,
  gameState: DeepReadonly<GameState>,
}

type State = {
  appSize: Vector2,
  originalAppSize: Vector2,
}



function appSizeFromWindowSize(window?: DeepReadonly<Vector2>): Vector2 {
  return new Vector2({
    x: Math.min(1280, window?.x || Infinity - 8),
    y: Math.min(720, window?.y || Infinity - 8),
  });
}

export class BaseApplication {
  public app!: Pixi.Application;

  state!: State;
  props!: Props;

  RootComponent: RootComponent | undefined;
  onTick!: (d: number) => void;


  /**
   * Need to provide config to set up the pixi canvas
   */
  constructor(props?: Props, isSecondConstructorCall: boolean = false) {
    // verify that we are not loading this twice when we expect to load it only once -- bad for performance!!
    if (!(props?.args?.isSecondConstructorCall || isSecondConstructorCall)) {
      assertOnlyCalledOnce("Base application constructor"); // annoying with react hot reload, disable for now}
    }

    // jlet appSize = appSizeFromWindowSize(
    // j  props.pixiComponentState && new Vector2(props.pixiComponentState.innerWidth, props.pixiComponentState.innerHeight)
    // j);
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
    this.state.appSize = appSizeFromWindowSize(new Vector2(props.pixiComponentState.innerWidth, props.pixiComponentState.innerHeight));
  }

  // shim, called from react, possibly many times , possibly at any time, including during the baseGameLoop below
  rerender(props: Props) {
    console.log("base app rerender called", { size: props.gameState.playerSave.allocatedPointNodeSet.size() });
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
    }
    this.didMount();
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
    this.didUpdate(this.props);
    this.props.args.fireBatch(); // fire enqueued game state updates, which should come back from react in the rerender()
  }
}
