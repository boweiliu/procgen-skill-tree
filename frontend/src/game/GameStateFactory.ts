import { GameState, PointNodeRef, noIntent } from "../data/GameState";
import { HashSet } from "../lib/util/data_structures/hash";
import { Vector2 } from "../lib/util/geometry/vector2";
import { assertOnlyCalledOnce } from "../lib/util/misc";
import { computePlayerResourceAmounts } from "./ComputeState";
import { ZLevelGenFactory } from "./WorldGenStateFactory";

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

    const gameState = {
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
      },
      playerUI: {
        selectedPointNode: undefined,
        activeTab: 0,
      },
      computed: {},
      intent: {
        activeIntent: noIntent,
        newIntent: noIntent,
        endedIntent: noIntent,
      },
    };
    gameState.computed = { ...computePlayerResourceAmounts(gameState) };
    return gameState;
  }
}
