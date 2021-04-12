import { NodeAllocatedStatus } from '../components/GameArea/GameAreaComponent';
import {
  GameState,
  PointNodeRef,
  noIntent,
  WindowState,
} from '../data/GameState';
import { LockData } from '../data/PlayerSaveState';
import { HashMap, HashSet } from '../lib/util/data_structures/hash';
import { Vector2 } from '../lib/util/geometry/vector2';
import { Vector3 } from '../lib/util/geometry/vector3';
import { assertOnlyCalledOnce } from '../lib/util/misc';
import { Lazy } from '../lib/util/lazy';
import { computePlayerResourceAmounts } from './ComputeState';
import { getCoordNeighbors, getWithinDistance } from './HexGrid';
import { ZLevelGenFactory } from './WorldGenStateFactory';

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

    const gameState: GameState = {
      tick: 0,
      worldGen: {
        seed: mySeed,
        zLevels: { 0: zLevel },
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

        allocationStatusMap: (() => {
          const map = new HashMap<Vector3, NodeAllocatedStatus>();
          getWithinDistance(Vector3.Zero, 3).forEach((it) => {
            map.put(it, NodeAllocatedStatus.UNREACHABLE);
          });
          getWithinDistance(Vector3.Zero, 1).forEach((it) => {
            map.put(it, NodeAllocatedStatus.AVAILABLE);
          });
          map.put(Vector3.Zero, NodeAllocatedStatus.TAKEN);
          return map;
        })(),

        lockMap: (() => {
          const map = new HashMap<
            Vector3,
            LockData | undefined | Lazy<LockData | undefined>
          >();
          return map;
        })(),
      },
      playerUI: {
        selectedPointNode: undefined,
        activeTab: 0,
        isPixiHidden: true,
        virtualGridLocation: new Vector3(0, 0, 0),
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
    return gameState;
  }
}
