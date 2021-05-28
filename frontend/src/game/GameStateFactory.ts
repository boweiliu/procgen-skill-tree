import {
  GameState,
  PointNodeRef,
  LockStatus,
  noIntent,
  WindowState,
  NodeTakenStatus,
  NodeReachableStatus,
  NodeVisibleStatus,
} from '../data/GameState';
import { LockData } from '../data/PlayerSaveState';
import {
  HashMap,
  HashSet,
  KeyedHashMap,
} from '../lib/util/data_structures/hash';
import { Vector2 } from '../lib/util/geometry/vector2';
import { Vector3 } from '../lib/util/geometry/vector3';
import { LazyHashMap } from '../lib/util/lazy';
import { computePlayerResourceAmounts } from './ComputeState';
import { getWithinDistance, IReadonlySet } from './lib/HexGrid';
import { ZLevelGenFactory } from './worldGen/WorldGenStateFactory';
import {
  NodeContents,
  NodeContentsFactory,
} from './worldGen/nodeContents/NodeContentsFactory';
import { FOG_OF_WAR_DISTANCE } from './actions/AllocateNode';
import { LockFactory } from './worldGen/LockFactory';

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
    const nodeContentsFactory = new NodeContentsFactory({});
    const nodeContentsMap = new LazyHashMap<Vector3, NodeContents>((k) =>
      nodeContentsFactory.create({ seed: mySeed, location: k })
    );

    const gameState: GameState = {
      tick: 0,
      worldGen: {
        seed: mySeed,
        // deprecated
        zLevels: { 0: zLevel },
        lockMap: lockDataMap,
        nodeContentsMap,
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

        // make sure to allocate the beginning node
        allocationStatusMap: new KeyedHashMap<Vector3, NodeTakenStatus>([
          [Vector3.Zero, NodeTakenStatus.true],
        ]),
      },
      playerUI: {
        selectedPointNode: undefined,
        activeTab: 0,
        isPixiHidden: true,
        virtualGridLocation: Vector3.Zero,
        cursoredNodeLocation: undefined,
        isSidebarOpen: false,
      },
      computed: {},
      intent: {
        activeIntent: noIntent,
        newIntent: noIntent,
        endedIntent: noIntent,
      },
      windowState,
      debug: {
        retriggerVirtualGridDims: () => {},
      },
    };
    gameState.computed = { ...computePlayerResourceAmounts(gameState) };
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

      for (let [
        location,
        lockData,
      ] of prevGameState.worldGen.lockMap.entries()) {
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

    return gameState;
  }
}
