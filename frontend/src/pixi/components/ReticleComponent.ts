import * as Pixi from "pixi.js";
import { PixiPointFrom } from "../../lib/pixi/pixify";
import { Vector2 } from "../../lib/util/geometry/vector2";

type Props = {
  appSize: Vector2
}

type State = {
  position: Vector2;
}

export class ReticleComponent{
  public container: Pixi.Container;
  staleProps: Props
  state: State;

  constructor(props: Props) {
    this.container = new Pixi.Container();
    this.staleProps = props;
    this.state = {
      position: props.appSize.multiply(0.5)
    };

    const outerCircle = new Pixi.Graphics();
    outerCircle.lineStyle(2, 0x000000);
    outerCircle.alpha = 0.5;
    outerCircle.drawCircle(0, 0, 16);
    outerCircle.interactive = true;
    this.container.addChild(outerCircle)
    outerCircle.moveTo(0, -8);
    outerCircle.lineTo(0, 8);
    outerCircle.moveTo(-8, 0);
    outerCircle.lineTo(8, 0);

    this.renderSelf(props);
  }

  public update(props: Props) {
    this.updateSelf(props);
    this.renderSelf(props);
    this.staleProps = props;
  }

  updateSelf(props: Props) {
    this.state.position = props.appSize.multiply(0.5);
  }
  renderSelf(props: Props) {
    this.container.position = PixiPointFrom(this.state.position);
  }


}