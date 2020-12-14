import * as Pixi from "pixi.js";
import { Rect } from "../lib/util/geometry/rect";
import { Vector2 } from "../lib/util/geometry/vector2";
import { RenderRects, RenderRectsConfig } from "./RenderRects";
import bunny from "../bunny.png";
import { KeyboardState } from "../lib/pixi/keyboard";
import { FpsTracker } from "../lib/util/fpsTracker";
import { DraggableHelper, registerDraggable } from "../lib/pixi/DraggableHelper";

export type Config = {
  canvasWidth: number;
  canvasHeight: number;
};

const defaultConfig: Config = {
  canvasWidth: 800,
  canvasHeight: 800,
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

  /**
   * Need to provide config to set up the pixi canvas
   */
  constructor(config?: Config, app?: Pixi.Application) {
    this.config = Object.assign({}, defaultConfig, config);

    this.app =
      app ||
      new Pixi.Application({
        width: this.config.canvasWidth,
        height: this.config.canvasHeight,
        antialias: true,
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

    // put a text thingy in the top right
    let textFpsHud = new Pixi.Text('');
    this.app.ticker.add(() => {
      textFpsHud.text = this.fpsTracker.getFpsString() + " FPS\n" + this.fpsTracker.getUpsString() + " UPS";
    })
    textFpsHud.x = 600;
    textFpsHud.y = 200;
    this.fixedCameraStage.addChild(textFpsHud);

  }

  /**
   * Please only call once!!
   * Usage: const container = useRef<HTMLDivElement>(null); useEffect(() => { application.register(container.current!); }, []);
   */
  public register(curr: HTMLDivElement) {
    curr.appendChild(this.app.view);
  }

  /**
   * Draws a full skill tree at the default zoom level.
   */
  public drawAll() {
    // get the first 3 layers' configurations
    // render the top layer points
    // renderLayerPoints(layer[0], { rect: null })
    // render the next layer
    // render the intermediate connections
    // render the final layer
    // render the intermediate connections
  }

  /**
   * Used for panning/zooming.
   */
  public moveViewport(viewport: Rect) {}

  public drawStart() {
    // this.renderRects.drawFirst();
    this.pixiExample();
    
    // add an invisible layer to the entire fixedCameraStage so we can pan and zoom
    const backdrop = new Pixi.Graphics();
    this.backdropStage.addChild(backdrop);
    backdrop.beginFill(0xabcdef, 1);
    // backdrop.alpha = 0.5;
    backdrop.interactive = true;
    // backdrop.interactiveChildren = true;
    // backdrop.zIndex = 31;
    // backdrop.buttonMode = true;
    // backdrop.drawRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
    backdrop.drawRect(-10000, -10000, 20000, 20000);
    // backdrop.addListener('pointerupoutside', e => {
    //   console.log('clickable hud', e)
    // })
    // backdrop.addListener('pointerup', (e) => {
    //   // window.alert('up from clickable hud');
    //   console.log('clickable hud', e)
    // })

    const reticle = new Pixi.Graphics();
    this.fixedCameraStage.addChild(reticle);

    reticle.lineStyle(2, 0x999999);
    reticle.drawCircle(this.config.canvasWidth / 2, this.config.canvasHeight / 2, 10);
    reticle.interactive = true;
  }

  public drawCircle() {
  }

  public pixiExample() {
    // Taken from  https://pixijs.io/examples/#/demos-basic/container.js
    const container = new Pixi.Container();

    this.actionStage.addChild(container);

    // Create a new texture
    const texture = Pixi.Texture.from(bunny);

    window.alert("doing bunny stuff")

    // Create a 5x5 grid of bunnies
    for (let i = 0; i < 25; i++) {
      const bunny = new Pixi.Sprite(texture);
      bunny.anchor.set(0.5);
      bunny.x = (i % 5) * 40;
      bunny.y = Math.floor(i / 5) * 40;
      container.addChild(bunny);
      bunny.interactive = true;
      // bunny.addListener('pointerdown', () => {
      //   window.alert('clicked bunny #' + i);
      // });
    }

    // Move container to the center
    container.x = this.app.screen.width / 2;
    container.y = this.app.screen.height / 2;

    // Center bunny sprite in local container coordinates
    container.pivot.x = container.width / 2;
    container.pivot.y = container.height / 2;

    // Listen for animate update
    this.app.ticker.add((delta) => {
      // rotate the container!
      // use delta to create frame-independent transform
      container.rotation -= 0.01 * delta;
    });
  }
}
