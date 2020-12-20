import * as Pixi from "pixi.js";
import { KeyboardState } from "../lib/pixi/keyboard";
import { FpsTracker } from "../lib/util/fpsTracker";
import { registerDraggable } from "../lib/pixi/DraggableHelper";
import createBunnyExample from "./BunnyExample";
import { Chunk, RenderedChunk } from "./Chunk";
import { Vector2 } from "../lib/util/geometry/vector2";

export type Config = {
  originalWindowWidth: number;
  originalWindowHeight: number;
  onFocusedNodeChange?: Function;
};

const defaultConfig: Config = {
  originalWindowWidth: 800,
  originalWindowHeight: 800,
};

export type Point = number[];

export class Application {
  public app!: Pixi.Application;

  // root container
  public stage!: Pixi.Container;
  // Contains HUD, and other entities that don't move when game camera moves
  public fixedCameraStage!: Pixi.Container;
  // Contains game entities that move when game camera pans/zooms. Highly encouraged to have further subdivions.
  public actionStage!: Pixi.Container;
  // Contains a few entities that doesn't move when game camera moves, but located behind action stage entities, e.g. static backgrounds
  public backdropStage!: Pixi.Container;

  public config!: Config;

  public fpsTracker: FpsTracker;

  onResize: (() => void)[] = [];
  originalAppWidth: number = 1280;
  originalAppHeight: number = 720;
  randomSeed!: number;

  /**
   * Need to provide config to set up the pixi canvas
   */
  constructor(config?: Config, app?: Pixi.Application) {
    this.config = Object.assign({}, defaultConfig, config);
    this.randomSeed = 0xcafebabe;

    this.originalAppWidth = Math.min(1280, this.config.originalWindowWidth - 8);
    this.originalAppHeight = Math.min(720, this.config.originalWindowHeight - 8);
    this.app =
      app ||
    new Pixi.Application({
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
    registerDraggable({
      source: this.backdropStage,
      // dragging backdrop stage should move action stage in the reverse direction -- we're dragging the backdrop, not an entity
      target: this.actionStage,
    });

    const keyboard = new KeyboardState();
    this.app.ticker.add((delta) => {
      keyboard.update();
      if (keyboard.down.Right) {
        this.actionStage.x -= 10 * delta;
      }
      if (keyboard.down.Left) {
        this.actionStage.x += 10 * delta;
      }
      if (keyboard.down.Up) {
        this.actionStage.y += 10 * delta;
      }
      if (keyboard.down.Down) {
        this.actionStage.y -= 10 * delta;
      }
    });

    this.fpsTracker = new FpsTracker();
    this.app.ticker.add((delta) => {
      // delta should be approximately equal to 1
      this.fpsTracker.tick(delta);
    })

    this.resize(this.config.originalWindowWidth, this.config.originalWindowHeight);

  }

  /**
   * Please only call once!!
   * Usage: const container = useRef<HTMLDivElement>(null); useEffect(() => { application.register(container.current!); }, []);
   */
  public register(curr: HTMLDivElement) {
    curr.appendChild(this.app.view);
  }

  public resize(windowWidth: number, windowHeight: number) {
    // we dont want to take up the whole window
    // this.app.renderer.resize(windowHeight * 0.75, windowHeight * 0.75);
    this.app.renderer.resize(Math.min(1280, windowWidth  - 8), Math.min(720, windowHeight  - 8));
    // causes the game to be rescaled when window is resized
    // this.app.stage.width = windowHeight * 0.75;
    // this.app.stage.height = windowHeight * 0.75;
    // this.app.stage.x = windowHeight * 0.375;
    this.actionStage.pivot.x = (this.app.screen.width - this.originalAppWidth) * -0.5;
    this.actionStage.pivot.y = (this.app.screen.height - this.originalAppHeight) * -0.5;
    this.onResize.map(fn => fn());
    // this.app.stage.pivot.x = 0;
  }

  public drawStart() {
    // put a text thingy in the top right
    let textFpsHud = new Pixi.Text('', {
      fontFamily: 'PixelMix',
      fontSize: 12,
      // align: 'right'
    });
    this.app.ticker.add(() => {
      textFpsHud.text = this.fpsTracker.getFpsString() + " FPS\n" + this.fpsTracker.getUpsString() + " UPS\n" + 
      this.app.screen.width + "x" + this.app.screen.height;
    })
    textFpsHud.x = this.app.screen.width;
    this.onResize.push(() => { textFpsHud.x = this.app.screen.width; });
    textFpsHud.y = 0;
    textFpsHud.anchor.x = 1; // right justify
    this.fixedCameraStage.addChild(textFpsHud);

    
    // add an invisible layer to the entire fixedCameraStage so we can pan and zoom
    const backdrop = new Pixi.Graphics();
    this.backdropStage.addChild(backdrop);
    backdrop.beginFill(0xabcdef, 1);
    // backdrop.alpha = 0.5; // if alpha == 0, Pixi does not register this as a hittable area
    backdrop.interactive = true;
    // backdrop.interactiveChildren = true; // not sure what this does
    // backdrop.buttonMode = true; // changes the mouse cursor on hover to pointer; not desirable for the entire backdrop
    backdrop.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    this.onResize.push(() => {
      backdrop.width = this.app.screen.width;
      backdrop.height = this.app.screen.height;
    });
    // backdrop.drawRect(-10000, -10000, 30000, 30000);

    // Add a reticle in the hud at the midpoint
    const reticle = new Pixi.Graphics();
    reticle.lineStyle(2, 0x999999);
    reticle.drawCircle(0, 0, 6);
    reticle.x = this.app.screen.width / 2;
    reticle.y = this.app.screen.height / 2;
    this.onResize.push(() => {
    reticle.x = this.app.screen.width / 2;
    reticle.y = this.app.screen.height / 2;
    })
    reticle.interactive = true;
    this.fixedCameraStage.addChild(reticle);


    // createBunnyExample({ parent: this.actionStage, ticker: this.app.ticker, x: this.app.screen.width / 2, y: this.app.screen.height / 2 });

    let chunksContainer = new Pixi.Container();
    this.actionStage.addChild(chunksContainer);
    chunksContainer.x = this.app.screen.width/2;
    chunksContainer.y = this.app.screen.height/2;
    this.onResize.push(() => {
      chunksContainer.x = this.app.screen.width/2;
      chunksContainer.y = this.app.screen.height/2;
    })
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        chunksContainer.addChild(
          new RenderedChunk(
            new Chunk(this.randomSeed, new Vector2(i, j)),
            this.config.onFocusedNodeChange
          ).container
        );
      }
    }
  }
}
