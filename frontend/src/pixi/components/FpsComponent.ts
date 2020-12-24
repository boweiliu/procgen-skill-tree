import * as Pixi from "pixi.js";
import { FpsTracker } from "../../lib/util/fpsTracker";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { PixiPointFrom } from "../../lib/pixi/pixify";

type FpsComponentProps = {
  delta: number;
  position: Vector2;
  appSize: Vector2;
}

export class FpsComponent {
  public container: Pixi.Text;
  staleProps: FpsComponentProps;
  state: FpsTracker;

  constructor(props: FpsComponentProps) {
    this.container = new Pixi.Text('', {
      fontFamily: 'PixelMix',
      fontSize: 12,
      // align: 'right'
    });
    this.state = new FpsTracker();
    this.staleProps = props;

    this.renderSelf(props)
  }

  public update(props: FpsComponentProps) {
    this.updateSelf(props);
    this.renderSelf(props);
  }

  updateSelf(props: FpsComponentProps) {
    this.state.tick(props.delta);
  }
  renderSelf(props: FpsComponentProps) {
    this.container.text = this.state.getFpsString() + " FPS\n" + this.state.getUpsString() + " UPS\n" +
      props.appSize.x + "x" + props.appSize.y;
    this.container.position = PixiPointFrom(props.position);
  }
}