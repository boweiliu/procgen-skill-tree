import { Line } from "../lib/util/geometry/line";
import { Vector2 } from "../lib/util/geometry/vector2";
import { INTMAX32, squirrel3 } from "../lib/util/random";
import * as Pixi from "pixi.js";
import { HashMap, HashSet } from "../lib/util/data_structures/hash";
import { ChunkGenConstants, GameState, PointNodeRef } from "../data/GameState";
import { RenderedChunkConstants } from "./RenderedChunk";
import { DeepReadonly, updaterGenerator, UpdaterGeneratorType } from "../lib/util/misc";


/**
 * Usage:
 * class RenderedChunk {
 *  constructor(stateUpdaterQueue) {
 *    this.nodes = 0...10.map(i => new RenderedPointNode({texture, new NodeRef(i), stateUpdaterQueue}))
 *    // this.nodes[0].render({ some, stuff })
 *    this.nodes[0] should listen to gameState.playerUI.selectedPointNode and allocatedPointNodes, and
 *    updating gameState.playerUI.selectedPointNode or gameState.playerSave.allocatedPointNodes or their 
 *       parents should trigger queueing of the rerender
 *    or rather, rerendering
 *  }
 * }
 */

export class RenderedPointNode {
  public sprite: Pixi.Sprite;
  public selfPointNodeRef: PointNodeRef; // which node we are

  // local state
  // public justClicked: boolean = false;

  // args here will never change, and changing this will NOT force a rerender
  constructor(args: {
    pointNodeTexture: Pixi.Texture,
    selfPointNodeRef: PointNodeRef,
    stateUpdaterQueue: [Function],
    ticker: Pixi.Ticker
  }) {
    this.selfPointNodeRef = args.selfPointNodeRef;
    this.sprite = new Pixi.Sprite(args.pointNodeTexture);
    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;
    // this.sprite.x = node.x * RenderedChunkConstants.SPACING_PX;
    // this.sprite.y = node.y * RenderedChunkConstants.SPACING_PX;
    this.sprite.interactive = true;
    this.sprite.buttonMode = true;
    this.sprite.hitArea = new Pixi.Rectangle(
      - RenderedChunkConstants.NODE_HITAREA_PX / 2,
      - RenderedChunkConstants.NODE_HITAREA_PX / 2,
      RenderedChunkConstants.NODE_HITAREA_PX,
      RenderedChunkConstants.NODE_HITAREA_PX,
    );
    this.sprite.addListener("pointerdown", () => {
      args.stateUpdaterQueue.push(this.onClick.bind(this));
      // this.justClicked = true;

      // do 3 things:
      // 1. queue up the necessary state changes, to be executed on tick
      // 2. mark other components that need rerendering based on state change
      // 3. do all the rerenders
    });
    args.ticker.add(this.animate.bind(this));
  }

  public setLocation(node: PointNodeRef = this.selfPointNodeRef) : this {
    this.sprite.x = node.pointNodeCoord.x * RenderedChunkConstants.SPACING_PX;
    this.sprite.y = node.pointNodeCoord.y * RenderedChunkConstants.SPACING_PX;
    return this;
  }

  public animate(delta: number) : this {
    // TODO(bowei): make the (0,0) node in a chunk shimmer? or somehow visually distinguish it
    return this;
  }

  public onClick(args: { gameState: GameState, gameStateUpdater: UpdaterGeneratorType<GameState>, entityUpdaterQueue: [any] }) {
    // 1. update the state(s)
    if (args.gameState.playerUI.selectedPointNode?.pointNodeId == this.selfPointNodeRef.pointNodeId) {
      // if we were already selected, allocate us
      // TODO(bowei): this code block should be somewhere else????
      args.gameStateUpdater.playerSave.allocatedPointNodeSet.update(set => {
        set.put(this.selfPointNodeRef);
        return set;
      })
      args.gameStateUpdater.playerSave.allocatedPointNodeHistory.update(history => {
        history.push(this.selfPointNodeRef);
        return history;
      })
    } else {
      // otherwise, set selected node to us
      args.gameStateUpdater.playerUI.selectedPointNode.set(this.selfPointNodeRef);
    }
    // 2. manually mark necessary changed components?? or autodeduce based on dependencies??

    // 3. do the rerenders (someone else handles this...)
  }

  public rerender(props: { isSelected: boolean, isAllocated: boolean }) : this {
    this.setTint(props);
    return this;
  }

  // public rerenderFromState(gameState: DeepReadonly<GameState>) {
  //   this.rerender({
  //     isSelected: this.isSelected(gameState),
  //     isAllocated: this.isAllocated(gameState)
  //   })
  // }

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

 public isSelected(gameState: DeepReadonly<GameState>): boolean {
   return gameState.playerUI.selectedPointNode?.pointNodeId == this.selfPointNodeRef.pointNodeId;
 }

 public isAllocated(gameState: DeepReadonly<GameState>): boolean {
   return gameState.playerSave.allocatedPointNodeSet.get(this.selfPointNodeRef)
 }
// 
//   public update(args: {
//     gameState: DeepReadonly<GameState>, gameStateUpdater: UpdaterGeneratorType<GameState>,
//     renderedNodeMap: DeepReadonly<HashMap<PointNodeRef, RenderedPointNode>>
//   }) {
//     let { gameState, gameStateUpdater } = args;
//     // sync ourselves with state
//     let isSelected = this.isSelected(gameState);
//     let isAllocated = this.isAllocated(gameState);
// 
//     if (this.justClicked) {
//       if (!gameState.playerUI.selectedPointNode) {
//       // if nothing is is selected, select ourselves;
// 
//         isSelected = true;
//         this.setTint({ isSelected, isAllocated });
//         gameStateUpdater.playerUI.selectedPointNode.set(this.selfPointNodeRef);
// 
//       } else if (gameState.playerUI.selectedPointNode.pointNodeId == this.selfPointNodeRef.pointNodeId) {
//         // if we were already selected, try to allocate ourselves
// 
//         if (!isAllocated) {
//           isAllocated = true;
//           // save our allocation to state
//           // TODO(bowei): this code block should be somewhere else????
//           gameStateUpdater.playerSave.allocatedPointNodeSet.update(set => {
//             set.put(this.selfPointNodeRef);
//             return set;
//           })
//           gameStateUpdater.playerSave.allocatedPointNodeHistory.update(history => {
//             history.push(this.selfPointNodeRef);
//             return history;
//           })
//         }
//         this.setTint({ isSelected, isAllocated });
//       } else {
//         // if something other than ourselves is selected, unselect it and select ourselves;
// 
//         isSelected = true;
//         let otherNode = args.renderedNodeMap.get(gameState.playerUI.selectedPointNode);
//         gameStateUpdater.playerUI.selectedPointNode.set(this.selfPointNodeRef);
//         otherNode.setTint({
//           isSelected: false,
//           isAllocated: otherNode.isAllocated(gameState)
//         });
//         this.setTint({ isSelected: true, isAllocated})
//       }
//     }
//     // don't forget to reset state!
//     this.justClicked = false;
//   }

}