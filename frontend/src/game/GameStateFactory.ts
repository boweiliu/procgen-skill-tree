import { GameState } from '../data/GameState';
import {
  LockStatus,
  NodeAccessibleStatus,
  NodeReachableStatus,
  NodeVisibleStatus,
} from '../data/NodeStatus';
import { newPlayerIntentState } from '../data/PlayerIntentState';
import { newWindowState } from '../data/WindowState';
import { newPlayerSaveState } from '../data/PlayerSaveState';
import { HashMap } from '../lib/util/data_structures/hash';
import { Vector3 } from '../lib/util/geometry/vector3';
import { getWithinDistance, IReadonlySet } from './lib/HexGrid';
import { WorldGenStateFactory } from './worldGen/WorldGenStateFactory';
import { FOG_OF_WAR_DISTANCE } from './actions/AllocateNode';
import { newDebugState } from '../data/DebugState';
import { PlayerUIState } from '../data/PlayerUIState';
import { loadOrCreate } from '../components/PersistenceComponent';
import { Const } from '../lib/util/misc';

export type GameStateConfig = any;

export const DEFAULT_SEED = 0x19283;

export class GameStateFactory {
  public config: GameStateConfig;

  constructor(config: GameStateConfig) {
    this.config = config;
  }

  /**
   * Tries to read out game state info from localstorage. if not present, creates a new state
   */
  public loadOrCreate(seed: number | undefined | null = undefined): GameState {
    return loadOrCreate(seed);
  }

  public create(seed: number | undefined | null = undefined): GameState {
    if (seed === undefined) {
      // assertOnlyCalledOnce("GameStateFactory.create");
    }
    const mySeed = seed || DEFAULT_SEED;

    const worldGenStateFactory = new WorldGenStateFactory({});
    const gameState: GameState = {
      tick: 0,
      worldGen: worldGenStateFactory.create({ seed: mySeed }),
      playerSave: newPlayerSaveState(),
      playerUI: PlayerUIState.new(),
      computed: {},
      intent: newPlayerIntentState(),
      windowState: newWindowState(),
      debug: newDebugState(),
      justDisabledSave: false,
    };

    loadComputed(gameState);

    return gameState;
  }
}

/**
 * computes the computed portion of game state from a freshly created or loaded game state and inserts it into the provided obj
 * @param gameState
 */
export function loadComputed(gameState: GameState): GameState {
  gameState.computed.lockStatusMap = new HashMap();
  gameState.computed.fogOfWarStatusMap = new HashMap();
  gameState.computed.reachableStatusMap = new HashMap();

  /**
   * Initialize fog of war and visible locks
   */
  // let prevMap = gameState.playerSave.allocationStatusMap;
  // first precompute the nearby lock states
  getWithinDistance(Vector3.Zero, FOG_OF_WAR_DISTANCE).forEach((n) => {
    gameState.worldGen.lockMap.precompute(n);
  });
  // fill in lock statuses with computed statuses
  // TODO(bowei): fix this?? it doesnt actually do anything???
  {
    let prevMap = gameState.computed.lockStatusMap;
    // let nodeLocation = Vector3.Zero;
    const prevGameState = gameState;

    for (let [location, lockData] of prevGameState.worldGen.lockMap.entries()) {
      if (lockData) {
        // compute lock status
        const newStatus = LockStatus.TICKING;
        prevMap.put(location, newStatus);
      }
    }
  }
  // now fog of war flow vision based on computed lock statuses
  {
    let prevMap = gameState.computed.fogOfWarStatusMap;
    let prevReachableStatusMap = gameState.computed.reachableStatusMap;
    // let newStatus = NodeAllocatedStatus.TAKEN;
    const prevGameState = gameState;

    gameState.playerSave.allocationStatusMap
      .entries()
      .filter(([loc, status]) => {
        return status.taken === true;
      })
      .map((it) => it[0])
      .forEach((nodeLocation) => {
        getWithinDistance(nodeLocation, 1).forEach((n) => {
          prevReachableStatusMap.put(n, NodeReachableStatus.true);
        });
      });

    gameState.playerSave.allocationStatusMap
      .entries()
      .filter(([loc, status]) => {
        return status.taken === true;
      })
      .map((it) => it[0])
      .forEach((nodeLocation) => {
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
      });
  }
  return gameState;
}

// TODO(bowei): unhardcode once we implement >2 eras
export const ACCESSIBLE_DISTANCE = 40;

export function markAccessibleNodes(
  prev: HashMap<Vector3, NodeAccessibleStatus> | undefined,
  prevGameState: Const<GameState>
): HashMap<Vector3, NodeAccessibleStatus> | undefined {
  if (!prev) {
    return prev;
  }

  const result = prev.clone();

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

  getWithinDistance(Vector3.Zero, ACCESSIBLE_DISTANCE, 0, validLocks).forEach(
    (n) => {
      result.put(n, { accessible: true });
    }
  );

  return result;
}
