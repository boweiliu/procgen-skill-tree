import {
  GameState,
  ResourceType,
} from "../data/GameState";
import { INTMAX32, squirrel3 } from "../lib/util/random";
import { UpdaterGeneratorType2 } from "../lib/util/updaterGenerator";

export function createQuest(
  updaters: UpdaterGeneratorType2<GameState>,
  gameState: GameState,
  // config: QuestFactoryConfig = {}
) {
  updaters.playerSave.questsCompleted.enqueueUpdate((prev, prevGameState) => {
    let next = [...prev];
    prevGameState.playerSave.activeQuest && next.push(prevGameState.playerSave.activeQuest);
    return next;
  });
  updaters.playerSave.activeQuest.enqueueUpdate((prev, prevGameState) => {
    const numQuestsCompleted = prevGameState.playerSave.questsCompleted.length;
    const totalAllocatedNodes = gameState.computed.playerResourceNodesAggregated?.size() || 5;

    // const r = Math.floor(Math.random() * 3) as 0 | 1 | 2;
    // const resource = Object.values(ResourceNontrivialType)[r];
    const resourceType = ResourceType.Mana0;
    const currentResourceAmount = gameState.computed.playerResourceAmounts?.[resourceType] || 50;

    const historicalAmountPerNode = currentResourceAmount / totalAllocatedNodes; // how much benefit, on average, each node gave

    // we want # of nodes to be quadratic with the # of quests completed
    const targetNumAllocatedNodes = totalAllocatedNodes + Math.round(Math.sqrt(totalAllocatedNodes) * 3 - 2);
    const randomScale = (squirrel3(prevGameState.worldGen.seed + numQuestsCompleted) / INTMAX32) * 0.4 + 0.8; // 0.8 - 1.2

    const resourceAmount = Math.round(targetNumAllocatedNodes * historicalAmountPerNode * randomScale);
    return {
      resourceType,
      resourceAmount,
      description: ""
    };
  });
  updaters.playerSave.batchesSinceQuestStart.enqueueUpdate((prev) => {
    return 1;
  });
  updaters.playerSave.availableSp.enqueueUpdate((prev) => {
    return 1;
  });
  updaters.playerSave.spSpentThisQuest.enqueueUpdate((prev) => {
    return 0;
  });
  updaters.playerSave.questProgressHistory.enqueueUpdate((prev) => {
    return [];
  });
  updaters.playerSave.questInitialAmount.enqueueUpdate((prev, prevGameState) => {
    let resourceType = prevGameState.playerSave.activeQuest?.resourceType
    if (resourceType) {
      let newAmount = prevGameState.computed.playerResourceAmounts?.[resourceType];
      return newAmount || prev;
    }
    return prev;
  });
}

// type QuestFactoryConfig = {};
// export class QuestFactory {
//   public config: QuestFactoryConfig;
// 
//   constructor(config: QuestFactoryConfig) {
//     this.config = config;
//   }
// 
//   public create(
//     resourceType: ResourceType,
//     resourceAmount: number,
//     description: string = ""
//   ): Quest {
//     // console.log(resourceAmount);
//     return {
//       index,
//       description,
//       resourceType,
//       resourceAmount,
//     };
//   }
// }
// 