import { GameState, PlayerSaveState, PointNodeRef, ResourceType } from "../data/GameState";
import { NodeType } from "../data/WorldGenState";
import { canAllocate } from "./Neighbors";

export function doTryAllocate(prev: PlayerSaveState, prevGameState: GameState, selfPointNodeRef: PointNodeRef): [PlayerSaveState, boolean] {
  if (canAllocate(
    selfPointNodeRef,
    prevGameState.worldGen,
    prevGameState.playerSave.allocatedPointNodeSet,
    prevGameState.playerSave.activeQuest !== undefined,
  ) === 'yes' && checkEfficiencyGate(
    selfPointNodeRef,
    prevGameState,
  )) {
    // do the change
    const nextSet = prev.allocatedPointNodeSet.clone();
    nextSet.put(selfPointNodeRef);
    const nextHistory = [...prev.allocatedPointNodeHistory];
    nextHistory.push(selfPointNodeRef);
    return [{
      ...prev,
      allocatedPointNodeHistory: nextHistory,
      allocatedPointNodeSet: nextSet,
    }, true];
  } else {
    return [prev, false];
  }
}

export function afterMaybeSpendingSp(prev: PlayerSaveState, prevGameState: GameState): PlayerSaveState {
  let next = { ...prev };
  if (next.spSpentThisQuest !== undefined) {
    next.spSpentThisQuest += 1;
  }

  // update quest progress history?
  if (next.activeQuest) {
    let resourceType = next.activeQuest.resourceType;
    let amount = prevGameState.computed.playerResourceAmounts?.[resourceType] || 0;
    next.questProgressHistory.push(amount);
  }
  return next;
}

export function checkEfficiencyGate(
  selfPointNodeRef: PointNodeRef,
  gameState: GameState,
) {
  const self = gameState.worldGen
    .zLevels[selfPointNodeRef.z]
    .chunks.get(selfPointNodeRef.chunkCoord)
    ?.pointNodes.get(selfPointNodeRef.pointNodeCoord)!;
  
  if (self.nodeType !== NodeType.EfficiencyGate) {
    return true;
  } else {
    let resourceType = self.resourceType;
    let amount = gameState.computed.playerResourceAmounts?.[resourceType] || 0;
    // TODO(bowei); refactor then finish this logic
    return false;
  }
}