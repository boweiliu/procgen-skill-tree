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

  constructor(props: Props) {
    super(props);
    this.container = new Pixi.Container();
    this.container.sortableChildren = true;
    this.state = {};

  }

  protected renderSelf(props: Props) {
  }
}

const wrapped = engageLifecycle(FixedCameraStageComponent);
// eslint-disable-next-line
type wrapped = FixedCameraStageComponent;
export { wrapped as FixedCameraStageComponent };
export type { Props as FixedCameraStageComponentProps };

