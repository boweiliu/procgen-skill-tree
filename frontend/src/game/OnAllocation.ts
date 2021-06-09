import { GameState, PlayerSaveState, PointNodeRef } from '../data/GameState';
import { NodeType } from '../data/WorldGenState';
import { Const } from '../lib/util/misc';
import { canAllocate } from './Neighbors';

export function doTryAllocate(
  prev: Const<PlayerSaveState>,
  prevGameState: GameState,
  selfPointNodeRef: PointNodeRef
): [Const<PlayerSaveState>, boolean] {
  if (
    canAllocate(
      selfPointNodeRef,
      prevGameState.worldGen,
      prevGameState.playerSave.allocatedPointNodeSet,
      prevGameState.playerSave.activeQuest !== undefined
    ) === 'yes' &&
    checkEfficiencyGate(selfPointNodeRef, prevGameState)
  ) {
    // do the change
    const nextSet = prev.allocatedPointNodeSet.clone();
    nextSet.put(selfPointNodeRef);
    const nextHistory = [...prev.allocatedPointNodeHistory];
    nextHistory.push(selfPointNodeRef);
    return [
      {
        ...prev,
        allocatedPointNodeHistory: nextHistory,
        allocatedPointNodeSet: nextSet,
      },
      true,
    ];
  } else {
    return [prev, false];
  }
}

export function afterMaybeSpendingSp(
  prev: Const<PlayerSaveState>,
  prevGameState: GameState
): Const<PlayerSaveState> {
  let next = { ...prev };
  if (next.spSpentThisQuest !== undefined) {
    next.spSpentThisQuest += 1;
  }

  // update quest progress history?
  if (next.activeQuest) {
    let resourceType = next.activeQuest.resourceType;
    let amount =
      prevGameState.computed.playerResourceAmounts?.[resourceType] || 0;
    next.questProgressHistory = [...next.questProgressHistory, amount];
  }
  return next;
}

export function checkEfficiencyGate(
  selfPointNodeRef: PointNodeRef,
  gameState: GameState
) {
  const self = gameState.worldGen.zLevels[selfPointNodeRef.z].chunks
    .get(selfPointNodeRef.chunkCoord)
    ?.pointNodes.get(selfPointNodeRef.pointNodeCoord)!;

  if (self.nodeType !== NodeType.EfficiencyGate) {
    return true;
  } else {
    let resourceType = self.efficiencyGateInfo.thresholdResourceType;
    let amount = gameState.computed.playerResourceAmounts?.[resourceType] || 0;
    if (
      amount >= self.efficiencyGateInfo.thresholdResourceAmount &&
      gameState.playerSave.allocatedPointNodeHistory.length <=
        self.efficiencyGateInfo.timeUntilLocked
    ) {
      return true;
    }
    return false;
  }
}
