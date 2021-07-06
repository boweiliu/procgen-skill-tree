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

function _extractAllocateNodeCheckState(gameState: GameState) {
  return {
    playerSave: {
      allocationStatusMap: gameState.playerSave.allocationStatusMap,
    },
    computed: {
      reachableStatusMap: gameState.computed.reachableStatusMap,
    },
    worldGen: {
      lockMap: gameState.worldGen.lockMap,
    },
  };
}

export function extractAllocateNodeCheckState<T extends AllocateNodeCheckState>(
  g: T
) {
  return _extractAllocateNodeCheckState(g as any as GameState);
}

export type AllocateNodeCheckState = ReturnType<
  typeof _extractAllocateNodeCheckState
>;
export const depsAllocateNodeCheckState = extractDeps(
  extractAllocateNodeCheckState
);

export type AllocateNodeResult = boolean;

// TODO(bowei): unhardcode
export const FOG_OF_WAR_DISTANCE = 5;

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

    let newStatus: NodeTakenStatus;
    if (CURRENT_ERA.type === 'A') {
      throw new Error('NOT YET SUPPORTED');
      // newStatus = {
      //   saved: true,
      //   explored: true,
      // };
    } else {
      newStatus = {
        taken: true,
      };
    }

    this.updaters.playerSave.allocationStatusMap.enqueueUpdate((prev) => {
      prev.put(nodeLocation, newStatus);
      return prev.clone();
    });

    // before updating Fog of war, first unlock any lock whose statuses have changed
    this.updaters.computed.lockStatusMap?.enqueueUpdate(
      (prev, prevGameState) => {
        return markLockStatus(prev, prevGameState);
      }
    );

    // only bother to flow reachable status if we are in era B
    if (CURRENT_ERA.type === 'B') {
      this.updaters.computed.reachableStatusMap?.enqueueUpdate(
        (prev, prevGameState) => {
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
        }
      );
    }

    this.updaters.computed.fogOfWarStatusMap?.enqueueUpdate(
      (prev, prevGameState) => {
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
          }) || null
        );
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
    if (CURRENT_ERA.type === 'B') {
      if (!input.newStatus.taken) {
        console.log('unsupported action: ', input);
        return false;
      }
    } else if (CURRENT_ERA.type === 'A') {
      // TODO(bowei): saved & explored?
    }

    if (
      gameState.playerSave.allocationStatusMap.get(input.nodeLocation)
        ?.taken === true
    ) {
      console.log("can't do that, already taken", input);
      return false;
    }

    if (!!gameState.worldGen.lockMap.get(input.nodeLocation)) {
      console.log("can't do that, is locked", input);
      return false;
    }

    // only check for reachability in era *B
    if (CURRENT_ERA.type === 'B') {
      if (
        gameState.computed.reachableStatusMap?.get(input.nodeLocation)
          ?.reachable !== true
      ) {
        console.log("can't do that, is not reachable", input);
        return false;
      }
    }

    if (gameState.playerSave.allocationStatusMap.size() >= ERA_1_SP_LIMIT) {
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

// TODO(bowei): unhardcode once we implement >2 eras
export const ERA_1_SP_LIMIT = 20;
export const ERA_1_ACCESSIBLE_RADIUS = 10;

export const CURRENT_ERA: { era: number; type: 'A' | 'B' } = {
  era: 0,
  type: 'A',
};
