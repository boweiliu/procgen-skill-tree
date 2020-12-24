import * as Pixi from "pixi.js";
import { RenderedChunkConstants } from "./ChunkComponent";
import { UpdaterGeneratorType2 } from "../../lib/util/updaterGenerator";
import { ChunkGenConstants, GameState, PointNodeGen, PointNodeRef, ResourceType, WorldGenState } from "../../data/GameState";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { PixiPointFrom } from "../../lib/pixi/pixify";
import { HashSet } from "../../lib/util/data_structures/hash";
import { multiplyColor } from "../../lib/util/misc";
import { canAllocate } from "../../data/lib/Neighbors";

type Props = {
  delta: number,
  args: {
    pointNodeTexture: Pixi.Texture,
    selfPointNodeRef: PointNodeRef,
  },
  updaters: UpdaterGeneratorType2<GameState>,
  position: Vector2,
  pointNodeGen: PointNodeGen,
  isSelected: boolean,
  isAllocated: boolean
};

type State = {

}

export class PointNodeComponent {
  public container: Pixi.Container;
  staleProps!: Props;
  state!: State;
  public sprite: Pixi.Sprite
  public centerSprite: Pixi.Sprite;

  constructor(props: Props) {
    this.staleProps = props;
    this.state = {};
    this.container = new Pixi.Container();
    this.container.sortableChildren = true;
    this.sprite = new Pixi.Sprite(props.args.pointNodeTexture);
    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;
    this.sprite.zIndex = -1;
    this.container.addChild(this.sprite);

    this.centerSprite = new Pixi.Sprite(props.args.pointNodeTexture);
    this.centerSprite.anchor.x = 0.5;
    this.centerSprite.anchor.y = 0.5;
    this.centerSprite.scale = PixiPointFrom(new Vector2(0.5, 0.5));
    this.centerSprite.zIndex = 1;
    this.container.addChild(this.centerSprite);

    // this.container.mask

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
    let tint: number;
    let centerTint: number;
    if (props.isSelected) {
      tint = 0xBBBBFF;
      centerTint = 0xBBBBFF;
    } else {
      tint = 0xFFFFFF;
      centerTint = 0xFFFFFF;
    }
    if (props.isAllocated) {
      tint = 0x444444;
    } else {
    }
    let baseColor: number = 0;
    switch (props.pointNodeGen.resourceType) {
      case ResourceType.Nothing:
        baseColor = 0x99bbff; // blue that mixes in with bg
        break;
      case ResourceType.Mana0:
        baseColor = 0xeeaaaa; // red
        break;
      case ResourceType.Mana1:
        baseColor = 0xbb7733; // brown?
        break;
      case ResourceType.Mana2:
        baseColor = 0x44aa44; // green
        break;
    }

    this.sprite.tint = multiplyColor(baseColor, tint);
    this.centerSprite.tint = multiplyColor(baseColor, centerTint);
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

    this.container.addListener("pointerdown", (event: Pixi.InteractionEvent) => {
      // event.stopPropagation();

      updaters.playerSave.allocatedPointNodeHistory.update((prev, prevGameState) => {
        // if we were already selected, but not yet allocated, allocate us and add to the history (maybe this should be managed elsewhere??)
        if (prevGameState.playerUI.selectedPointNode?.pointNodeId === args.selfPointNodeRef.pointNodeId && 
          canAllocate(
            args.selfPointNodeRef,
            prevGameState.worldGen,
            prevGameState.playerSave.allocatedPointNodeSet,
            prevGameState.playerSave.availableSp
          ) === 'yes'
        ) {
          prev.push(args.selfPointNodeRef);
          console.log({ prev, actualPrev : [...prev]});
          return [...prev];
        }
        return prev;
      })

      updaters.playerSave.allocatedPointNodeSet.update((prev: HashSet<PointNodeRef>, prevGameState) => {
        let history = prevGameState.playerSave.allocatedPointNodeHistory
        let mostRecent = history[history.length - 1]
          console.log({ history, actualHistory: [...history] });
        // if we were already selected, try to allocate us
        if (!prev.contains(mostRecent)) {
          const next = prev.clone();
          next.put(mostRecent);
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