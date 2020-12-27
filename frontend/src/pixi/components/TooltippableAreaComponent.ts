import * as Pixi from "pixi.js";
import { engageLifecycle, LifecycleHandlerBase } from "./LifecycleHandler";

type Props = {}

type State = {}

class TooltippableAreaComponent extends LifecycleHandlerBase<Props, State> {
  public container: Pixi.Container;

  constructor(props: Props) {
    super(props);
    this.container = new Pixi.Container();
  }

  public renderSelf(props: Props) {

  }

  public updateSelf(props: Props) {

  }

  didMount() {

  }
}

const toExport = engageLifecycle(TooltippableAreaComponent);
export { toExport as TooltippableAreaComponent };
type exportedType = TooltippableAreaComponent;
export type { exportedType as TooltippableAreaComponentType };