import * as Pixi from "pixi.js";
import { FpsTracker } from "../../lib/util/fpsTracker";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { PixiPointFrom } from "../../lib/pixi/pixify";
import { engageLifecycle, LifecycleHandlerBase } from "./LifecycleHandler";

type Props = {
  delta: number;
  position: Vector2;
  appSize: Vector2;
}

type State = {
  fpsTracker: FpsTracker
}

// export class FpsComponent {
//   public container: Pixi.Text;
//   staleProps: Props;
//   state: State;

//   constructor(props: Props) {
//     this.container = new Pixi.Text('', {
//       fontFamily: 'PixelMix',
//       fontSize: 12,
//       // align: 'right'
//     });
//     this.state = {
//       fpsTracker: new FpsTracker()
//     };
//     this.staleProps = props;

//     this.renderSelf(props)
//   }

//   public update(props: Props) {
//     this.updateSelf(props);
//     this.renderSelf(props);
//   }

//   updateSelf(props: Props) {
//     this.state.fpsTracker.tick(props.delta);
//   }
//   renderSelf(props: Props) {
//     this.container.text = this.state.fpsTracker.getFpsString() + " FPS\n" +
//       this.state.fpsTracker.getUpsString() + " UPS\n" +
//       props.appSize.x + "x" + props.appSize.y;
//     this.container.position = PixiPointFrom(props.position);
//   }
// }

class FpsComponent extends LifecycleHandlerBase<Props, State> {
  public container: Pixi.Text;
  public state: State;

  constructor(props: Props) {
    super(props);
    this.container = new Pixi.Text('', {
      fontFamily: 'PixelMix',
      fontSize: 12,
      // align: 'right'
    });
    this.state = {
      fpsTracker: new FpsTracker()
    };
  }

  protected updateSelf(props: Props) {
    this.state.fpsTracker.tick(props.delta);
  }

  protected renderSelf(props: Props) {
    this.container.text = this.state.fpsTracker.getFpsString() + " FPS\n" +
      this.state.fpsTracker.getUpsString() + " UPS\n" +
      props.appSize.x + "x" + props.appSize.y;
    this.container.position = PixiPointFrom(props.position);
  }
}

const wrapped = engageLifecycle(FpsComponent);
// eslint-disable-next-line
type wrapped = FpsComponent;
export { wrapped as FpsComponent };