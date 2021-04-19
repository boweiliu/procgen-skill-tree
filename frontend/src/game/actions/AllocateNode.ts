import { NodeAllocatedStatus } from '../../components/GameArea/GameAreaComponent';
import { GameState } from '../../data/GameState';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import { getWithinDistance } from '../lib/HexGrid';

export interface AllocateNodeInput {
  nodeLocation: Vector3;
  newStatus: NodeAllocatedStatus.TAKEN;
}

export class AllocateNodeAction {
  updaters: UpdaterGeneratorType2<GameState, GameState>;

  constructor(updaters: UpdaterGeneratorType2<GameState, GameState>) {
    this.updaters = updaters;
  }

  enqueueAction(input: AllocateNodeInput) {
    const { nodeLocation, newStatus } = input;
    this.updaters.playerSave.allocationStatusMap.enqueueUpdate((prevMap) => {
      prevMap.put(nodeLocation, newStatus);
      return prevMap.clone();
    });
    this.updaters.computed.fogOfWarStatusMap?.enqueueUpdate(
      (prevMap, prevGameState) => {
        if (!prevMap) {
          return prevMap;
        }
        prevMap.put(nodeLocation, NodeAllocatedStatus.VISIBLE);
        getWithinDistance(nodeLocation, 1).forEach((n) => {
          if (prevMap.get(n) === NodeAllocatedStatus.UNREACHABLE) {
            prevMap.put(n, NodeAllocatedStatus.AVAILABLE);
          }
        });
        getWithinDistance(nodeLocation, 3).forEach((n) => {
          if (
            (prevMap.get(n) || NodeAllocatedStatus.HIDDEN) ===
            NodeAllocatedStatus.HIDDEN
          ) {
            // NOTE(bowei): fuck, this doesnt cause a update to be propagated... i guess it's fine though
            prevGameState.worldGen.lockMap.precompute(n);
            prevMap.put(n, NodeAllocatedStatus.UNREACHABLE);
          }
        });

        return prevMap.clone();
      }
    );
  }
}
