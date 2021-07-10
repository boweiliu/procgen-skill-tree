import { GameState } from '../../data/GameState';
import { HashSet } from '../../lib/util/data_structures/hash';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { EnumInvalidError, extractDeps } from '../../lib/util/misc';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import { getCoordNeighbors } from '../lib/HexGrid';

export interface DeallocateNodeInput {
  nodeLocation: Vector3;
}

export type DeallocateNodeResult = boolean;

function _extract(gameState: GameState) {
  return {
    playerSave: {
      allocationStatusMap: gameState.playerSave.allocationStatusMap,
      bookmarkedStatusMap: gameState.playerSave.bookmarkedStatusMap,
      currentEra: gameState.playerSave.currentEra,
      deallocationPoints: gameState.playerSave.deallocationPoints,
    },
    computed: {
      reachableStatusMap: gameState.computed.reachableStatusMap,
      fogOfWarStatusMap: gameState.computed.fogOfWarStatusMap,
      accessibleStatusMap: gameState.computed.accessibleStatusMap,
    },
    worldGen: {
      lockMap: gameState.worldGen.lockMap,
    },
  };
}

export function extractDeallocateNodeCheckState(g: DeallocateNodeCheckState) {
  return _extract(g as GameState);
}

export type DeallocateNodeCheckState = ReturnType<typeof _extract>;
export const depsDeallocateNodeCheckState = extractDeps(
  extractDeallocateNodeCheckState
);

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

    this.updaters.enqueueUpdate((prev, prevGameState) => {
      if (prevGameState.playerSave.currentEra.type === 'A') {
        if (
          prev.playerSave.bookmarkedStatusMap.get(nodeLocation)?.bookmarked ===
          true
        ) {
          const bookmarkedStatusMap =
            prev.playerSave.bookmarkedStatusMap.clone();
          bookmarkedStatusMap.remove(nodeLocation);
          const playerSave = { ...prev.playerSave, bookmarkedStatusMap };
          return { ...prev, playerSave };
        }
        return prev;
      } else if (prevGameState.playerSave.currentEra.type === 'B') {
        let result: typeof prev | null = null;

        // update allocation map to despect the node
        if (
          prev.playerSave.allocationStatusMap.get(nodeLocation)?.taken === true
        ) {
          const allocationStatusMap =
            prev.playerSave.allocationStatusMap.clone();
          allocationStatusMap.remove(nodeLocation);

          // decrement remaining dealloc points
          const deallocationPoints = {
            ...prev.playerSave.deallocationPoints,
          };
          deallocationPoints.remaining -= 1;

          const playerSave = {
            ...prev.playerSave,
            allocationStatusMap,
            deallocationPoints,
          };
          result = result || { ...prev };
          result = { ...result, playerSave };
        }

        // also need to un-flow reachable
        let reachableStatusMap: typeof prev.computed.reachableStatusMap | null =
          null;
        // first look at all previously reachable neighbors which are not allocated
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

        // unset reachable on nodes 2 away from the current one, if needed
        reachableNeighbors.forEach((n) => {
          // find out if they have any neighbors which are still allocated and are not the freshly deallocated node
          const nsAllocatedNeighbors = Object.values(
            getCoordNeighbors(n)
          ).filter((it) => {
            return (
              prevGameState.playerSave.allocationStatusMap.get(it)?.taken ===
                true && it.notEquals(nodeLocation)
            );
          });

          // if no allocated neighbors, try to remove it
          if (nsAllocatedNeighbors.length === 0) {
            if (prev.computed.reachableStatusMap?.get(n)?.reachable === true) {
              reachableStatusMap =
                reachableStatusMap || prev.computed.reachableStatusMap.clone();
              reachableStatusMap.remove(n);
            }
          }
        });

        if (reachableStatusMap) {
          const computed = { ...prev.computed, reachableStatusMap };
          result = result || { ...prev };
          result = { ...result, computed };
        }

        return result || prev;
      } else {
        throw new EnumInvalidError();
      }
    });
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
    if (gameState.playerSave.currentEra.type === 'A') {
      if (
        gameState.playerSave.allocationStatusMap.get(input.nodeLocation)
          ?.taken === true
      ) {
        console.log("can't do that, can't unbookmark a taken node", input);
        return false;
      }
      // we can only unmark an already marked node
      const bookmarkedStatus =
        gameState.playerSave.bookmarkedStatusMap.get(nodeLocation);
      if (bookmarkedStatus?.bookmarked === true) {
        return true;
      } else {
        console.log(
          "can't do that, can't unbookmark something if it's not bookmarked"
        );
        return false;
      }
    } else if (gameState.playerSave.currentEra.type === 'B') {
      // check against the # of respecs we have in inventory
      if (gameState.playerSave.deallocationPoints.remaining <= 0) {
        console.log("can't do that, out of deallocation points");
        return false;
      }

      // we can only deallocate if it's already allocated
      const takenStatus =
        gameState.playerSave.allocationStatusMap.get(nodeLocation);
      if (takenStatus?.taken !== true) {
        console.log(
          "can't do that, can't deallocate something if it's not allocated"
        );
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
        console.log("can't do that, tree would be disconnected");
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
