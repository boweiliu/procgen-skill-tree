import * as Pixi from "pixi.js";
import { RenderedChunkConstants } from "./ChunkComponent";
import { UpdaterGeneratorType2 } from "../../lib/util/updaterGenerator";
import { GameState, PointNodeGen, PointNodeRef, ResourceType } from "../../data/GameState";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { PixiPointFrom } from "../../lib/pixi/pixify";
import { multiplyColor } from "../../lib/util/misc";
import { afterMaybeSpendingSp, doTryAllocate } from "../../game/OnAllocation";
import { computePlayerResourceAmounts } from "../../game/ComputeState";

type Props = {
  delta: number,
  args: {
    pointNodeTexture: Pixi.Texture,
  },
  selfPointNodeRef: PointNodeRef,
  updaters: UpdaterGeneratorType2<GameState>,
  position: Vector2,
  pointNodeGen: PointNodeGen,
  isSelected: boolean,
  isAllocated: boolean
};

type State = {
  justTriedToAllocate: boolean
  justSpentSp: boolean
  justFailedToAllocate: boolean
  numClicks:number
}

export class PointNodeComponent {
  public container: Pixi.Container;
  staleProps!: Props;
  state!: State;
  public sprite: Pixi.Sprite
  public halfwayCenterSprite: Pixi.Sprite;
  public centerSprite: Pixi.Sprite;

  constructor(props: Props) {
    this.staleProps = props;
    this.state = {
      justTriedToAllocate: false,
      justSpentSp: false,
      justFailedToAllocate: false,
      numClicks: 0
    };
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
    this.centerSprite.alpha = 0; // TESTING
    // this.container.addChild(this.centerSprite);

    this.halfwayCenterSprite = new Pixi.Sprite(props.args.pointNodeTexture);
    this.halfwayCenterSprite.anchor.x = 0.5;
    this.halfwayCenterSprite.anchor.y = 0.5;
    this.halfwayCenterSprite.scale = PixiPointFrom(new Vector2(0.75, 0.75));
    this.halfwayCenterSprite.zIndex = 0;
    // disable this sprite for now - causes a fairly significant fps hit, until we get around to holding less nodes on the page at once
    this.halfwayCenterSprite.alpha = 0;
    // this.container.addChild(this.halfwayCenterSprite);

    this.container.interactive = true;
    // NOTE(bowei): ive tested, the following 2 settings don't significantly affect FPS
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

    if (props.selfPointNodeRef.pointNodeCoord.equals(Vector2.Zero)) {
      this.container.scale = PixiPointFrom(new Vector2(1.25, 1.25));
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
    let staleState = { ... this.state };
    this.updateSelf(props)
    if (!this.shouldUpdate(this.staleProps, props)) { return; }
    this.renderSelf(props);
    this.staleProps = props;
  }

  didMount() {
    const { updaters } = this.staleProps; // we assume this will never change


    this.container.addListener("pointerdown", (event: Pixi.InteractionEvent) => {
      this.state.numClicks++;
      // event.stopPropagation();

      // update selected to ourselves
      updaters.playerUI.selectedPointNode.enqueueUpdate((prev, gameState) => {
        if (prev?.pointNodeId === this.staleProps.selfPointNodeRef.pointNodeId) {
          this.state.justTriedToAllocate = true;
        }
        return this.staleProps.selfPointNodeRef;
      });

      // if we tried to allocate ourselves, see if we can
      updaters.playerSave.enqueueUpdate((prev, prevGameState) => {
        if (this.state.justTriedToAllocate) {
          this.state.justTriedToAllocate = false;
          let [next, succeeded] = doTryAllocate(prev, prevGameState, this.staleProps.selfPointNodeRef);
          if (succeeded) {
            this.state.justSpentSp = true;
            return next;
          } else {
            this.state.justFailedToAllocate = true;
            return prev;
          }
        }
        return prev;
      });

      // TODO(bowei): if we spent sp, remember to update quest status!!
      updaters.enqueueUpdate((prev, prevGameState) => {
        if (this.state.justSpentSp) {
          this.state.justSpentSp = false;
          return {
            ...prev,
            playerSave: afterMaybeSpendingSp(prev.playerSave, prevGameState),
            computed: {
              ...computePlayerResourceAmounts(prevGameState)
            }
          };
        }
        return prev;
      })

      // if we failed to allocate, shift the active tab so the player can see why
      updaters.playerUI.activeTab.enqueueUpdate((prev, prevGameState) => {
        if (this.state.justFailedToAllocate) {
          this.state.justFailedToAllocate = false;
          return 1;
        }
        return prev;
      });
    });
  }

  public willUnmount() { } 

}