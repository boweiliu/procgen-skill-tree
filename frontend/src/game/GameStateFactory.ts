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
import {
  ERA_ACCESSIBLE_RADII,
  FOG_OF_WAR_DISTANCE,
} from './actions/AllocateNode';
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
      computed: {
        lockStatusMap: null,
        fogOfWarStatusMap: null,
        reachableStatusMap: null,
        accessibleStatusMap: null,
      },
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
  gameState.computed.accessibleStatusMap = new HashMap();

  /**
   * Initialize fog of war and visible locks
   */

  // first precompute the nearby lock worldgen parameters
  getWithinDistance(Vector3.Zero, FOG_OF_WAR_DISTANCE).forEach((n) => {
    gameState.worldGen.lockMap.precompute(n);
  });

  // fill in lock statuses with computed statuses
  gameState.computed.lockStatusMap = markLockStatus(
    gameState.computed.lockStatusMap,
    gameState
  );

  // accessible and visible computation makes use of lock information
  gameState.computed.accessibleStatusMap = markAccessibleNodes({
    result: gameState.computed.accessibleStatusMap,
    prev: gameState.computed.accessibleStatusMap,
    prevGameState: gameState,
  });

  gameState.computed.fogOfWarStatusMap = markVisibleNodes(
    gameState.computed.fogOfWarStatusMap,
    gameState
  );

  // reachable depends on visible
  gameState.computed.reachableStatusMap = markReachableNodes(
    gameState.computed.reachableStatusMap,
    gameState
  );

  return gameState;
}

export function markLockStatus(
  prev: Const<HashMap<Vector3, LockStatus | undefined>> | null,
  prevGameState: Const<GameState>
): HashMap<Vector3, LockStatus | undefined> | null {
  if (!prev) {
    return prev;
  }

  let result: HashMap<Vector3, LockStatus | undefined> | null = null;

  for (let [location, lockData] of prevGameState.worldGen.lockMap.entries()) {
    if (lockData) {
      // TODO(bowei): compute lock status
      const newStatus = LockStatus.TICKING;

      if (prev.get(location) !== newStatus) {
        result = result || prev.clone();
        result.put(location, newStatus);
      }
    }
  }

  return result || (prev as unknown as typeof result);
}

/**
 * Updates accessible computed map based on distance from the starting node.
 * @param result mutable temporary storage. null if the state is intended to be the same as prev
 * @param prev the initial state. immutable
 * @param prevGameState immutable
 * @returns the same object reference as result;
 * will be null iff null was passed in as [result], AND no further changes were necessary for the update
 * (i.e. we want to return prev)
 * if null was passed in as [result], but we DID want to make changes, this function returns a clone of [prev] with changes added on top.
 */
export function markAccessibleNodes(args: {
  result: HashMap<Vector3, NodeAccessibleStatus> | null;
  prev: Const<HashMap<Vector3, NodeAccessibleStatus>>;
  prevGameState: Const<GameState>;
}): HashMap<Vector3, NodeAccessibleStatus> | null {
  const { prev, prevGameState } = args;
  let { result } = args;
  // if (!prev) {
  //   return prev;
  // }

  // let result: typeof prev | null = null;

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
    Vector3.Zero,
    ERA_ACCESSIBLE_RADII[prevGameState.playerSave.currentEra.index],
    0,
    validLocks
  ).forEach((n) => {
    if (prev.get(n)?.accessible !== true) {
      result = result || prev.clone();
      result.put(n, { accessible: true });
    }
  });

  return result;
}

