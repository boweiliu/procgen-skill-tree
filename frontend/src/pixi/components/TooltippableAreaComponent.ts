import * as Pixi from "pixi.js";
import { engageLifecycle, LifecycleHandlerBase } from "./LifecycleHandler";

type Props = {
  hitArea: Pixi.IHitArea;
  delaySeconds?: number;
}

type State = {

}

class TooltippableAreaComponent extends LifecycleHandlerBase<Props, State> {
  public container: Pixi.Container;

  constructor(props: Props) {
    super(props);
    this.container = new Pixi.Container();
    this.container.interactive = true;
    this.container.hitArea = props.hitArea;
  }

  public renderSelf(props: Props) {

  }

  public updateSelf(props: Props) {

  }

  didMount() {
    this.container.addListener('pointerover', (event: Pixi.InteractionEvent) => {
      console.log('got here in toolltippable');
    })
  }
}

const toExport = engageLifecycle(TooltippableAreaComponent);
export { toExport as TooltippableAreaComponent };
type exportedType = TooltippableAreaComponent;
export type { exportedType as TooltippableAreaComponentType };