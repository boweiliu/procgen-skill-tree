import { GameState } from '../../data/GameState';
import { NodeTakenStatus } from '../../data/NodeStatus';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { extractDeps } from '../../lib/util/misc';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import {
  flowFogOfWarFromNode,
  flowReachableFromNode,
  markLockStatus,
} from '../GameStateFactory';

export interface AllocateNodeInput {
  nodeLocation: Vector3;
  newStatus: NodeTakenStatus;
}

function _extract(gameState: GameState) {
  return {
    playerSave: {
      allocationStatusMap: gameState.playerSave.allocationStatusMap,
      bookmarkedStatusMap: gameState.playerSave.bookmarkedStatusMap,
      currentEra: gameState.playerSave.currentEra,
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

export function extractAllocateNodeCheckState(g: AllocateNodeCheckState) {
  return _extract(g as GameState);
}

export type AllocateNodeCheckState = ReturnType<typeof _extract>;
export const depsAllocateNodeCheckState = extractDeps(
  extractAllocateNodeCheckState
);

export type AllocateNodeResult = boolean;

// TODO(bowei): unhardcode
// The sight radius
export const FOG_OF_WAR_DISTANCE = Infinity;

/**
 * Stateless action wrapper over updaters.
 * Represents the action of allocating a node.
 */
export class AllocateNodeAction {
  updaters: UpdaterGeneratorType2<GameState, GameState>;

  constructor(updaters: UpdaterGeneratorType2<GameState, GameState>) {
    this.updaters = updaters;
  }

  /**
   * Unchecked
   * Allocates the node (updates save status) and recomputes related fog of war statuses.
   * @param input
   */
  enqueueAction(input: AllocateNodeInput) {
    const { nodeLocation } = input;

    // TODO(bowei): dont forget to update statsTab to compute off of saved as well as taken
    this.updaters.playerSave.allocationStatusMap.enqueueUpdate(
      (prev, prevGameState) => {
        if (prevGameState.playerSave.currentEra.type === 'B') {
          if (prev.get(nodeLocation)?.taken !== true) {
            const result = prev.clone();
            result.put(nodeLocation, { taken: true });
            return result;
          }
          return prev;
        } else {
          return prev;
        }
      }
    );

    // before updating Fog of war, first unlock any lock whose statuses have changed
    this.updaters.computed.lockStatusMap?.enqueueUpdate(
      (prev, prevGameState) => {
        if (prevGameState.playerSave.currentEra.type === 'B') {
          return markLockStatus(prev, prevGameState);
        } else {
          return prev;
        }
      }
    );

    // only bother to flow reachable status if we are in era B
    this.updaters.computed.reachableStatusMap?.enqueueUpdate(
      (prev, prevGameState) => {
        if (prevGameState.playerSave.currentEra.type === 'B') {
          if (!prev) {
            return prev;
          }

          return (
            flowReachableFromNode({
              result: null,
              prev,
              prevGameState,
              nodeLocation,
            }) || prev
          );
        } else {
          return prev;
        }
      }
    );

    // TODO(bowei): dont forget to update statsTab to compute off of saved as well as taken
    this.updaters.playerSave.bookmarkedStatusMap.enqueueUpdate(
      (prev, prevGameState) => {
        if (prevGameState.playerSave.currentEra.type === 'A') {
          const prevBookmarked = !!prev.get(nodeLocation)?.bookmarked;
          const result = prev.clone();
          if (prevBookmarked) {
            result.remove(nodeLocation);
            return result;
          } else {
            result.put(nodeLocation, { bookmarked: true });
            return result;
          }
        } else {
          return prev;
        }
      }
    );

    this.updaters.playerSave.exploredStatusMap.enqueueUpdate(
      (prev, prevGameState) => {
        if (prevGameState.playerSave.currentEra.type === 'A') {
          if (prev.get(nodeLocation)?.explored !== true) {
            const result = prev.clone();
            result.put(nodeLocation, { explored: true });
            return result;
          }
          return prev;
        } else {
          return prev;
        }
      }
    );

    this.updaters.computed.fogOfWarStatusMap?.enqueueUpdate(
      (prev, prevGameState) => {
        if (prevGameState.playerSave.currentEra.type === 'A') {
          if (!prev) {
            return prev;
          }

          // optimization: don't clone [prev] immediately, only clone if any changes need to be made
          return (
            flowFogOfWarFromNode({
              result: null,
              prev,
              prevGameState,
              nodeLocation,
            }) || prev
          );
        } else {
          return prev;
        }
      }
    );
  }

  /**
   * Stateless function to provide a pre-flight check before actually performing the action.
   *
   * @param input
   * @param gameState
   * @returns true if the action can be taken based on the game state, false otherwise
   */
  static checkAction(
    input: AllocateNodeInput,
    gameState: AllocateNodeCheckState
  ): AllocateNodeResult {
    if (gameState.playerSave.currentEra.type === 'B') {
      if (!input.newStatus.taken) {
        console.log('unsupported action: ', input);
        return false;
      }
    } else if (gameState.playerSave.currentEra.type === 'A') {
      // TODO(bowei): saved & explored?
      if (!input.newStatus.taken) {
        console.log('unsupported action: ', input);
        return false;
      }
    }

    if (
      gameState.playerSave.currentEra.type === 'B' &&
      gameState.playerSave.allocationStatusMap.get(input.nodeLocation)
        ?.taken === true
    ) {
      console.log("can't do that, already taken", input);
      return false;
    }

    if (
      gameState.playerSave.currentEra.type === 'A' &&
      gameState.playerSave.allocationStatusMap.get(input.nodeLocation)
        ?.taken === true
    ) {
      console.log(
        "can't do that, can't bookmark or unbookmark a taken node",
        input
      );
      return false;
    }

    if (!!gameState.worldGen.lockMap.get(input.nodeLocation)) {
      console.log("can't do that, is locked", input);
      return false;
    }

    if (
      gameState.computed.fogOfWarStatusMap?.get(input.nodeLocation) !==
      'revealed'
    ) {
      console.log("can't do that, is not visible", input);
      return false;
    }

    if (
      gameState.computed.accessibleStatusMap?.get(input.nodeLocation)
        ?.accessible !== true
    ) {
      console.log("can't do that, is not accessible", input);
      return false;
    }

    // only check for reachability in era *B
    if (gameState.playerSave.currentEra.type === 'B') {
      if (
        gameState.computed.reachableStatusMap?.get(input.nodeLocation)
          ?.reachable !== true
      ) {
        console.log("can't do that, is not reachable", input);
        return false;
      }
    }

    if (
      (gameState.playerSave.currentEra.type === 'B' &&
        gameState.playerSave.allocationStatusMap.size() >=
          ERA_SP_LIMITS[gameState.playerSave.currentEra.index]) ||
      (gameState.playerSave.currentEra.type === 'A' &&
        gameState.playerSave.bookmarkedStatusMap.size() >=
          ERA_SP_LIMITS[gameState.playerSave.currentEra.index] &&
        gameState.playerSave.bookmarkedStatusMap.get(input.nodeLocation)
          ?.bookmarked !== true)
    ) {
      console.log("can't do that, no available SP right now");
      return false;
    }

    return true;
  }

  /**
   * First checks to see if the action can be performed, then performs it and returns true if successful or false otherwise.
   *
   * @param input
   * @param gameState
   * @returns
   */
  run(
    input: AllocateNodeInput,
    gameState: AllocateNodeCheckState
  ): AllocateNodeResult {
    const check = AllocateNodeAction.checkAction(input, gameState);
    if (check) {
      this.enqueueAction(input);
    }
    return check;
  }
}

// sp limits for each additional era; cumulative and includes the first initial node
export const ERA_SP_LIMITS: { [x: number]: number } = {
  [-1]: 1,
  0: 11,
  1: 31,
  2: 61,
  3: 91,
};

// era radius at each era; not cumulative
export const ERA_ACCESSIBLE_RADII: { [x: number]: number } = {
  0: 4,
  1: 15,
  2: 35,
  3: 50,
};

// how many deallocation actions. cumulative
export const ERA_DEALLOCATION_POINTS: { [x: number]: number } = {
  0: 10,
  1: 12,
  2: 18,
  3: 28,
};
