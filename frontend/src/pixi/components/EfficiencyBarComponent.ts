import * as Pixi from "pixi.js";
import { PixiPointFrom } from "../../lib/pixi/pixify";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { engageLifecycle, LifecycleHandlerBase } from "./LifecycleHandler";

type Props = {
  args: {},
  updaters: {},
  delta: number,
  tick: number,
  position: Vector2,
  efficiencyPercent: number // needs to be between 0 and 100
}

type State = {}

/**
 * Reference code for pixi gradient or blur filters:
 * https://github.com/pixijs/pixi.js/blob/dev/packages/filters/filter-blur/src/generateBlurFragSource.ts
 * https://github.com/pixijs/pixi.js/blob/dev/packages/filters/filter-blur/src/BlurFilterPass.ts
 * https://github.com/pixijs/pixi.js/tree/dev/packages/filters/filter-blur/src
 * https://pixijs.download/dev/docs/PIXI.Filter.html
 * https://github.com/pixijs/pixi-filters/blob/main/filters/radial-blur/src/RadialBlurFilter.js
 * https://github.com/pixijs/pixi-filters/blob/main/filters/radial-blur/src/radial-blur.frag
 * https://filters.pixijs.download/main/docs/index.html
 * https://www.html5gamedevs.com/topic/8424-how-to-blur-just-an-area/
 * https://www.html5gamedevs.com/topic/25539-create-gradient-filter-on-sprite/
 * https://filters.pixijs.download/main/docs/index.html
 * https://pixijs.io/examples/#/textures/gradient-resource.js
 * 
 */
class EfficiencyBarComponent extends LifecycleHandlerBase<Props, State> {
  public container: Pixi.Container;
  public outerBar: Pixi.Graphics;
  public innerBar: Pixi.Graphics;
  public innerBar2: Pixi.Graphics;
  public filter: Pixi.filters.BlurFilter;
  public titleText: Pixi.Text;
  public barFill: Pixi.Graphics;
  public mask: Pixi.Graphics;

  constructor(props: Props) {
    super(props);
    this.container = new Pixi.Container();
    this.container.sortableChildren = true;

    // object documentation: https://pixijs.download/dev/docs/PIXI.TextStyle.html
    const style: Partial<Pixi.TextStyle> = {
      fontFamily: 'PixelMix',
      padding: 4, // https://github.com/pixijs/pixi.js/issues/4500 -- otherwise on first load the text bounding box is calculated to be too small and the tops of the f's get cut off
      fontSize: 26, // use 26 then scale down 50% results in sharper letters than 13
      // align: 'center'
    };
    this.titleText = new Pixi.Text('Efficiency', style);
    this.titleText.scale = PixiPointFrom(new Vector2(0.5, 0.5));
    this.titleText.anchor = PixiPointFrom(new Vector2(0.5, 0.0));
    this.titleText.zIndex = 0;
    this.titleText.x = 50;
    this.titleText.y = 4;
    this.container.addChild(this.titleText);

    this.outerBar = new Pixi.Graphics();
    this.outerBar.beginFill(0xDDEEFF);
    this.outerBar.drawRoundedRect(0, 0, 100, 236, 10);
    this.outerBar.zIndex = -1;
    this.outerBar.alpha = .9;
    this.filter = new Pixi.filters.BlurFilter();
    // this.outerBar.filters = [this.filter];
    this.container.addChild(this.outerBar);
    this.filter.blur = 8;

    this.innerBar = new Pixi.Graphics();
    this.innerBar.lineStyle(2, 0x000000, 1);
    this.innerBar.beginFill(0xFFFFFF);
    this.innerBar.drawRoundedRect(0, 0, 40, 200, 10);
    // this.innerBar.x = 12;
    this.innerBar.pivot.x = 20;
    this.innerBar.x = 50;
    this.innerBar.y = 24;
    this.innerBar.zIndex = 3;
    this.container.addChild(this.innerBar);

    this.barFill = new Pixi.Graphics();
    // source: https://www.schemecolor.com/red-orange-green-gradient.php
    this.barFill.beginFill(0x69B34C);
    this.barFill.drawRect(0, 0, 40, 40);
    this.barFill.beginFill(0xACB334);
    this.barFill.drawRect(0, 40, 40, 40);
    this.barFill.beginFill(0xFAB733);
    this.barFill.drawRect(0, 80, 40, 40);
    this.barFill.beginFill(0xFF8E15);
    this.barFill.drawRect(0, 120, 40, 40);
    this.barFill.beginFill(0xFF4E11);
    this.barFill.drawRect(0, 160, 40, 40);
    this.barFill.pivot.x = 20;
    this.barFill.x = 50;
    this.barFill.y = 24;
    this.barFill.zIndex = 4;
    // this.barFill.filters = [this.filter];
    this.mask = new Pixi.Graphics();
    this.mask.beginFill(0x000000, 1);
    this.mask.drawRoundedRect(0, 0, 40, 200, 10);
    this.mask.zIndex = 30;
    this.mask.pivot.x = 20; // left-right center in ourselves
    this.mask.x = 50; // center in the outerBar
    this.mask.y = 24; // mask y starts at 24, the same as inner bar, and goes till 224
    this.container.addChild(this.mask);
    this.barFill.mask = this.mask;

    this.innerBar2 = new Pixi.Graphics();
    this.innerBar2.lineStyle(2, 0x000000, 1);
    this.innerBar2.beginFill(0xFFFFFF, 0);
    this.innerBar2.drawRoundedRect(0, 0, 40, 200, 10);
    this.innerBar2.pivot.x = 20;
    this.innerBar2.x = 50;
    this.innerBar2.y = 24;
    this.innerBar2.zIndex = 7;
    this.container.addChild(this.innerBar2);


    this.container.addChild(this.barFill);

  }

  public renderSelf(props: Props) {
    this.container.position = PixiPointFrom(props.position);
    // console.log({ style: this.titleText.style });
    if (props.tick < 60 && props.tick % 10 === 5) { // poll for document webfonts loaded; TODO, substitute for listening to actual fonts ready event
      this.titleText.updateText(false); // false == force reload text even when text has not changed. needed to get new fonts
    }
    this.mask.y = (100 - props.efficiencyPercent) * 2 + 24;
    // this.mask.width -= props.delta / 2;
    // this.mask.height -= props.delta / 10;
  }

  public updateSelf(props: Props) {
  }
}

const toExport = engageLifecycle(EfficiencyBarComponent);
export { toExport as EfficiencyBarComponent };
type exportedType = EfficiencyBarComponent;
export type { exportedType as EfficiencyBarComponentType };