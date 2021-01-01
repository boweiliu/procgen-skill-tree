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
  efficiencyPercent: number, // needs to be between 0 and 100
  questProgressPercent: number,
}

type State = {}

type ContainerWithPadding = {
  container: Pixi.Container;
  width: number;
  height: number;
}

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
  public state: State = {}

  private defaultPadding: number = 8;
  private cornerRadius: number = 10;

  private boundingBoxWidth: number = 100;
  // public backpanel: Pixi.Graphics;

  private innerBarWidth: number = 24;
  private innerBarHeight: number = 200;
  private textHeight: number = 24; // observed height of the title text, including padding at the top of the text
  private paddingBottom: number = 12;
  public whiteBarBody: Pixi.Graphics;
  public barBorder: Pixi.Graphics;
  public filter!: Pixi.filters.BlurFilter;
  public barFill: Pixi.Graphics;
  public mask: Pixi.Graphics;
    // object documentation: https://pixijs.download/dev/docs/PIXI.TextStyle.html

  public titleText!: Pixi.Text;
  private textStyle: Partial<Pixi.TextStyle> = {
    fontFamily: 'PixelMix',
    padding: 4, // https://github.com/pixijs/pixi.js/issues/4500 -- otherwise on first load the text bounding box is calculated to be too small and the tops of the f's get cut off
    fontSize: 26, // use 26 then scale down 50% results in sharper letters than 13
    // align: 'center'
  };

  private textToReload: Pixi.Text[] = [];

  private makeBackpanel(x: number, y: number, width: number, height: number) : Pixi.Graphics {
    const backpanel = new Pixi.Graphics();
    backpanel.beginFill(0xDDEEFF); // background color is the blue AACCEE, this is very light bluer than that
    backpanel.drawRoundedRect(0, 0, width, height, this.cornerRadius);
    // outerbar = the box containing the efficiency text + bar. 100px is just enough width for the word "Efficiency". 236px height was chosen arbitrarily
    backpanel.zIndex = -1;
    backpanel.alpha = .8; // let a bit of the background poke through. TODO: actually blur the background?? cant figure out how to do it

    backpanel.x = x;
    backpanel.y = y;
    return backpanel;
  }

  private makeRainbowDirtyFill(x: number, y: number, width: number, height: number, padding: number = this.defaultPadding): ContainerWithPadding {
    const colors = [0x69B34C, 0xACB334, 0xFAB733, 0xFF8E15, 0xFF4E11].reverse();
    return this.makeAnyColorFill(x, y, width, height, padding, colors);
  }

  private makeGrayDirtyFill(x: number, y: number, width: number, height: number, padding: number = this.defaultPadding): ContainerWithPadding {
    const colors = [0x9999bb];
    return this.makeAnyColorFill(x, y, width, height, padding, colors);
  }

  private makeAnyColorFill(x: number, y: number, width: number, height: number, padding: number, colors: number[]): ContainerWithPadding {
    const dirtyFill = new Pixi.Container();

    const fixedMask = new Pixi.Graphics();
    fixedMask.beginFill(0x000000, 1); // color and alpha literally dont matter cuz its a mmask
    fixedMask.drawRoundedRect(0, 0, width, height, this.cornerRadius); // same dims as the inner bar. note that this doesnt take into account the line style of width 2, so it will cause the filling to leak over into the line style. to fix this barBorder is reapplied over the top to cover the leaks.
    fixedMask.zIndex = 31; // doesnt matter

    const barFill = new Pixi.Graphics();
    // const colors = [0x69B34C, 0xACB334, 0xFAB733, 0xFF8E15, 0xFF4E11].reverse();
    const colorsLen = colors.length;
    colors.forEach((color, idx) => {
      barFill.beginFill(color);
      barFill.drawRect(width * idx / colorsLen, 0, width / colorsLen, height);
    })
    barFill.mask = fixedMask;
    dirtyFill.addChild(barFill);
    dirtyFill.addChild(fixedMask);

    dirtyFill.x = x + padding;
    dirtyFill.y = y + padding;
    return {
      container: dirtyFill,
      width: dirtyFill.width + 2 * padding,
      height: dirtyFill.height + 2 * padding,
    };
  }

  private makeEfficiencyText(x: number, y: number, padding: number = this.defaultPadding): ContainerWithPadding {
    const labelText = new Pixi.Text('Efficiency', {
      fontFamily: 'PixelMix',
      padding: 4, // https://github.com/pixijs/pixi.js/issues/4500 -- otherwise on first load the text bounding box is calculated to be too small and the tops of the f's get cut off
      fontSize: 26, // use 26 then scale down 50% results in sharper letters than 13
      // align: 'center'
    });
    // "Efficiency": dims = (54, 14.5) -> (91, 14.5) upon rerender ; ratio === 1.685
    labelText.anchor = PixiPointFrom(new Vector2(0.5, 0.5));
    labelText.scale = PixiPointFrom(new Vector2(0.5, 0.5));
    labelText.x = x + padding + 140 / 2;
    // labelText.y = y + padding + 16 / 2 - 14.5 / 2;
    labelText.y = y + padding + 16 / 2;
    // labelText.y = y;
    this.textToReload.push(labelText);
    return {
      container: labelText,
      width: 140 + 2 * padding,
      height: 16 + 2 * padding,
    };
  }

  private makeQuestProgressText(x: number, y: number, padding: number = this.defaultPadding): ContainerWithPadding {
    const labelText = new Pixi.Text('Quest Progress', {
      fontFamily: 'PixelMix',
      padding: 4, // https://github.com/pixijs/pixi.js/issues/4500 -- otherwise on first load the text bounding box is calculated to be too small and the tops of the f's get cut off
      fontSize: 26, // use 26 then scale down 50% results in sharper letters than 13
      align: 'center'
    });
    // "Quest Progress": dims = (78.5, 14.5) -> (135, 14.5) upon rerender ; ratio === 1.685
    labelText.anchor = PixiPointFrom(new Vector2(0.5, 0.5));
    labelText.scale = PixiPointFrom(new Vector2(0.5, 0.5));
    // labelText.x = x + padding + 140 / 2 - 135 / 2;
    labelText.x = x + padding + 140 / 2;
    // labelText.y = y + padding + 16 / 2 - 14.5 / 2;
    labelText.y = y + padding + 16 / 2;
    // labelText.y = y;
    this.textToReload.push(labelText);
    return {
      container: labelText,
      width: 140 + 2 * padding,
      height: 16 + 2 * padding,
    };
  }

  constructor(props: Props) {
    super(props);
    this.container = new Pixi.Container();
    this.container.interactive = true;
    this.container.sortableChildren = true;

    // this.container.addChild(this.makeBackpanel(0, 0, 400, 100));

    const text1 = this.makeEfficiencyText(0, 4);
    // text1.visible = false;
    this.container.addChild(text1.container);

    const efficiencyBar = this.makeRainbowDirtyFill(text1.width - this.defaultPadding, 0, 200, 24);
    this.container.addChild(efficiencyBar.container);

    const text2 = this.makeQuestProgressText(0, efficiencyBar.height + 4 - this.defaultPadding);
    // text2.visible = false;
    this.container.addChild(text2.container);


    // this.container.addChild(this.makeSingleColorDirtyFill(text1.width * 1.685 + 8, text1.height / 2 + 4, 200, 15));
    // this.container.addChild(this.makeSingleColorDirtyFill(text2.width * 1.720 + 8, text1.height / 2 + 4, 200, 15));
    // this.container.addChild(this.makeSingleColorDirtyFill(text2.width * 1.720 + 8, (text1.height + 8) + text2.height / 2 + 4 , 200, 15));
    const progressBar = this.makeGrayDirtyFill(text1.width - this.defaultPadding, efficiencyBar.height - this.defaultPadding, 200, 24);
    this.container.addChild(progressBar.container);
    
    this.container.addChild(this.makeBackpanel(0, 0, text1.width + efficiencyBar.width - this.defaultPadding,
      efficiencyBar.height + progressBar.height - this.defaultPadding
    ));

    // this.titleText = new Pixi.Text('Efficiency', this.textStyle);
    // this.titleText.scale = PixiPointFrom(new Vector2(0.5, 0.5));
    // this.titleText.anchor = PixiPointFrom(new Vector2(0.5, 0.0)); // center ourselves, left-right
    // this.titleText.zIndex = 0;
    // this.titleText.x = 50; // full container width is 100, we want to be in the middle
    // this.titleText.y = 4; // bit of padding for the top
    // this.container.addChild(this.titleText);


    this.whiteBarBody = new Pixi.Graphics();
    this.whiteBarBody.beginFill(0xFFFFFF);
    this.whiteBarBody.drawRoundedRect(0, 0, this.innerBarWidth, this.innerBarHeight, this.cornerRadius); // we want the inner bar (containing the actual efficiency colors) to be 40 wide and 200 tall. round the corners at the same radius as the outer box.
    // this.whiteBarBody.x = 12;
    this.whiteBarBody.pivot.x = this.innerBarWidth/2; // this is our width over 2
    this.whiteBarBody.x = this.boundingBoxWidth/2; // this is outer bar width / 2
    this.whiteBarBody.y = this.textHeight; // this is just enough space below the "Efficiency" text to look nice
    this.whiteBarBody.zIndex = 3;
    // this.container.addChild(this.whiteBarBody);

    // rainbow red-green gradient for the contents of the inner bar
    const barFillContainer = new Pixi.Container();
    this.barFill = new Pixi.Graphics();
    // source: https://www.schemecolor.com/red-orange-green-gradient.php
    this.barFill.beginFill(0x69B34C);
    this.barFill.drawRect(0, 0, this.innerBarWidth, this.innerBarHeight/5);
    this.barFill.beginFill(0xACB334);
    this.barFill.drawRect(0, 40, this.innerBarWidth, this.innerBarHeight/5);
    this.barFill.beginFill(0xFAB733);
    this.barFill.drawRect(0, 80, this.innerBarWidth, this.innerBarHeight/5);
    this.barFill.beginFill(0xFF8E15);
    this.barFill.drawRect(0, 120, this.innerBarWidth, this.innerBarHeight/5);
    this.barFill.beginFill(0xFF4E11);
    this.barFill.drawRect(0, 160, this.innerBarWidth, this.innerBarHeight/5);
    this.barFill.pivot.x = this.innerBarWidth / 2;
    this.barFill.x = this.boundingBoxWidth / 2;
    this.barFill.y = this.textHeight; // same positioning as innerBar
    this.barFill.zIndex = 4;
    // this.container.addChild(this.barFill);
    barFillContainer.addChild(this.barFill);
    barFillContainer.zIndex = 4;
    // this.container.addChild(barFillContainer);

    // this.barFill.filters = [this.filter];
    // mask controls how much of the red-green gradient fillings are visible, depending on how well the player is doing
    const maskContainer = new Pixi.Container();
    // this mask moves up and down
    this.mask = new Pixi.Graphics();
    this.mask.beginFill(0x000000, 1); // color and alpha literally dont matter cuz its a mmask
    this.mask.drawRoundedRect(0, 0, this.innerBarWidth, this.innerBarHeight, this.cornerRadius); // same dims as the inner bar. note that this doesnt take into account the line style of width 2, so it will cause the filling to leak over into the line style. to fix this barBorder is reapplied over the top to cover the leaks.
    this.mask.zIndex = 30; // doesnt matter
    this.mask.pivot.x = this.innerBarWidth/2; // left-right center in ourselves
    this.mask.x = this.boundingBoxWidth/2; // center in the boundingBox
    this.mask.y = this.textHeight; // same positioning as inner bar

    // this mask does not
    const fixedMask = new Pixi.Graphics();
    fixedMask.beginFill(0x000000, 1); // color and alpha literally dont matter cuz its a mmask
    fixedMask.drawRoundedRect(0, 0, this.innerBarWidth, this.innerBarHeight, this.cornerRadius); // same dims as the inner bar. note that this doesnt take into account the line style of width 2, so it will cause the filling to leak over into the line style. to fix this barBorder is reapplied over the top to cover the leaks.
    fixedMask.zIndex = 31; // doesnt matter
    fixedMask.pivot.x = this.innerBarWidth/2; // left-right center in ourselves
    fixedMask.x = this.boundingBoxWidth/2; // center in the boundingBox
    fixedMask.y = this.textHeight; // same positioning as inner bar

    maskContainer.addChild(this.mask);
    // maskContainer.addChild(fixedMask);
    // this.container.addChild(maskContainer);
    // this.container.addChild(this.mask); // have to add child here -- not sure why
    this.barFill.mask = maskContainer;

    // this.container.addChild(fixedMask);
    barFillContainer.mask = fixedMask;

    // another copy of innerbar, except this time the fill is transparent; we just need the line style to be redrawn so that 
    // the inner filling mask leakage gets hidden
    this.barBorder = new Pixi.Graphics();
    this.barBorder.lineStyle(2, 0x000000, 1);
    // this.barBorder.beginFill(0x000000, 0);
    this.barBorder.drawRoundedRect(0, 0, this.innerBarWidth, this.innerBarHeight, this.cornerRadius);
    this.barBorder.pivot.x = this.innerBarWidth / 2;
    this.barBorder.x = this.boundingBoxWidth / 2;
    this.barBorder.y = this.textHeight;
    this.barBorder.zIndex = 7;
    // this.container.addChild(this.barBorder);
  }

  public renderSelf(props: Props) {
    this.container.position = PixiPointFrom(props.position);

    if (props.tick < 60 && props.tick % 10 === 5) { // poll for document webfonts loaded; TODO, substitute for listening to actual fonts ready event
      this.titleText?.updateText(false); // false == force reload text even when text has not changed. needed to get new fonts
      this.textToReload.forEach(it => {
        console.log(`it was size:  ${it.width} ${it.height}`);
        it.updateText(false)
        console.log(`it is now size:  ${it.width} ${it.height}`);
      });
    }

    this.mask.y = (100 - props.efficiencyPercent) * 2 + 24;
  }
}

const wrapped = engageLifecycle(EfficiencyBarComponent);
// eslint-disable-next-line
type wrapped = EfficiencyBarComponent;
export { wrapped as EfficiencyBarComponent };