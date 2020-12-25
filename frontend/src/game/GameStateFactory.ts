import { GameState, PointNodeRef } from "../data/GameState";
import { HashSet } from "../lib/util/data_structures/hash";
import { Vector2 } from "../lib/util/geometry/vector2";
import { assertOnlyCalledOnce } from "../lib/util/misc";
import { ZLevelGenFactory } from "./WorldGenStateFactory";

export type GameStateConfig = any;

export class GameStateFactory {
  public config: GameStateConfig;

  constructor(config: GameStateConfig) {
    this.config = config;
  }

  public create(seed: number | undefined | null = undefined): GameState {
    if (seed === undefined) {
      assertOnlyCalledOnce("GameStateFactory.create");
    }
    const mySeed = seed || 0x19283;

    const zLevel = new ZLevelGenFactory({}).create({ seed: mySeed, z: 0, startingChunks: 0 });
    const origin = new Vector2(0, 0);
    const firstId = zLevel.chunks.get(origin)?.pointNodes.get(origin)?.id!
    const pointNodeRef: PointNodeRef = new PointNodeRef({
      z: 0,
      chunkCoord: origin,
      pointNodeId: firstId,
      pointNodeCoord: origin
    });

    return {
      worldGen: {
        seed: mySeed,
        zLevels: { 0: zLevel },
      },
      playerSave: {
        availableSp: 0,
        // justAllocated: undefined,
        activeQuest: undefined,
        batchesSinceQuestStart: 0,
        allocatedPointNodeSet: new HashSet([pointNodeRef]),
        allocatedPointNodeHistory: [pointNodeRef],
      },
      playerUI: {
        selectedPointNode: undefined,
        activeTab: 0
      },
      computed: {}
    }
  }
}