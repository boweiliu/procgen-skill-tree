import * as Pixi from "pixi.js";
import { PixiPointFrom } from "../../lib/pixi/pixify";
import { Vector2 } from "../../lib/util/geometry/vector2";
import COLORS from "../colors";
import { engageLifecycle, LifecycleHandlerBase } from "./LifecycleHandler";

type Props = {
  appSize: Vector2
}

type State = {
  position: Vector2;
}

class ReticleComponent extends LifecycleHandlerBase<Props, State> {
  public container: Pixi.Container;
  public state: State;

  constructor(props: Props) {
    super(props);
    this.container = new Pixi.Container();
    this.state = {
      position: props.appSize.multiply(0.5)
    };

    const outerCircle = new Pixi.Graphics();
    outerCircle.lineStyle(2, COLORS.black);
    outerCircle.alpha = 0.5;
    outerCircle.drawCircle(0, 0, 16);
    outerCircle.interactive = true;
    this.container.addChild(outerCircle)
    outerCircle.moveTo(0, -8);
    outerCircle.lineTo(0, 8);
    outerCircle.moveTo(-8, 0);
    outerCircle.lineTo(8, 0);
  }

  protected updateSelf(props: Props) {
    this.state.position = props.appSize.multiply(0.5);
  }
  protected renderSelf(props: Props) {
    this.container.position = PixiPointFrom(this.state.position);
  }
}

const wrapped = engageLifecycle(ReticleComponent);
// eslint-disable-next-line
type wrapped = ReticleComponent;
export { wrapped as ReticleComponent };