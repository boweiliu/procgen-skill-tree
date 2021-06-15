import * as Pixi from 'pixi.js';
import { Vector2 } from '../lib/util/geometry/vector2';
import { GameState } from '../data/GameState';
// eslint-disable-next-line
import { assertOnlyCalledOnce, Const } from '../lib/util/misc';
import { RootComponent } from './components/RootComponent';
import { UpdaterGeneratorType2 } from '../lib/util/updaterGenerator';
import COLORS from './colors';
// eslint-disable-next-line
import createBunnyExample from './BunnyExample';

type Props = {
  args: {
    fireBatch: () => void;
    isSecondConstructorCall: boolean;
  };
  updaters: UpdaterGeneratorType2<GameState>; // aka updaters
  gameState: Const<GameState>;
};

type State = {
  appSize: Vector2;
  originalAppSize: Vector2;
};

function appSizeFromWindowSize(window?: Const<Vector2>): Vector2 {
  return new Vector2({
    x: Math.min(1920, (window?.x || Infinity) - 24),
    y: Math.min(1080, (window?.y || Infinity) - 24),
  });
}

/**
 * Pixi side of a pixi-react bridge. This class owns a pixi application and receives props updates from react by way of rerender().
 * Those props updates do not apply immediately but are queued up and apply all at once on the next tick in the baseGameLoop().
 * Kicks off the pixi component lifecycle handling by updating props on Pixi RootComponent.
 */
export class PixiReactBridge {
  public app!: Pixi.Application;

  state!: State;
  props!: Props;
  private staleProps?: Props;

  rootComponent: RootComponent | undefined;
  onTick!: (d: number) => void;

  /**
   * NOTE: for lifecycle convenience, we allow initializing with essentially empty props, and to finish the initialization
   * lazily at the first rerender() call
   * NOTE: this causes an annoying flash since we don't know the initial window size
   */
  constructor(props?: Props, isSecondConstructorCall: boolean = false) {
    // verify that we are not loading this twice when we expect to load it only once -- bad for performance!!
    if (!(props?.args?.isSecondConstructorCall || isSecondConstructorCall)) {
      // assertOnlyCalledOnce("Pixi react bridge constructor"); // annoying with react hot reload, disable for now}
    }

    let appSize = new Vector2(800, 600);
    this.state = {
      appSize,
      originalAppSize: appSize,
    };

    this.app = new Pixi.Application({
      width: this.state.appSize.x,
      height: this.state.appSize.y,
      antialias: true, // both about the same FPS, i get around 30 fps on 1600 x 900
      transparent: true, // true -> better fps?? https://github.com/pixijs/pixi.js/issues/5580
      resolution: window.devicePixelRatio || 1, // lower -> more FPS but uglier
      // resolution: 0.5,
      // resolution: 2,
      autoDensity: true,
      powerPreference: 'low-power', // the only valid one for webgl
      backgroundColor: COLORS.white, // immaterial - we recommend setting color in backdrop graphics
    });

    // test
    // createBunnyExample({ parent: this.app.stage, ticker: this.app.ticker, x: this.app.screen.width / 2, y: this.app.screen.height / 2 });
  }

  public pause() {
    this.app.ticker.remove(this.onTick);
  }
  public destroy() {
    this.app.destroy(true, {
      children: true,
      texture: true,
      baseTexture: true,
    });
  }

  public didMount() {
    this.onTick = (delta) => this.baseGameLoop(delta);
    this.onTick = this.onTick.bind(this);
    this.app.ticker.add(this.onTick);

    // we forgot to set app size properly when pixi first loaded, so do it now
    this.state.appSize = appSizeFromWindowSize(
      new Vector2(
        this.props.gameState.windowState.innerWidth,
        this.props.gameState.windowState.innerHeight
      )
    );
  }

  /**
   * Please only call once!!
   * Usage: const container = useRef<HTMLDivElement>(null); useEffect(() => { application.register(container.current!); }, []);
   */
  public register(curr: HTMLDivElement) {
    curr.appendChild(this.app.view);
  }

  updateSelf(props: Props, staleProps?: Props) {
    if (props === staleProps) {
      props.updaters.tick.enqueueUpdate((it) => it + 1); // TODO(bowei): reneable this
      return;
    }

    // memoize: compute app state from window state dimensions only if they changed from last tick
    if (
      !(
        props.gameState.windowState.innerWidth ===
          staleProps?.gameState.windowState.innerWidth &&
        props.gameState.windowState.innerHeight ===
          staleProps?.gameState.windowState.innerHeight
      )
    ) {
      // console.log(
      //   'update self inner',
      //   props.gameState.windowState,
      //   staleProps?.gameState.windowState
      // );
      this.state.appSize = appSizeFromWindowSize(
        new Vector2(
          props.gameState.windowState.innerWidth,
          props.gameState.windowState.innerHeight
        )
      );
    }

    props.updaters.tick.enqueueUpdate((it) => it + 1); // TODO(bowei): reneable this
  }

  // shim, called from react, possibly many times , possibly at any time, including during the baseGameLoop below
  // props should be a referentially distinct object from props the last time this was called
  rerender(futureProps: Props) {
    if (this.rootComponent && this.props === futureProps) {
      // skip updating props if we're already initialized and there's no new props object
      return;
    }

    // console.log('base app rerender called');

    // take the props handed down from react (probably due to our own props.updaters.fireBatch() call, see game loop) and
    // record them for future use. note that the future props do not take effect down the child hierarchy unless they are
    // manually told to do so.
    this.props = futureProps;

    // If we're not done initializing yet (note that constructor does not set props!), finish it now
    if (!this.rootComponent) {
      // finish initialization
      this.rootComponent = new RootComponent({
        args: {
          renderer: this.app.renderer,
          markForceUpdate: () => {},
        },
        updaters: this.props.updaters,
        delta: 0,
        gameState: this.props.gameState,
        appSize: this.state.appSize,
      });
      this.app.stage.addChild(this.rootComponent.container);

      this.renderSelf(this.props);

      // test
      // createBunnyExample({ parent: this.app.stage, ticker: this.app.ticker, x: this.app.screen.width / 2, y: this.app.screen.height / 2 });
      this.didMount();
    }
  }

  renderSelf(props: Props) {
    this.app.renderer.resize(this.state.appSize.x, this.state.appSize.y);
  }

  baseGameLoop(delta: number) {
    if (this.props.gameState.playerUI.isPixiHidden) {
      if (this.props.gameState.tick % 10 === 0) {
        // console.log('computing pixi update even though pixi is not visible');
      } else {
        // console.log('skipping update since pixi is not visible');
        // have to manually update the tick number since updateSelf is not being called, because staleProps is not being updated
        this.props.updaters.tick.enqueueUpdate((it) => it + 1); // TODO(bowei): reneable this
        this.props.args.fireBatch(); // fire enqueued game state updates, which should come back from react in the rerender()
        return; // skip update loop if pixi is hidden
      }
    }
    // assume props is up to date
    this.updateSelf(this.props, this.staleProps);

    // send props downwards
    this.rootComponent?.update({
      args: {
        renderer: this.app.renderer,
        markForceUpdate: () => {},
      },
      updaters: this.props.updaters,
      delta,
      gameState: this.props.gameState,
      appSize: this.state.appSize,
    });

    this.renderSelf(this.props);
    this.staleProps = this.props;
    this.props.args.fireBatch(); // fire enqueued game state updates, which should come back from react in the rerender()
  }
}
