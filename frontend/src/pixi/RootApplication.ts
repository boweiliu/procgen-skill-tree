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
import { assertOnlyCalledOnce, Const, DeepReadonly, Lazy, UpdaterGeneratorType } from "../lib/util/misc";
import { FpsComponent } from "./components/FpsComponent";

type RootApplicationState = {
  pointNodeTexture: Lazy<Pixi.Texture>;
}

type RootApplicationProps = {
  args: {
    renderer: Pixi.Renderer,
  },
  updaters: UpdaterGeneratorType<GameState>,
  delta: number,
  gameState: Const<GameState>,
  appSize: Vector2
}

export class RootApplication {
  state: RootApplicationState;
  staleProps: RootApplicationProps;
  container: Pixi.Container;

  /* children */
  // Contains HUD, and other entities that don't move when game camera moves
  public fixedCameraStage: Pixi.Container;
  // Contains game entities that move when game camera pans/zooms. Highly encouraged to have further subdivions.
  public actionStage: Pixi.Container;
  // Contains a few entities that doesn't move when game camera moves, but located behind action stage entities, e.g. static backgrounds
  public backdropStage: Pixi.Container;
  public keyboard!: KeyboardState;
  public fpsTracker: FpsComponent;

  /**
   * Need to provide config to set up the pixi canvas
   */
  constructor(props: RootApplicationProps) {
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

    // // this.fpsTracker = new FpsTracker();
    // // this.app.ticker.add((delta) => {
    // //   // delta should be approximately equal to 1
    // //   this.fpsTracker.tick(delta);
    // // })

    // let textFpsHud = new Pixi.Text('', {
    //   fontFamily: 'PixelMix',
    //   fontSize: 12,
    //   // align: 'right'
    // });
    // this.app.ticker.add(() => {
    //   textFpsHud.text = this.fpsTracker.getFpsString() + " FPS\n" + this.fpsTracker.getUpsString() + " UPS\n" + 
    //   this.app.screen.width + "x" + this.app.screen.height;
    // })
    // textFpsHud.x = this.app.screen.width;
    // this.onResize.push(() => { textFpsHud.x = this.app.screen.width; });
    // textFpsHud.anchor.x = 1; // right justify

    // textFpsHud.x = 0;
    // textFpsHud.y = 0;
    // this.fixedCameraStage.addChild(textFpsHud);
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

    this.renderSelf(props);
    this.didMount(props);
  }

  public update(props: RootApplicationProps) {
    this.updateSelf(props)
    // this.keyboard.update(props);
    this.fpsTracker.update({
      delta: props.delta,
      position: new Vector2(0, 0),
      appSize: props.appSize,
    })
    this.renderSelf(props);
    this.didUpdate(props);
  }

  updateSelf(props: RootApplicationProps) {
  }
  renderSelf(props: RootApplicationProps) {
  }
  didMount(props: RootApplicationProps) {
  }
  willUnmount(props: RootApplicationProps) {
  }
  didUpdate(props: RootApplicationProps) {
  }
}

