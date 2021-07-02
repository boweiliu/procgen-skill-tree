import { GameState } from '../../data/GameState';
import { NodeTakenStatus } from '../../data/NodeStatus';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';

export interface DeallocateNodeInput {
  nodeLocation: Vector3;
  newStatus: NodeTakenStatus;
}

/**
 * Stateless action wrapper over updaters.
 * Represents the action of allocating a node.
 */
export class DeallocateNodeAction {
  updaters: UpdaterGeneratorType2<GameState, GameState>;

  constructor(updaters: UpdaterGeneratorType2<GameState, GameState>) {
    this.updaters = updaters;
  }

  // unchecked
  enqueueAction(input: DeallocateNodeInput) {
    const { nodeLocation, newStatus } = input;

    this.updaters.playerSave.allocationStatusMap.enqueueUpdate((prevMap) => {
      prevMap.put(nodeLocation, newStatus);
      return prevMap.clone();
    });
  }

  // checked
  run(input: DeallocateNodeInput, gameState: GameState): boolean {
    const check = DeallocateNodeAction.checkAction(input, gameState);
    if (check) {
      this.enqueueAction(input);
    }
    return check;
  }

  /**
   *
   * @param input
   * @param gameState
   * @returns true if the action can be taken based on the provided game state, false otherwise
   */
  static checkAction(
    input: DeallocateNodeInput,
    gameState: GameState
  ): boolean {
    return true;
  }
}
