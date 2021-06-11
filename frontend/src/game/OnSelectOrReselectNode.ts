import { GameState, PointNodeRef } from '../data/GameState';
import { UpdaterGeneratorType2 } from '../lib/util/updaterGenerator';
import { computePlayerResourceAmounts } from './ComputeState';
import { afterMaybeSpendingSp, doTryAllocate } from './OnAllocation';

export function selectOrReselectNode(
  updaters: UpdaterGeneratorType2<GameState>,
  selfPointNodeRef: PointNodeRef
) {
  let justTriedToAllocate = false;
  let justSpentSp = false;
  let justFailedToAllocate = false;

  // update selected to ourselves
  // updaters.playerUI.selectedPointNode.enqueueUpdate((prev, gameState) => {
  //   if (prev?.pointNodeId === selfPointNodeRef.pointNodeId) {
  //     // console.log('just selected: ', this);
  //     justTriedToAllocate = true;
  //   }
  //   return selfPointNodeRef;
  // });

  // if we tried to allocate ourselves, see if we can
  updaters.playerSave.enqueueUpdate((prev, prevGameState) => {
    if (justTriedToAllocate) {
      justTriedToAllocate = false;
      let [next, succeeded] = doTryAllocate(
        prev,
        prevGameState,
        selfPointNodeRef
      );
      if (succeeded) {
        justSpentSp = true;
        return next;
      } else {
        justFailedToAllocate = true;
        return prev;
      }
    }
    return prev;
  });

  // TODO(bowei): if we spent sp, remember to update quest status!!
  updaters.computed.enqueueUpdate((prev, prevGameState) => {
    if (justSpentSp) {
      // this.state.justSpentSp = false;
      // console.log("just spent SP!");
      let it = computePlayerResourceAmounts(prevGameState);
      // console.log({ x });
      return it;
    }
    return prev;
  });

  updaters.playerSave.enqueueUpdate((prev, prevGameState) => {
    if (justSpentSp) {
      justSpentSp = false;
      // console.log("just spent SP!");
      return afterMaybeSpendingSp(prev, prevGameState);
    }
    return prev;
  });

  // if we failed to allocate, shift the active tab so the player can see why
  // updaters.playerUI.activeTab.enqueueUpdate((prev, prevGameState) => {
  //   if (justFailedToAllocate) {
  //     justFailedToAllocate = false;
  //     return 1;
  //   }
  //   return prev;
  // });
}
