import { GameState, ResourceModifier, ResourceType, ResourceTypeAndModifier } from "../data/GameState";
import { HashMap } from "../lib/util/data_structures/hash";
import { enumKeys } from "../lib/util/misc";


export function computePlayerResourceAmounts(gameState: GameState): ({ [k in ResourceType]: number }) {
  let amounts: { [k in ResourceType]?: number } = {};

  let playerResourceNodesAggregated = new HashMap<ResourceTypeAndModifier, number>();

  for (let pointNodeRef of gameState.playerSave.allocatedPointNodeHistory) {
    let pointNodeGen = gameState.worldGen.zLevels[pointNodeRef.z]!.chunks.get(pointNodeRef.chunkCoord)!.pointNodes.get(pointNodeRef.pointNodeCoord)!
    if (pointNodeGen.resourceType === "Nothing") {
      continue;
    }

    let resourceTypeAndModifier = new ResourceTypeAndModifier({
      type: pointNodeGen.resourceType, modifier: pointNodeGen.resourceModifier
    });
  }



  for (let key of enumKeys(ResourceType)) {
    if (key === ResourceType.Nothing) {
      amounts[key] = 0;
      continue;
    }
    // iterate throu
    amounts[key];
  }


  return amounts as { [k in ResourceType]: number }
}