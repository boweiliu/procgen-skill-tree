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
  public container: Pixi.Graphics;
  staleProps: Props
  state: State;

  constructor(props: Props) {
    this.container = new Pixi.Graphics();
    this.staleProps = props;
    this.state = {
      position: props.appSize.multiply(0.5)
    };

    this.container.lineStyle(2, 0x999999);
    this.container.drawCircle(0, 0, 6);
    this.container.interactive = true;
    this.container.buttonMode = true;

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