import * as Pixi from "pixi.js";
import { PixiPointFrom } from "../../lib/pixi/pixify";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { engageLifecycle, LifecycleHandlerBase } from "./LifecycleHandler";


export type TooltipInfo = {
  text: string;
  position: Vector2 | undefined; // should be nonnull if visible === true
  visible: boolean;
}

type Props = {
  offset: Vector2,
} & TooltipInfo;

type State = {} 

class TooltipComponent extends LifecycleHandlerBase<Props, State> {
  public container: Pixi.Container;
  public state: State;

  private text: Pixi.Text;
  private box?: Pixi.Graphics;

  constructor(props: Props) {
    super(props);
    this.container = new Pixi.Container();
    this.container.sortableChildren = true;
    this.state = {};

    this.text = new Pixi.Text(props.text, {
      fontFamily: 'PixelMix',
      padding: 4, // https://github.com/pixijs/pixi.js/issues/4500 -- otherwise on first load the text bounding box is calculated to be too small and the tops of the f's get cut off
      fontSize: 26, // use 26 then scale down 50% results in sharper letters than 13
      // align: 'center'
    });
    this.text.scale = PixiPointFrom(new Vector2(0.5, 0.5));
    this.text.x = 10;
    this.text.y = 10;
    this.text.zIndex = 2;
    this.container.addChild(this.text);

    // this.box = new Pixi.Graphics();

    // this.box.lineStyle(1, 0x222222, 1);
    // this.box.beginFill(0xEEEEEE);
    // this.box.drawRoundedRect(0, 0, this.text.width + 18, this.text.height + 18, 4);
    // this.box.zIndex = 0;
    // this.container.addChild(this.box);
  }

  protected shouldUpdate(prevProps: Props, prevState: State, props: Props, state: State): boolean {
    for (let key of (Object.keys(prevProps) as (keyof Props)[])) {
      if (prevProps[key] !== props[key]) {
        return true;
      }
    }
    return false;
  }

  protected renderSelf(props: Props) {
    this.container.visible = props.visible;
    this.container.position = PixiPointFrom(props.offset.add(props?.position || Vector2.Zero));
    this.text.text = props.text;

    if (this.box) {
      this.container.removeChild(this.box);
    }

    this.box = new Pixi.Graphics();
    this.box.lineStyle(1, 0x222222, 1);
    this.box.beginFill(0xEEEEEE);
    this.box.drawRoundedRect(0, 0, this.text.width + 18, this.text.height + 18, 4);
    this.box.zIndex = 0;
    this.container.addChild(this.box);
  }
}

const wrapped = engageLifecycle(TooltipComponent);
// eslint-disable-next-line
type wrapped = TooltipComponent;
export { wrapped as TooltipComponent };
export type { Props as TooltipComponentProps };