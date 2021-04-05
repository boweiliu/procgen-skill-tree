import * as Pixi from 'pixi.js';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { engageLifecycle, LifecycleHandlerBase } from './LifecycleHandler';

type Props = {
  args: {};
  appSize: Vector2;
};
type State = {};

class DraggableBackdropComponent extends LifecycleHandlerBase<Props, State> {
  public container: Pixi.Graphics;
  public state: State;

  constructor(props: Props) {
    super(props);
    this.state = {};
    this.container = new Pixi.Graphics();
  }

  protected renderSelf() {}
}

const wrapped = engageLifecycle(DraggableBackdropComponent);
// eslint-disable-next-line
type wrapped = DraggableBackdropComponent;
export { wrapped as DraggableBackdropComponent };
