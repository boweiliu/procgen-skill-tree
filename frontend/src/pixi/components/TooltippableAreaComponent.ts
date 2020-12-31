import * as Pixi from "pixi.js";
import { PixiPointFrom } from "../../lib/pixi/pixify";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { UpdaterGeneratorType2 } from "../../lib/util/updaterGenerator";
import { engageLifecycle, LifecycleHandlerBase } from "./LifecycleHandler";

type Props = {
  args: {
    markForceUpdate: (childInstance: any) => void,
  },
  hitArea: Pixi.IHitArea;
  text: string;
  delaySeconds?: number;
}

type State = {
  isActive: boolean;

}

/**
 * For a interesting reference implementation, see https://www.iwm-tuebingen.de/iwmbrowser/lib/pixi/button.html
 */
class TooltippableAreaComponent extends LifecycleHandlerBase<Props, State> {
  public state: State
  public container: Pixi.Container;
  private stateUpdaters: UpdaterGeneratorType2<State>
  protected fireStateUpdaters: () => void

  public hitAreaDrawn?: Pixi.Graphics; // debug

  tooltipContainer: Pixi.Container | null;

  constructor(props: Props) {
    super(props);
    this.container = new Pixi.Container();
    this.container.interactive = true;
    this.container.buttonMode = true;
    this.container.hitArea = props.hitArea;
    this.container.zIndex = 2;
    // this.container.hitArea = new Pixi.Rectangle(
    //   - RenderedChunkConstants.NODE_HITAREA_PX / 2,
    //   - RenderedChunkConstants.NODE_HITAREA_PX / 2,
    //   RenderedChunkConstants.NODE_HITAREA_PX,
    //   RenderedChunkConstants.NODE_HITAREA_PX,
    // );
    // this.hitAreaDrawn = new Pixi.Graphics();
    // this.hitAreaDrawn.beginFill(0xffffff);
    // this.hitAreaDrawn.drawRect(
    //   - RenderedChunkConstants.NODE_HITAREA_PX / 2,
    //   - RenderedChunkConstants.NODE_HITAREA_PX / 2,
    //   RenderedChunkConstants.NODE_HITAREA_PX,
    //   RenderedChunkConstants.NODE_HITAREA_PX,
    // );
    // this.container.addChild(this.hitAreaDrawn);

    this.tooltipContainer = null;

    ({ state: this.state, stateUpdaters: this.stateUpdaters, fireStateUpdaters: this.fireStateUpdaters } =
      this.useState<State, TooltippableAreaComponent>(this, {
        isActive: false
      }));
  }

  protected renderSelf(props: Props) {
    // if (this.state.isActive) {
    //   this.hitAreaDrawn.tint = 0x888888;
    // } else {
    //   this.hitAreaDrawn.tint = 0xffffff;
    // }

    if (this.state.isActive) {
      if (this.tooltipContainer === null) {
        // if doesnt exist, construct it
        this.tooltipContainer = new Pixi.Container();
        this.tooltipContainer.sortableChildren = true;

        const text = new Pixi.Text(props.text, {
          fontFamily: 'PixelMix',
          padding: 4, // https://github.com/pixijs/pixi.js/issues/4500 -- otherwise on first load the text bounding box is calculated to be too small and the tops of the f's get cut off
          fontSize: 26, // use 26 then scale down 50% results in sharper letters than 13
          // align: 'center'
        });
        text.scale = PixiPointFrom(new Vector2(0.5, 0.5));
        text.x = 10;
        text.y = 10;
        text.zIndex = 1;
        this.tooltipContainer.addChild(text);

        const box = new Pixi.Graphics();
        box.lineStyle(1, 0x222222, 1);
        box.beginFill(0xEEEEEE);
        box.drawRoundedRect(0, 0, text.width + 18, text.height + 18, 4);
        box.zIndex = 0;
        this.tooltipContainer.addChild(box);

        this.container.addChild(this.tooltipContainer);
      }
    } else {
      if (this.tooltipContainer) {
        // remove it
        this.container.removeChild(this.tooltipContainer);
        this.tooltipContainer.destroy();
        this.tooltipContainer = null;
      }
    }
  }

  protected didMount() {
    // TODO(bowei): move these listeners to the parent so that hitArea can be unified
    // TODO(bowei): move this object to somewhere else in pixi e.g. the parent hud layer to resolve hiding issues
    // using worldtransform: https://www.html5gamedevs.com/topic/12774-absolute-position-of-displayobjectsspritesprimitives/
    this.container.addListener('pointerover', this.onPointerOver);
    this.container.addListener('pointerout', this.onPointerOut);
  }

  public onPointerOver = (event: Pixi.InteractionEvent) => {
    // console.log('got onPointerOver in toolltippable');
    this._staleProps.args.markForceUpdate(this);
    this.stateUpdaters.isActive.enqueueUpdate(() => {
      // console.log('fired onPointerOver in toolltippable');
      return true;
    });
  }

  public onPointerOut = (event: Pixi.InteractionEvent) => {
    this._staleProps.args.markForceUpdate(this);
    // console.log('got onPointerOut in tooltippable')
    this.stateUpdaters.isActive.enqueueUpdate(() => {
      // console.log('fired onPointerOut in tooltippable')
      return false;
    });
  }
}

const wrapped = engageLifecycle(TooltippableAreaComponent);
// eslint-disable-next-line
type wrapped = TooltippableAreaComponent;
export { wrapped as TooltippableAreaComponent };
export type { Props as TooltippableAreaComponentProps };