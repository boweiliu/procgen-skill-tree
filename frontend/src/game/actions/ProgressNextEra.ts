import { GameState } from '../../data/GameState';
import {
  NodeBookmarkedStatus,
  NodeReachableStatus,
  NodeVisibleStatus,
} from '../../data/NodeStatus';
import { HashMap, KeyedHashMap } from '../../lib/util/data_structures/hash';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import {
  flowFogOfWarFromNode,
  flowReachableFromNode,
  markAccessibleNodes,
} from '../GameStateFactory';

type ProgressNextEraInput = {};
type ProgressNextEraCheckState = {};
type ProgressNextEraResult = boolean;

/**
 * Stateless action wrapper over updaters.
 * Represents the action of de-allocating a node.
 */
export class ProgressNextEraAction {
  updaters: UpdaterGeneratorType2<GameState, GameState>;

  constructor(updaters: UpdaterGeneratorType2<GameState, GameState>) {
    this.updaters = updaters;
  }

  /**
   * Unchecked.
   *
   * Progress the era.
   * @param input
   */
  enqueueAction(input: ProgressNextEraInput) {
    // increment index & type
    this.updaters.playerSave.currentEra.enqueueUpdate((prev) => {
      if (prev.type === 'A') {
        return { ...prev, type: 'B' };
      } else {
        return {
          ...prev,
          type: 'A',
          index: prev.index + 1,
        };
      }
    });

    // flow accessible
    this.updaters.computed.accessibleStatusMap.enqueueUpdate(
      (prev, prevGameState) => {
        if (!prev) return prev;
        if (prevGameState.playerSave.currentEra.type === 'A') {
          let result: typeof prev | null = null;
          result = markAccessibleNodes({ result, prev, prevGameState });
          return result || prev;
        }
        return prev;
      }
    );

    // if we just transitioned from B to A, clear all bookmarks
    this.updaters.playerSave.bookmarkedStatusMap.enqueueUpdate(
      (prev, prevGameState) => {
        return new KeyedHashMap();
      }
    );

    // flow fog of war from ossified taken nodes, and also make sure to distinguish obscured/hinted/revealed
    this.updaters.computed.fogOfWarStatusMap.enqueueUpdate(
      (prev, prevGameState) => {
        if (!prev) return prev;

        let result: HashMap<Vector3, NodeVisibleStatus> | null = null;
        let nodes = prevGameState.playerSave.allocationStatusMap
          .entries()
          .filter(([n, status]) => {
            return status.taken === true;
          })
          .map((it) => it[0]);

        nodes = nodes.concat(
          prevGameState.playerSave.exploredStatusMap
            .entries()
            .filter(([n, status]) => {
              return status.explored === true;
            })
            .map((it) => it[0])
        );

        nodes.forEach((nodeLocation) => {
          result = flowFogOfWarFromNode({
            result,
            prev,
            prevGameState,
            nodeLocation,
          });
        });

        return result || prev;
      }
    );

    // also flow reachable (shows adjacent locks)
    this.updaters.computed.reachableStatusMap.enqueueUpdate(
      (prev, prevGameState) => {
        if (!prev) return prev;

        let result: HashMap<Vector3, NodeReachableStatus> | null = null;
        prevGameState.playerSave.allocationStatusMap
          .entries()
          .filter(([n, status]) => {
            return status.taken === true;
          })
          .map((it) => it[0])
          .forEach((nodeLocation) => {
            result = flowReachableFromNode({
              result,
              prev,
              prevGameState,
              nodeLocation,
            });
          });

        return result || prev;
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
    input: ProgressNextEraInput,
    gameState: ProgressNextEraCheckState
  ): ProgressNextEraResult {
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
    input: ProgressNextEraInput,
    gameState: ProgressNextEraCheckState
  ): ProgressNextEraResult {
    const check = ProgressNextEraAction.checkAction(input, gameState);
    if (check) {
      this.enqueueAction(input);
    }
    return check;
  }
}