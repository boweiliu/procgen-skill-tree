import * as Pixi from "pixi.js";
import { GameState } from "../../data/GameState";
import { computeQuestEfficiencyPercent, remapQuestEfficiencyToDisplayable } from "../../game/EfficiencyCalculator";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { Const } from "../../lib/util/misc";
import { EfficiencyBarComponent } from "./EfficiencyBarComponent";
import { FpsComponent } from "./FpsComponent";
import { engageLifecycle, LifecycleHandlerBase } from "./LifecycleHandler";
import { ReticleComponent } from "./ReticleComponent";
import { TooltipComponent, TooltipInfo } from "./TooltipComponent";

type Props = {
  args: {
    renderer: Pixi.Renderer,
    markForceUpdate: (childInstance: any) => void,
  },
  delta: number,
  gameState: Const<GameState>,
  appSize: Vector2,
  tick: number,
  tooltip: TooltipInfo,
}

type State = { 
}

class FixedCameraStageComponent extends LifecycleHandlerBase<Props, State> {
  public container: Pixi.Container;
  public state: State;

  private fpsTracker!: FpsComponent;
  private reticle!: ReticleComponent;
  private efficiencyBar!: EfficiencyBarComponent;
  // private scoreText!: Pixi.Text;

  constructor(props: Props) {
    super(props);
    this.container = new Pixi.Container();
    this.container.sortableChildren = true;
    this.state = {};

    this.addChild({
      childClass: FpsComponent,
      propsFactory: (props: Props, state: State) => {
        return {
          tick: props.tick,
          delta: props.delta,
          position: new Vector2(0, 0),
          appSize: props.appSize,
        };
      },
    });

    this.addChild({
      childClass: ReticleComponent,
      propsFactory: (props: Props, state: State) => {
        return {
          appSize: props.appSize,
        };
      },
    });

    // this.addChild({
    //   childClass: EfficiencyBarComponent,
    //   propsFactory: (props: Props, state: State) => {
    //     return {
    //       delta: props.delta,
    //       args: {},
    //       updaters: {},
    //       tick: props.tick,
    //       position: new Vector2(60, 60),
    //       efficiencyPercent: remapQuestEfficiencyToDisplayable(computeQuestEfficiencyPercent(props.gameState.playerSave)),
    //     };
    //   },
    // });

    // this.addChild({
    //   childClass: TooltipComponent,
    //   propsFactory: (props: Props, state: State) => {
    //     return { offset: new Vector2(8, 8), ...props.tooltip };
    //   }
    // });

    // this.scoreText = new Pixi.Text('', {
    //   fontFamily: 'PixelMix',
    //   padding: 4, // https://github.com/pixijs/pixi.js/issues/4500 -- otherwise on first load the text bounding box is calculated to be too small and the tops of the f's get cut off
    //   fontSize: 26, // use 26 then scale down 50% results in sharper letters than 13
    //   // align: 'center'
    // });
    // // this.scoreText.scale = PixiPointFrom(new Vector2(0.5, 0.5));
    // this.scoreText.pivot.x = 0.5;
    // this.scoreText.y = 8;
    // this.container.addChild(this.scoreText);
  }

  protected renderSelf(props: Props) {
    // this.scoreText.x = props.appSize.x * 0.05;
    // this.scoreText.text = 'Score: ' + props.gameState.playerSave.score.toString();

    // if (props.tick < 60 && props.tick % 10 === 5) { // poll for document webfonts loaded; TODO, substitute for listening to actual fonts ready event
    //   this.scoreText.updateText(false); // false == force reload text even when text has not changed. needed to get new fonts
    // }
  }
}

const wrapped = engageLifecycle(FixedCameraStageComponent);
// eslint-disable-next-line
type wrapped = FixedCameraStageComponent;
export { wrapped as FixedCameraStageComponent };
export type { Props as FixedCameraStageComponentProps };

