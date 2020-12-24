import { GameState, PointNodeRef } from "../data/GameState";
import { HashSet } from "../lib/util/data_structures/hash";
import { UpdaterGeneratorType2 } from "../lib/util/updaterGenerator";

// Things that should happen after allocation history is appended to , in order to maintain the game state in a good state
export function afterAppendAllocationHistory(updaters: UpdaterGeneratorType2<GameState>) {
  updaters.playerSave.allocatedPointNodeSet.enqueueUpdate((prev: HashSet<PointNodeRef>, prevGameState) => {
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
  });

  updaters.playerSave.availableSp.enqueueUpdate(prev => prev - 1);
}