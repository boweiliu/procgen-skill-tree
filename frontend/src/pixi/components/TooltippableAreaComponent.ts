import * as Pixi from "pixi.js";
import { UpdaterGeneratorType2 } from "../../lib/util/updaterGenerator";
import { RenderedChunkConstants } from "./ChunkComponent";
import { engageLifecycle, LifecycleHandlerBase } from "./LifecycleHandler";

type Props = {
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
  fireStateUpdaters: () => void

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
      super.useState({
        isActive: false
      }));
  }

  public renderSelf(props: Props) {
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
        box.lineStyle(2, 0xeeeeee, 1);
        box.beginFill(0x222222);
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

  public updateSelf(props: Props) {
    // console.log('tooltippable updated itself');
  }

  didMount() {
    this.container.addListener('pointerover', this.onPointerOver);
    this.container.addListener('pointerout', this.onPointerOut);
  }

  private onPointerOver = (event: Pixi.InteractionEvent) => {
    console.log('got onPointerOver in toolltippable');
    this.stateUpdaters.isActive.enqueueUpdate(() => {
      console.log('fired onPointerOver in toolltippable');
      return true;
    });
  }
  private onPointerOut = (event: Pixi.InteractionEvent) => {
    console.log('got onPointerOut in tooltippable')
    this.stateUpdaters.isActive.enqueueUpdate(() => {
      console.log('fired onPointerOut in tooltippable')
      return false;
    });
  }

  willUnmount() { }
  shouldUpdate(): boolean { return true; } 
  didUpdate() { }

}

const toExport = engageLifecycle(TooltippableAreaComponent);
export { toExport as TooltippableAreaComponent };
type exportedType = TooltippableAreaComponent;
export type { exportedType as TooltippableAreaComponentType };
export type { Props as TooltippableAreaComponentProps };