import { GameState } from '../../data/GameState';
import { HashSet } from '../../lib/util/data_structures/hash';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { EnumInvalidError, NotImplementedError } from '../../lib/util/misc';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import { getCoordNeighbors } from '../lib/HexGrid';
import { AllocateNodeCheckState, CURRENT_ERA } from './AllocateNode';

export interface DeallocateNodeInput {
  nodeLocation: Vector3;
}

export type DeallocateNodeResult = boolean;
export type DeallocateNodeCheckState = AllocateNodeCheckState;

/**
 * Stateless action wrapper over updaters.
 * Represents the action of de-allocating a node.
 */
export class DeallocateNodeAction {
  updaters: UpdaterGeneratorType2<GameState, GameState>;

  constructor(updaters: UpdaterGeneratorType2<GameState, GameState>) {
    this.updaters = updaters;
  }

  /**
   * Unchecked
   * Deallocates the node (updates save status).
   * @param input
   */
  enqueueAction(input: DeallocateNodeInput) {
    const { nodeLocation } = input;

    if (CURRENT_ERA.type === 'A') {
      this.updaters.playerSave.bookmarkedStatusMap.enqueueUpdate((prev) => {
        if (prev.get(nodeLocation)?.bookmarked === true) {
          const result = prev.clone();
          result.remove(nodeLocation);
          return result;
        }
        return prev;
      });
    } else if (CURRENT_ERA.type === 'B') {
      this.updaters.playerSave.allocationStatusMap.enqueueUpdate((prev) => {
        if (prev.get(nodeLocation)?.taken === true) {
          const result = prev.clone();
          result.remove(nodeLocation);
          return result;
        }
        return prev;
      });

      // also need to un-flow reachable
      this.updaters.computed.reachableStatusMap.enqueueUpdate(
        (prev, prevGameState) => {
          if (!prev) return prev;
          // first look at all previously reachable neighbors which are not allocated
          let result: typeof prev | null = null;
          const reachableNeighbors = Object.values(
            getCoordNeighbors(nodeLocation)
          ).filter((it) => {
            return (
              prevGameState.computed.reachableStatusMap?.get(it)?.reachable ===
                true &&
              prevGameState.playerSave.allocationStatusMap?.get(it)?.taken !==
                true
            );
          });
          reachableNeighbors.forEach((n) => {
            // find out if they have any neighbors which are still allocated
            const nsAllocatedNeighbors = Object.values(
              getCoordNeighbors(n)
            ).filter((it) => {
              return (
                prevGameState.playerSave.allocationStatusMap.get(it)?.taken ===
                true
              );
            });

            // if no allocated neighbors, try to remove it
            if (nsAllocatedNeighbors.length === 0) {
              if (prev.get(n)) {
                result = result || prev.clone();
                result.remove(n);
              }
            }
          });

          return result || prev;
        }
      );
    } else {
      throw new EnumInvalidError();
    }
  }

  /**
   * Stateless function to provide a pre-flight check before actually performing the action.
   *
   * @param input
   * @param gameState
   * @returns true if the action can be taken based on the game state, false otherwise
   */
  static checkAction(
    input: DeallocateNodeInput,
    gameState: DeallocateNodeCheckState
  ): DeallocateNodeResult {
    const { nodeLocation } = input;
    if (CURRENT_ERA.type === 'A') {
      // we can only unmark an already marked node
      const bookmarkedStatus =
        gameState.playerSave.bookmarkedStatusMap.get(nodeLocation);
      if (bookmarkedStatus?.bookmarked === true) {
        return true;
      } else {
        return false;
      }
    } else if (CURRENT_ERA.type === 'B') {
      // TODO(bowei): check against the # of respecs we have in inventory

      // we can only deallocate if it's already allocated
      const takenStatus =
        gameState.playerSave.allocationStatusMap.get(nodeLocation);
      if (takenStatus?.taken !== true) {
        return false;
      }

      // need to check that deallocating does not disconnect the graph allocation status graph
      // TODO(bowei): cache this!! recomputing this all the time is hard
      // find the taken nodes which are also adjacent to the node to be deallocated
      const neighborNodes = Object.values(
        getCoordNeighbors(nodeLocation)
      ).filter((n) => {
        return gameState.playerSave.allocationStatusMap.get(n)?.taken === true;
      });
      if (neighborNodes.length <= 1) {
        // there's only 1 neighbor, so we're definitely OK
        return true;
      }

      // start from one of them, and make sure we can BFS to the others
      let start = neighborNodes[0];
      let targets = new HashSet(neighborNodes.slice(1));

      let touched = new HashSet<Vector3>();
      let processing: Vector3[] = [start];

      // touched.put(start);
      while (processing.length > 0) {
        const current = processing.shift();
        if (!current) continue;
        if (touched.get(current)) {
          continue;
        }
        touched.put(current);

        // check if we are done
        targets.remove(current);
        if (targets.size() === 0) {
          // the graph is still connected, so we are done and deallocation would be successful
          return true;
        }

        // find neighbors of current, but don't BFS through the node we're trying to deallocate
        Object.values(getCoordNeighbors(current))
          .filter((n) => {
            return (
              gameState.playerSave.allocationStatusMap.get(n)?.taken === true &&
              n.notEquals(nodeLocation)
            );
          })
          .forEach((it) => processing.push(it));
      }

      if (targets.size() > 0) {
        return false;
      }
      return true;
    } else {
      throw new EnumInvalidError();
    }
  }

  /**
   * First checks to see if the action can be performed, then performs it and returns true if successful or false otherwise.
   *
   * @param input
   * @param gameState
   * @returns
   */
  run(
    input: DeallocateNodeInput,
    gameState: DeallocateNodeCheckState
  ): DeallocateNodeResult {
    const check = DeallocateNodeAction.checkAction(input, gameState);
    if (check) {
      this.enqueueAction(input);
    }
    return check;
  }
}
