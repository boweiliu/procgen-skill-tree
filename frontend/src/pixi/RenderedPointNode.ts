import { Line } from "../lib/util/geometry/line";
import { Vector2 } from "../lib/util/geometry/vector2";
import { INTMAX32, squirrel3 } from "../lib/util/random";
import * as Pixi from "pixi.js";
import { HashMap, HashSet } from "../lib/util/data_structures/hash";
import { ChunkGenConstants, GameState, PointNodeRef } from "../data/GameState";
import { RenderedChunkConstants } from "./RenderedChunk";
import { DeepReadonly, updaterGenerator, UpdaterGeneratorType } from "../lib/util/misc";

export class RenderedPointNode {
  public sprite: Pixi.Sprite;
  public selfPointNodeRef: PointNodeRef; // which node we are

  // local state
  public justClicked: boolean = false;

  constructor(args: { texture: Pixi.Texture, selfPointNodeRef: PointNodeRef }) {
    this.selfPointNodeRef = args.selfPointNodeRef;
    this.sprite = new Pixi.Sprite(args.texture);
    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;
    // this.sprite.x = node.x * RenderedChunkConstants.SPACING_PX;
    // this.sprite.y = node.y * RenderedChunkConstants.SPACING_PX;
    this.sprite.interactive = true;
    this.sprite.hitArea = new Pixi.Rectangle(
      - RenderedChunkConstants.NODE_HITAREA_PX / 2,
      - RenderedChunkConstants.NODE_HITAREA_PX / 2,
      RenderedChunkConstants.NODE_HITAREA_PX,
      RenderedChunkConstants.NODE_HITAREA_PX,
    );
    this.sprite.addListener("pointerdown", () => {
      this.justClicked = true;
    });
  }

  private setTint(args: { isSelected: boolean, isAllocated: boolean }) {
    if (args.isAllocated) {
      this.sprite.tint = 0x00AAFF;
    } else {
      if (args.isSelected) {
        this.sprite.tint = 0xBBBBBB;
      } else {
        this.sprite.tint = 0xFFFFFF;
      }
    }
  }

  private isSelected(gameState: DeepReadonly<GameState>): boolean {
    return gameState.playerUI.selectedPointNode?.pointNodeId == this.selfPointNodeRef.pointNodeId;
  }

  private isAllocated(gameState: DeepReadonly<GameState>): boolean {
    return gameState.playerSave.allocatedPointNodeSet.get(this.selfPointNodeRef)
  }

  public update(args: {
    gameState: DeepReadonly<GameState>, gameStateUpdater: UpdaterGeneratorType<GameState>,
    renderedNodeMap: DeepReadonly<HashMap<PointNodeRef, RenderedPointNode>>
  }) {
    let { gameState, gameStateUpdater } = args;
    // sync ourselves with state
    let isSelected = this.isSelected(gameState);
    let isAllocated = this.isAllocated(gameState);

    if (this.justClicked) {
      if (!gameState.playerUI.selectedPointNode) {
      // if nothing is is selected, select ourselves;

        isSelected = true;
        this.setTint({ isSelected, isAllocated });
        gameStateUpdater.playerUI.selectedPointNode.set(this.selfPointNodeRef);

      } else if (gameState.playerUI.selectedPointNode.pointNodeId == this.selfPointNodeRef.pointNodeId) {
        // if we were already selected, try to allocate ourselves

        if (!isAllocated) {
          isAllocated = true;
          // save our allocation to state
          // TODO(bowei): this code block should be somewhere else????
          gameStateUpdater.playerSave.allocatedPointNodeSet.update(set => {
            set.put(this.selfPointNodeRef);
            return set;
          })
          gameStateUpdater.playerSave.allocatedPointNodeHistory.update(history => {
            history.push(this.selfPointNodeRef);
            return history;
          })
        }
        this.setTint({ isSelected, isAllocated });
      } else {
        // if something other than ourselves is selected, unselect it and select ourselves;

        isSelected = true;
        let otherNode = args.renderedNodeMap.get(gameState.playerUI.selectedPointNode);
        gameStateUpdater.playerUI.selectedPointNode.set(this.selfPointNodeRef);
        otherNode.setTint({
          isSelected: false,
          isAllocated: otherNode.isAllocated(gameState)
        });
        this.setTint({ isSelected: true, isAllocated})
      }
    }
    // don't forget to reset state!
    this.justClicked = false;
  }

}