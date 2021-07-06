import { GameState } from '../../data/GameState';
import {
  LockStatus,
  NodeReachableStatus,
  NodeTakenStatus,
  NodeVisibleStatus,
} from '../../data/NodeStatus';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import { getWithinDistance, IReadonlySet } from '../lib/HexGrid';

export interface AllocateNodeInput {
  nodeLocation: Vector3;
  newStatus: NodeTakenStatus;
}

// TODO(bowei): unhardcode
export const FOG_OF_WAR_DISTANCE = 40;

/**
 * Stateless action wrapper over updaters.
 * Represents the action of allocating a node.
 */
export class AllocateNodeAction {
  updaters: UpdaterGeneratorType2<GameState, GameState>;

  constructor(updaters: UpdaterGeneratorType2<GameState, GameState>) {
    this.updaters = updaters;
  }

  // unchecked
  // newStatus should almost always be { taken: true, previouslyTaken: true }
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
    // NOTE(bowei): not sure how locks work yet, disabling this for now
    // this.updaters.computed.lockStatusMap?.enqueueUpdate(
    //   (prevMap, prevGameState) => {
    //     if (!prevMap) {
    //       return prevMap;
    //     }

    //     for (let [
    //       location,
    //       lockData,
    //     ] of prevGameState.worldGen.lockMap.entries()) {
    //       if (lockData) {
    //         // TODO: compute lock status
    //         const newStatus = LockStatus.TICKING;
    //         prevMap.put(location, newStatus);
    //       }
    //     }

    //     return prevMap.clone();
    //   }
    // );

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
        // getWithinDistance(nodeLocation, 3).forEach((n) => {
        // const validLocks = prevGameState.worldGen.lockMap
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
        if (newStatus.previouslyTaken && !newStatus.taken) {
          // temporairly disable fog of war revealing except for debug allocation
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
        }

        return prevMap.clone();
      }
    );
  }
}
