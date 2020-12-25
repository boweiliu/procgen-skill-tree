import * as Pixi from "pixi.js";
import { Vector2 } from "../../lib/util/geometry/vector2";

type Props = {
  args: {},
  appSize: Vector2,
}
type State = {}

export class DraggableBackdropComponent {
  public container: Pixi.Graphics;
  staleProps: Props
  state: State;

  constructor(props: Props) {
    this.staleProps = props;
    this.state = {};
    this.container = new Pixi.Graphics();


  }

}