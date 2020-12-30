import {
  GameState,
  Quest,
  ResourceType,
} from "../data/GameState";
import { UpdaterGeneratorType2 } from "../lib/util/updaterGenerator";

export function createQuest(
  updaters: UpdaterGeneratorType2<GameState>,
  gameState: GameState,
  config: QuestFactoryConfig = {}
) {
  updaters.playerSave.activeQuest.enqueueUpdate((prev) => {
    // const r = Math.floor(Math.random() * 3) as 0 | 1 | 2;
    // const resource = Object.values(ResourceNontrivialType)[r];
    const resource = ResourceType.Mana0;
    const currentResource =
      gameState.computed.playerResourceAmounts?.[resource] || 50;
    const totalAllocatedNodes =
      gameState.computed.playerResourceNodesAggregated?.size() ?? 0;
    const scale = 2 + 1 / (totalAllocatedNodes + 1);
    return new QuestFactory(config).create(
      resource,
      Math.round(currentResource * scale)
    );
  });
  updaters.playerSave.batchesSinceQuestStart.enqueueUpdate((prev) => {
    return 1;
  });
  updaters.playerSave.availableSp.enqueueUpdate((prev) => {
    return 5;
  });
  updaters.playerSave.spSpentThisQuest.enqueueUpdate((prev) => {
    return 0;
  });
}

type QuestFactoryConfig = {};
export class QuestFactory {
  public config: QuestFactoryConfig;

  constructor(config: QuestFactoryConfig) {
    this.config = config;
  }

  public create(
    resourceType: ResourceType,
    resourceAmount: number,
    description: string = ""
  ): Quest {
    console.log(resourceAmount);
    return {
      description,
      resourceType,
      resourceAmount,
    };
  }
}
