import * as Pixi from "pixi.js";
import { UpdaterGeneratorType2 } from "../../lib/util/updaterGenerator";
import { RenderedChunkConstants } from "./ChunkComponent";
import { engageLifecycle, LifecycleHandlerBase } from "./LifecycleHandler";

type Props = {
  args: {
    markForceUpdate: (childInstance: any) => void,
  },
  hitArea: Pixi.IHitArea;
  delaySeconds?: number;
}

type State = {
  isActive: boolean;

}

class TooltippableAreaComponent extends LifecycleHandlerBase<Props, State> {
  public state: State
  public container: Pixi.Container;
  stateUpdaters: UpdaterGeneratorType2<State>
  protected fireStateUpdaters: () => void

  public hitAreaDrawn?: Pixi.Graphics; // debug

  tooltipContainer: Pixi.Container | null;

  constructor(props: Props) {
    super(props);
    this.container = new Pixi.Container();
    this.container.interactive = true;
    this.container.buttonMode = true;
    this.container.hitArea = props.hitArea;
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
        const box = new Pixi.Graphics();
        box.lineStyle(1, 0x222222, 1);
        box.beginFill(0xEEEEEE);
        box.drawRoundedRect(0, 0, 40, 40, 4);
        this.tooltipContainer.addChild(box)
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