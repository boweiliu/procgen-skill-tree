import { GameState } from "../data/GameState";
import { UpdaterGeneratorType2 } from "../lib/util/updaterGenerator";

// Things that should happen after allocation history is appended to , in order to maintain the game state in a good state
export function afterAppendAllocationHistory(updaters: UpdaterGeneratorType2<GameState>) {
  updaters.playerSave.enqueueUpdate((prev, prevGameState) => {
    let justAllocated = prevGameState.playerSave.justAllocated; // we are assuming that someone verified that this is good2go
    if (!justAllocated) { return prev; }

    let prevSet = prev.allocatedPointNodeSet;
    if (!prevSet.contains(justAllocated)) { // if it's new, add it to history, set, and decrement sp
      const nextSet = prev.allocatedPointNodeSet.clone();
      nextSet.put(justAllocated);
      const nextHistory = [...prev.allocatedPointNodeHistory];
      nextHistory.push(justAllocated);
      let availableSp = prev.availableSp - 1;
      return {
        ...prev,
        allocatedPointNodeHistory: nextHistory,
        allocatedPointNodeSet: nextSet,
        availableSp
      };
    }
    return prev;
  });
}