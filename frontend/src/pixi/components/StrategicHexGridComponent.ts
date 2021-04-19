import * as Pixi from 'pixi.js';
import { PixiPointFrom } from '../../lib/pixi/pixify';
import { Vector2 } from '../../lib/util/geometry/vector2';
import COLORS from '../colors';
import { engageLifecycle, LifecycleHandlerBase } from './LifecycleHandler';

type Props = {
  args: {
    position: Vector2;
  };
  appSize: Vector2;
};

type State = {};

class StrategicHexGridComponent extends LifecycleHandlerBase<Props, State> {
  public container: Pixi.Container;
  public state: State;
  private graphics: Pixi.Graphics;

  constructor(props: Props) {
    super(props);
    this.state = {
      numClicks: 0,
      descriptionText: '',
    };
    this.updateSelf(props);
    this.container = new Pixi.Container();

    // test graphics
    this.graphics = new Pixi.Graphics();
    this.graphics.beginFill(COLORS.white);
    // g.drawCircle(0, 0, 4);
    this.graphics.drawRect(-6, -10, 12, 20);
    this.graphics.visible = false;
    this.container.addChild(this.graphics);
  }

  protected updateSelf(props: Props) {}

  protected renderSelf(props: Props) {
    this.container.position = PixiPointFrom(props.args.position);
    this.graphics.position = PixiPointFrom(props.appSize.divide(2));
  }

  protected shouldUpdate(
    staleProps: Props,
    staleState: State,
    props: Props,
    state: State
  ): boolean {
    for (let key of Object.keys(staleProps) as (keyof Props)[]) {
      // if (key === 'delta' || key === 'args' || key === 'updaters') {
      if (key === 'args') {
        continue;
      }
      if (staleProps[key] !== props[key]) {
        console.log(`hexgrid shouldUpdate differed in ${key}, returning true`);
        return true;
      }
    }
    return false;
  }
}

const wrapped = engageLifecycle(StrategicHexGridComponent);
// eslint-disable-next-line
type wrapped = StrategicHexGridComponent;
export { wrapped as StrategicHexGridComponent };
export type { Props as StrategicHexGridComponentProps };
