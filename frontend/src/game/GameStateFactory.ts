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
  ERA_1_ACCESSIBLE_RADIUS,
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

  gameState.computed.accessibleStatusMap = markAccessibleNodes(
    gameState.computed.accessibleStatusMap,
    gameState
  );

  gameState.computed.reachableStatusMap = markReachableNodes(
    gameState.computed.reachableStatusMap,
    gameState
  );

  gameState.computed.fogOfWarStatusMap = markVisibleNodes(
    gameState.computed.fogOfWarStatusMap,
    gameState
  );

  // now fog of war flow vision based on computed lock statuses
  //   {
  //     let prevMap = gameState.computed.fogOfWarStatusMap;
  //     // let newStatus = NodeAllocatedStatus.TAKEN;
  //     const prevGameState = gameState;
  //
  //
  //     gameState.playerSave.allocationStatusMap
  //       .entries()
  //       .filter(([loc, status]) => {
  //         return status.taken === true;
  //       })
  //       .map((it) => it[0])
  //       .forEach((nodeLocation) => {
  //         prevMap.put(nodeLocation, NodeVisibleStatus.true);
  //
  //         getWithinDistance(nodeLocation, 1).forEach((n) => {
  //           prevMap.put(n, NodeVisibleStatus.true);
  //         });
  //
  //         // make sure we make use of lock state
  //         // getWithinDistance(nodeLocation, 3).forEach((n) => {
  //         // const validLocks = prevGameState.worldGen.lockMap
  //         const validLocks: IReadonlySet<Vector3> = {
  //           // TODO(bowei): optimize this?
  //           contains: (v: Vector3) => {
  //             const lockData = prevGameState.worldGen.lockMap.get(v);
  //             const lockStatus = prevGameState.computed.lockStatusMap?.get(v);
  //             const isLocked = !!lockData && lockStatus !== LockStatus.OPEN;
  //             if (isLocked) {
  //               return true;
  //             }
  //             return false;
  //           },
  //         };
  //         getWithinDistance(
  //           nodeLocation,
  //           FOG_OF_WAR_DISTANCE,
  //           0,
  //           validLocks
  //         ).forEach((n) => {
  //           if (!prevMap.get(n)?.visible) {
  //             // NOTE(bowei): fuck, this doesnt cause a update to be propagated... i guess it's fine though
  //             prevGameState.worldGen.lockMap.precompute(n);
  //             prevMap.put(n, NodeVisibleStatus.true);
  //           }
  //         });
  //       });
  //   }

  return gameState;
}

/**
 * Updates accessible computed map based on distance from the starting node.
 * @param prev
 * @param prevGameState
 * @returns
 */
export function markAccessibleNodes(
  prev: HashMap<Vector3, NodeAccessibleStatus> | null,
  prevGameState: Const<GameState>
): HashMap<Vector3, NodeAccessibleStatus> | null {
  if (!prev) {
    return prev;
  }

  let result: typeof prev | null = null;

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
    ERA_1_ACCESSIBLE_RADIUS,
    0,
    validLocks
  ).forEach((n) => {
    if (prev.get(n)?.accessible !== true) {
      result = result || prev.clone();
      result.put(n, { accessible: true });
    }
  });

  return result || prev;
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
      getWithinDistance(nodeLocation, 1).forEach((n) => {
        if (
          prevGameState.computed.accessibleStatusMap?.get(n)?.accessible !==
          true
        ) {
          return;
        }
        if (prev.get(n)?.reachable !== true) {
          result = result || prev.clone();
          result.put(n, NodeReachableStatus.true);
        }
      });
    });

  return result || prev;
}

export function markVisibleNodes(
  prev: HashMap<Vector3, NodeVisibleStatus> | null,
  prevGameState: Const<GameState>
): HashMap<Vector3, NodeVisibleStatus> | null {
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
      result = flowFogOfWarFromNode({
        result,
        prev,
        prevGameState,
        nodeLocation,
      });

      // if (prev.get(nodeLocation)?.visible !== true) {
      //   result = result || prev.clone();
      //   result.put(nodeLocation, NodeVisibleStatus.true);
      // }

      // getWithinDistance(nodeLocation, 1).forEach((n) => {
      //   if (prevGameState.computed.accessibleStatusMap?.get(n)?.accessible !== true) {
      //     return;
      //   }
      //   if (prev.get(n)?.visible !== true) {
      //     result = result || prev.clone();
      //     result.put(n, NodeVisibleStatus.true);
      //   }
      // });

      // // make sure we make use of lock state
      // // getWithinDistance(nodeLocation, 3).forEach((n) => {
      // // const validLocks = prevGameState.worldGen.lockMap
      // const validLocks: IReadonlySet<Vector3> = {
      //   // TODO(bowei): optimize this?
      //   contains: (v: Vector3) => {
      //     const lockData = prevGameState.worldGen.lockMap.get(v);
      //     const lockStatus = prevGameState.computed.lockStatusMap?.get(v);
      //     const isLocked = !!lockData && lockStatus !== LockStatus.OPEN;
      //     const isAccessible =
      //       !!prevGameState.computed.accessibleStatusMap?.get(v)?.accessible;
      //     if (isLocked || !isAccessible) {
      //       return true;
      //     }
      //     return false;
      //   },
      // };
      // getWithinDistance(
      //   nodeLocation,
      //   FOG_OF_WAR_DISTANCE,
      //   0,
      //   validLocks
      // ).forEach((n) => {
      //   if (!prevMap.get(n)?.visible) {
      //     // NOTE(bowei): fuck, this doesnt cause a update to be propagated... i guess it's fine though
      //     prevGameState.worldGen.lockMap.precompute(n);
      //     prevMap.put(n, NodeVisibleStatus.true);
      //   }
      // });
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

  if (prev.get(nodeLocation)?.visible !== true) {
    result = result || prev.clone(); // clone if we haven't already
    result.put(nodeLocation, NodeVisibleStatus.true);
  }

  // make sure locks within distance 1 are set to visible
  getWithinDistance(nodeLocation, 1).forEach((n) => {
    if (
      prevGameState.computed.accessibleStatusMap?.get(n)?.accessible !== true
    ) {
      return;
    }
    if (prev.get(n)?.visible !== true) {
      result = result || prev.clone();
      result.put(n, NodeVisibleStatus.true);
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
  getWithinDistance(nodeLocation, FOG_OF_WAR_DISTANCE, 0, validLocks).forEach(
    (n) => {
      if (
        prevGameState.computed.accessibleStatusMap?.get(n)?.accessible !== true
      ) {
        return;
      }

      // NOTE(bowei): fuck, this doesnt cause a update to be propagated... i guess it's fine though
      prevGameState.worldGen.lockMap.precompute(n);

      if (prev.get(n)?.visible !== true) {
        result = result || prev.clone();
        result.put(n, NodeVisibleStatus.true);
      }
    }
  );

  return result;
}
