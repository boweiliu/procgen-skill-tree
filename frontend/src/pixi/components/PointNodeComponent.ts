import * as Pixi from "pixi.js";
import { RenderedChunkConstants } from "./ChunkComponent";
import { UpdaterGeneratorType2 } from "../../lib/util/updaterGenerator";
import { GameState, PointNodeRef } from "../../data/GameState";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { PixiPointFrom } from "../../lib/pixi/pixify";

type Props = {
  delta: number,
  args: {
    pointNodeTexture: Pixi.Texture,
    selfPointNodeRef: PointNodeRef,
  },
  updaters: UpdaterGeneratorType2<GameState>,
  position: Vector2,
  isSelected: boolean,
  isAllocated: boolean
};

export class PointNodeComponent {
  public container: Pixi.Sprite;
  staleProps!: Props;
  state!: {};

  constructor(props: Props) {
    this.staleProps = props;
    this.state = {};
    this.container = new Pixi.Sprite(props.args.pointNodeTexture);
    this.container.anchor.x = 0.5;
    this.container.anchor.y = 0.5;

    this.container.interactive = true;
    this.container.buttonMode = true;
    this.container.hitArea = new Pixi.Rectangle(
      - RenderedChunkConstants.NODE_HITAREA_PX / 2,
      - RenderedChunkConstants.NODE_HITAREA_PX / 2,
      RenderedChunkConstants.NODE_HITAREA_PX,
      RenderedChunkConstants.NODE_HITAREA_PX,
    );
    this.renderSelf(props);
    this.didMount();
  }

  renderSelf(props: Props) {
    this.container.position = PixiPointFrom(props.position);
    if (props.isAllocated) {
      this.container.tint = 0x000000;
    } else {
      if (props.isSelected) {
        this.container.tint = 0xBBBBBB;
      } else {
        this.container.tint = 0xFFFFFF;
      }
    }
  }

  updateSelf(props: Props) { }
  shouldUpdate(prevProps: Props, props: Props): boolean {
    for (let key of (Object.keys(prevProps) as (keyof Props)[])) {
      if (key === 'delta' || key === 'args' || key === 'updaters') { continue; }
      if (prevProps[key] !== props[key]) {
        return true;
      }
    }
    return false;
  }

  public update(props: Props) {
    if (!this.shouldUpdate(this.staleProps, props)) { return; }
    this.updateSelf(props);
    this.renderSelf(props);
    this.staleProps = props;
  }

  didMount() {
    const { args, updaters } = this.staleProps; // we assume this will never change

    this.container.addListener("pointerdown", () => {
      updaters.playerSave.allocatedPointNodeHistory.update((prev, prevGameState) => {
        // if we were already selected, but not yet allocated, allocate us and add to the history (maybe this should be managed elsewhere??)
        if (prevGameState.playerUI.selectedPointNode?.pointNodeId === args.selfPointNodeRef.pointNodeId && 
          !prevGameState.playerSave.allocatedPointNodeSet.contains(args.selfPointNodeRef)
        ) {
          prev.push(args.selfPointNodeRef);
          console.log({ prev, actualPrev : [...prev]});
          return [...prev];
        }
        return prev;
      })
      updaters.playerSave.allocatedPointNodeSet.update((prev, prevGameState) => {
        let history = prevGameState.playerSave.allocatedPointNodeHistory
        let mostRecent = history[history.length - 1]
          console.log({ history, actualHistory: [...history] });
        // if we were already selected, try to allocate us
        if (!prev.contains(mostRecent)) {
          prev.put(mostRecent);
          const next = prev.clone();
          console.log({ prev, next, prevSize: prev.size(), nextSize: next.size(), isEqual: prev === next })
          return next;
        }
        return prev;
      })
      updaters.playerUI.selectedPointNode.update((prev, gameState) => {
        return args.selfPointNodeRef;
      })
    });
  }
}
