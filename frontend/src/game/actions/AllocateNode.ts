import { GameState } from '../../data/GameState';
import {
  LockStatus,
  NodeReachableStatus,
  NodeTakenStatus,
  NodeVisibleStatus,
} from '../../data/NodeStatus';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { extractDeps } from '../../lib/util/misc';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import { getWithinDistance, IReadonlySet } from '../lib/HexGrid';

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
    const { nodeLocation, newStatus } = input;

    this.updaters.playerSave.allocationStatusMap.enqueueUpdate((prevMap) => {
      // console.log('prev was', prevMap.get(nodeLocation), 'now', newStatus);
      // if (prevMap.get(nodeLocation) === newStatus) {
      //   return prevMap;
      // }
      prevMap.put(nodeLocation, newStatus);
      return prevMap.clone();
    });

    // before updating Fog of war, first unlock any locks
    this.updaters.computed.lockStatusMap?.enqueueUpdate(
      (prevMap, prevGameState) => {
        if (!prevMap) {
          return prevMap;
        }

        for (let [
          location,
          lockData,
        ] of prevGameState.worldGen.lockMap.entries()) {
          if (lockData) {
            // TODO: compute lock status
            const newStatus = LockStatus.TICKING;
            prevMap.put(location, newStatus);
          }
        }

        return prevMap.clone();
      }
    );

    this.updaters.computed.reachableStatusMap?.enqueueUpdate((prevMap) => {
      if (!prevMap) {
        return prevMap;
      }
      // if we are only marking this node as previouslyTaken not taken (i.e. if we are fog-of-war revealing not actually allocating)
      if (!newStatus.taken) {
        return prevMap;
      }

      getWithinDistance(nodeLocation, 1).forEach((n) => {
        prevMap.put(n, NodeReachableStatus.true);
      });
      return prevMap.clone();
    });

    this.updaters.computed.fogOfWarStatusMap?.enqueueUpdate(
      (prevMap, prevGameState) => {
        if (!prevMap) {
          return prevMap;
        }
        prevMap.put(nodeLocation, NodeVisibleStatus.true);

        getWithinDistance(nodeLocation, 1).forEach((n) => {
          prevMap.put(n, NodeVisibleStatus.true);
        });

        // make sure we make use of lock state
        const validLocks: IReadonlySet<Vector3> = {
          // TODO(bowei): optimize this?
          contains: (v: Vector3) => {
            const lockData = prevGameState.worldGen.lockMap.get(v);
            const lockStatus = prevGameState.computed.lockStatusMap?.get(v);
            const isLocked = !!lockData && lockStatus !== LockStatus.OPEN;
            if (isLocked) {
              return true;
            }
            return false;
          },
        };
        getWithinDistance(
          nodeLocation,
          FOG_OF_WAR_DISTANCE,
          0,
          validLocks
        ).forEach((n) => {
          if (!prevMap.get(n)?.visible) {
            // NOTE(bowei): fuck, this doesnt cause a update to be propagated... i guess it's fine though
            prevGameState.worldGen.lockMap.precompute(n);
            prevMap.put(n, NodeVisibleStatus.true);
          }
        });

        return prevMap.clone();
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
    if (!input.newStatus.taken) {
      console.log('unsupported action: ', input);
      return false;
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

    // if (
    //   gameState.computed.reachableStatusMap?.get(input.nodeLocation)
    //     ?.reachable !== true
    // ) {
    //   console.log("can't do that, is not reachable", input);
    //   return false;
    // }

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
