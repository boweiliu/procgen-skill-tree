import * as Pixi from "pixi.js";
import { engageLifecycle, LifecycleHandlerBase } from "./LifecycleHandler";

type Props = {

}

type State = {} 

class TooltipComponent extends LifecycleHandlerBase<Props, State> {
  public container: Pixi.Container;
  public state: State;

  constructor(props: Props) {
    super(props);
    this.container = new Pixi.Container();
    this.state = {};
  }

  protected renderSelf() {

  }
}

const wrapped = engageLifecycle(TooltipComponent);
// eslint-disable-next-line
type wrapped = TooltipComponent;
export { wrapped as TooltipComponent };
export type { Props as TooltipComponentProps };