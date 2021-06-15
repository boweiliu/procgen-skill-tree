import { GameState } from '../data/GameState';
import {
  LockStatus,
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

export type GameStateConfig = any;

const DEFAULT_SEED = 0x19283;

export class GameStateFactory {
  public config: GameStateConfig;

  constructor(config: GameStateConfig) {
    this.config = config;
  }

  /**
   * Tries to read out game state info from localstorage. if not present, creates a new state
   */
  public loadOrCreate(seed: number | undefined | null = undefined): GameState {
    const mySeed = seed || DEFAULT_SEED;

    const worldGenStateFactory = new WorldGenStateFactory({});
    const gameState: GameState = {
      tick: 0,
      worldGen: worldGenStateFactory.create({ seed: mySeed }),
      playerSave: newPlayerSaveState(),
      playerUI: PlayerUIState.tryLoad(),
      computed: {},
      intent: newPlayerIntentState(),
      windowState: newWindowState(),
      debug: newDebugState(),
      justDisabledSave: false,
    };

    loadComputed(gameState);

    return gameState;
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
    let nodeLocation = Vector3.Zero;
    // let newStatus = NodeAllocatedStatus.TAKEN;
    const prevGameState = gameState;

    prevMap.put(nodeLocation, NodeVisibleStatus.true);

    getWithinDistance(nodeLocation, 1).forEach((n) => {
      prevMap.put(n, NodeVisibleStatus.true);
      prevReachableStatusMap.put(n, NodeReachableStatus.true);
    });

    // make sure we make use of lock state
    // getWithinDistance(nodeLocation, 3).forEach((n) => {
    // const validLocks = prevGameState.worldGen.lockMap
    const validLocks: IReadonlySet<Vector3> = {
      // TODO(bowei): optimize this?
      contains: (v: Vector3) => {
        // const maybeLock = prevGameState.worldGen.lockMap.get(v);
        const maybeLock = prevGameState.computed.lockStatusMap?.get(v);
        if (maybeLock && maybeLock !== LockStatus.OPEN) {
          return true;
        }
        return false;
      },
    };
    getWithinDistance(nodeLocation, FOG_OF_WAR_DISTANCE, 0, validLocks).forEach(
      (n) => {
        if (!prevMap.get(n)?.visible) {
          // NOTE(bowei): fuck, this doesnt cause a update to be propagated... i guess it's fine though
          prevGameState.worldGen.lockMap.precompute(n);
          prevMap.put(n, NodeVisibleStatus.true);
        }
      }
    );
  }
  return gameState;
}
