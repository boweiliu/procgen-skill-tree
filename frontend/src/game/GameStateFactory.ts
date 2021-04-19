import {
  LockStatus,
  NodeAllocatedStatus,
} from '../components/GameArea/GameAreaComponent';
import {
  GameState,
  PointNodeRef,
  noIntent,
  WindowState,
} from '../data/GameState';
import { LockData } from '../data/PlayerSaveState';
import {
  HashMap,
  HashSet,
  KeyedHashMap,
} from '../lib/util/data_structures/hash';
import { Vector2 } from '../lib/util/geometry/vector2';
import { Vector3 } from '../lib/util/geometry/vector3';
import { assertOnlyCalledOnce } from '../lib/util/misc';
import { Lazy, LazyHashMap } from '../lib/util/lazy';
import { computePlayerResourceAmounts } from './ComputeState';
import {
  getCoordNeighbors,
  getWithinDistance,
  IReadonlySet,
} from './lib/HexGrid';
import { LockFactory, ZLevelGenFactory } from './WorldGenStateFactory';

export type GameStateConfig = any;

export class GameStateFactory {
  public config: GameStateConfig;

  constructor(config: GameStateConfig) {
    this.config = config;
  }

  public create(seed: number | undefined | null = undefined): GameState {
    if (seed === undefined) {
      // assertOnlyCalledOnce("GameStateFactory.create");
    }
    const mySeed = seed || 0x19283;

    const zLevel = new ZLevelGenFactory({}).create({
      seed: mySeed,
      z: 0,
      startingChunks: 0,
    });
    const origin = new Vector2(0, 0);
    const firstId = zLevel.chunks.get(origin)?.pointNodes.get(origin)?.id!;
    const pointNodeRef: PointNodeRef = new PointNodeRef({
      z: 0,
      chunkCoord: origin,
      pointNodeId: firstId,
      pointNodeCoord: origin,
    });

    const windowState: WindowState = {
      orientation: 'original',
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    };

    const lockFactory = new LockFactory({});
    const lockDataMap = new LazyHashMap<Vector3, LockData | undefined>((k) =>
      lockFactory.create({ seed: mySeed, location: k })
    );

    const gameState: GameState = {
      tick: 0,
      worldGen: {
        seed: mySeed,
        // deprecated
        zLevels: { 0: zLevel },
        lockMap: lockDataMap,
      },
      playerSave: {
        // justAllocated: undefined,
        activeQuest: undefined,
        spSpentThisQuest: undefined,
        questProgressHistory: [],
        questInitialAmount: 0,
        questsCompleted: [],
        allocatedPointNodeSet: new HashSet([pointNodeRef]),
        allocatedPointNodeHistory: [pointNodeRef],
        score: 0,

        allocationStatusMap: new KeyedHashMap<Vector3, NodeAllocatedStatus>([
          [Vector3.Zero, NodeAllocatedStatus.TAKEN],
        ]),
      },
      playerUI: {
        selectedPointNode: undefined,
        activeTab: 0,
        isPixiHidden: true,
        virtualGridLocation: Vector3.Zero,
      },
      computed: {},
      intent: {
        activeIntent: noIntent,
        newIntent: noIntent,
        endedIntent: noIntent,
      },
      windowState,
    };
    gameState.computed = { ...computePlayerResourceAmounts(gameState) };
    gameState.computed.lockStatusMap = new HashMap();
    gameState.computed.fogOfWarStatusMap = new HashMap();

    /**
     * Initialize fog of war and visible locks
     */
    // let prevMap = gameState.playerSave.allocationStatusMap;
    let prevMap = gameState.computed.fogOfWarStatusMap;
    let nodeLocation = Vector3.Zero;
    let newStatus = NodeAllocatedStatus.TAKEN;
    const prevGameState = gameState;

    prevMap.put(nodeLocation, NodeAllocatedStatus.VISIBLE);

    getWithinDistance(nodeLocation, 1).forEach((n) => {
      if (prevMap.get(n) === NodeAllocatedStatus.UNREACHABLE) {
        prevMap.put(n, NodeAllocatedStatus.AVAILABLE);
      }
    });

    // make sure we make use of lock state
    // getWithinDistance(nodeLocation, 3).forEach((n) => {
    // const validLocks = prevGameState.worldGen.lockMap
    const validLocks: IReadonlySet<Vector3> = {
      contains: (v: Vector3) => {
        const maybeLock = prevGameState.worldGen.lockMap.get(v);
        if (maybeLock && maybeLock.lockStatus !== LockStatus.OPEN) {
          return true;
        }
        return false;
      },
    };
    getWithinDistance(nodeLocation, 3, 0, validLocks).forEach((n) => {
      if (
        (prevMap.get(n) || NodeAllocatedStatus.HIDDEN) ===
        NodeAllocatedStatus.HIDDEN
      ) {
        // NOTE(bowei): fuck, this doesnt cause a update to be propagated... i guess it's fine though
        // prevGameState.worldGen.lockMap.precompute(n);
        prevMap.put(n, NodeAllocatedStatus.UNREACHABLE);
      }
    });

    return gameState;
  }
}
