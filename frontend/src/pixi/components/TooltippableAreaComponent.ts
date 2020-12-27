import * as Pixi from "pixi.js";
import { UpdaterGeneratorType2 } from "../../lib/util/updaterGenerator";
import { engageLifecycle, LifecycleHandlerBase } from "./LifecycleHandler";

type Props = {
  hitArea: Pixi.IHitArea;
  delaySeconds?: number;
}

type State = {

}

class TooltippableAreaComponent extends LifecycleHandlerBase<Props, State> {
  public state: State
  public container: Pixi.Container;
  stateUpdaters: UpdaterGeneratorType2<State>

  constructor(props: Props) {
    super(props);
    this.container = new Pixi.Container();
    this.container.interactive = true;
    this.container.hitArea = props.hitArea;

    ({ state: this.state, stateUpdaters: this.stateUpdaters, fireStateUpdaters: this.fireStateUpdaters } =
      super.useState({}));
  }

  public renderSelf(props: Props) {
    // create a box

  }

  public updateSelf(props: Props) {
  }

  didMount() {
    this.container.addListener('pointerover', this.onPointerOver);
    this.container.addListener('pointerout', this.onPointerOut);
  }

  private onPointerOver = (event: Pixi.InteractionEvent) => {
      console.log('got here in toolltippable');
  }
  private onPointerOut = (event: Pixi.InteractionEvent) => {
      console.log('got here in toolltippable');
  }

  willUnmount() { }
  fireStateUpdaters() { this.fireStateUpdaters(); }
  shouldUpdate(): boolean { return true; } 
  didUpdate() { }

}

const toExport = engageLifecycle(TooltippableAreaComponent);
export { toExport as TooltippableAreaComponent };
type exportedType = TooltippableAreaComponent;
export type { exportedType as TooltippableAreaComponentType };