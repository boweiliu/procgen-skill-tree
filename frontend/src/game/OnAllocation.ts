import { GameState, PlayerSaveState, PointNodeRef } from "../data/GameState";
import { canAllocate } from "./Neighbors";

export function doTryAllocate(prev: PlayerSaveState, prevGameState: GameState, selfPointNodeRef: PointNodeRef): [PlayerSaveState, boolean] {
  if (canAllocate(
    selfPointNodeRef,
    prevGameState.worldGen,
    prevGameState.playerSave.allocatedPointNodeSet,
    prevGameState.playerSave.availableSp
  ) === 'yes') {
    // do the change
    const nextSet = prev.allocatedPointNodeSet.clone();
    nextSet.put(selfPointNodeRef);
    const nextHistory = [...prev.allocatedPointNodeHistory];
    nextHistory.push(selfPointNodeRef);
    let availableSp = prev.availableSp - 1;
    return [{
      ...prev,
      allocatedPointNodeHistory: nextHistory,
      allocatedPointNodeSet: nextSet,
      availableSp
    }, true];
  } else {
    return [prev, false];
  }
}

export function afterMaybeSpendingSp(prev: PlayerSaveState, prevGameState: GameState): PlayerSaveState {
  let next = prev;
  if (prev.spSpentThisQuest !== undefined) {
    next = {
      ...next,
      spSpentThisQuest: prev.spSpentThisQuest + 1
    };
  }

  if (prev.availableSp === 0 && prev.activeQuest) {
    // TODO: need to find out if the quest is finished...
    next = {
      ...next,
      availableSp: 1,
      batchesSinceQuestStart: prev.batchesSinceQuestStart + 1
    };
  }
  // console.log({ next });
  return next;
}