export function markReachableNodes(
  prev: HashMap<Vector3, NodeReachableStatus> | null,
  prevGameState: Const<GameState>
): HashMap<Vector3, NodeReachableStatus> | null {
  if (!prev) {
    return prev;
  }

  let result: typeof prev | null = null;

  prevGameState.playerSave.allocationStatusMap
    .entries()
    .filter(([location, status]) => {
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

/**
 *
 * @param result mutable temporary storage. null if the state is intended to be the same as prev
 * @param prev the initial state of reachable status map at the beginning of the update process. immutable
 * @param prevGameState
 * @param nodeLocation which node to flow reachability from
 * @returns the same object reference as result;
 * will be null iff null was passed in as [result], AND no further changes were necessary for the update
 * (i.e. we want to return prev)
 * if null was passed in as [result], but we DID want to make changes, this function returns a clone of [prev] with changes added on top.
 */
export function flowReachableFromNode(args: {
  result: HashMap<Vector3, NodeReachableStatus> | null;
  prev: Const<HashMap<Vector3, NodeReachableStatus>>;
  prevGameState: Const<GameState>;
  nodeLocation: Vector3;
}): HashMap<Vector3, NodeReachableStatus> | null {
  const { prev, prevGameState, nodeLocation } = args;
  let { result } = args;

  getWithinDistance(nodeLocation, 1).forEach((n) => {
    if (
      // prevGameState.computed.accessibleStatusMap?.get(n)?.accessible !== true
      prevGameState.computed.fogOfWarStatusMap?.get(n) !== 'revealed'
    ) {
      return;
    }
    if (prev.get(n)?.reachable !== true) {
      result = result || prev.clone();
      result.put(n, NodeReachableStatus.true);
    }
  });

  return result;
}

export function markVisibleNodes(
  prev: HashMap<Vector3, NodeVisibleStatus> | null,
  prevGameState: Const<GameState>
): HashMap<Vector3, NodeVisibleStatus> | null {
  if (!prev) {
    return prev;
  }

  let result: typeof prev | null = null;

  let nodes = prevGameState.playerSave.allocationStatusMap
    .entries()
    .filter(([location, status]) => {
      return status.taken === true;
    })
    .map((it) => it[0]);

  nodes = nodes.concat(
    prevGameState.playerSave.exploredStatusMap
      .entries()
      .filter(([location, status]) => {
        return status.explored === true;
      })
      .map((it) => it[0])
  );

  nodes.forEach((nodeLocation) => {
    result = flowFogOfWarFromNode({
      result,
      prev: result || prev,
      prevGameState,
      nodeLocation,
    });
  });

  return result || prev;
}

/**
 *
 * @param result mutable temporary storage. null if the state is intended to be the same as prev
 * @param prev the initial state of fog of war status map at the beginning of the update process. immutable
 * @param prevGameState
 * @param nodeLocation which node to flow fog of war from
 * @returns the same object reference as result;
 * will be null iff null was passed in as [result], AND no further changes were necessary for the update
 * (i.e. we want to return prev)
 * if null was passed in as [result], but we DID want to make changes, this function returns a clone of [prev] with changes added on top.
 */
export function flowFogOfWarFromNode(args: {
  result: HashMap<Vector3, NodeVisibleStatus> | null;
  prev: Const<HashMap<Vector3, NodeVisibleStatus>>;
  prevGameState: Const<GameState>;
  nodeLocation: Vector3;
}): HashMap<Vector3, NodeVisibleStatus> | null {
  const { prev, prevGameState, nodeLocation } = args;
  let { result } = args;

  if (prev.get(nodeLocation) !== 'revealed') {
    result = result || prev.clone(); // clone if we haven't already
    result.put(nodeLocation, 'revealed');
  }

  // make sure locks within distance 1 are set to visible
  getWithinDistance(nodeLocation, 1).forEach((n) => {
    if (
      prevGameState.computed.accessibleStatusMap?.get(n)?.accessible !== true
    ) {
      return;
    }
    if (prev.get(n) !== 'revealed') {
      result = result || prev.clone();
      result.put(n, 'revealed');
    }
  });

  // make sure we make use of lock state
  const validLocks: IReadonlySet<Vector3> = {
    // TODO(bowei): optimize this?
    contains: (v: Vector3) => {
      const lockData = prevGameState.worldGen.lockMap.get(v);
      const lockStatus = prevGameState.computed.lockStatusMap?.get(v);
      const isLocked = !!lockData && lockStatus !== LockStatus.OPEN;
      const isAccessible =
        !!prevGameState.computed.accessibleStatusMap?.get(v)?.accessible;
      if (isLocked || !isAccessible) {
        return true;
      }
      return false;
    },
  };

  // flow fog of war, keeping in mind validLocks and accessibility restrictions
  getWithinDistance(nodeLocation, FOG_OF_WAR_DISTANCE, 0, validLocks).forEach(
    (n) => {
      if (
        prevGameState.computed.accessibleStatusMap?.get(n)?.accessible !== true
      ) {
        return;
      }

      // NOTE(bowei): fuck, this doesnt cause a update to be propagated... i guess it's fine though
      prevGameState.worldGen.lockMap.precompute(n);

      if ((prev.get(n) || 'obscured') !== 'revealed') {
        result = result || prev.clone();
        result.put(n, 'revealed');
      }
    }
  );

  // convert obscured nodes just outside fog of war to hinted, iff they are accessible
  getWithinDistance(
    nodeLocation,
    FOG_OF_WAR_DISTANCE + 1,
    FOG_OF_WAR_DISTANCE + 1,
    validLocks
  ).forEach((n) => {
    if (validLocks.contains(n)) {
      return;
    }
    if ((prev.get(n) || 'obscured') === 'obscured') {
      result = result || prev.clone();
      result.put(n, 'hinted');
    }
  });

  return result;
}
