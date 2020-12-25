import { ComputedState, GameState, ResourceModifier, ResourceNontrivialType, ResourceType, ResourceTypeAndModifier } from "../data/GameState";
import { HashMap } from "../lib/util/data_structures/hash";
import { enumKeys } from "../lib/util/misc";

export function computePlayerResourceAmounts(gameState: GameState): ComputedState {
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
    
    playerResourceNodesAggregated.put(resourceTypeAndModifier,
      (playerResourceNodesAggregated.get(resourceTypeAndModifier) || 0) + pointNodeGen.resourceAmount);
  }

  // Do the +flat, %increased, etc. calculations here

  for (let key of enumKeys(ResourceNontrivialType)) {
    // iterate throu
    let amount = playerResourceNodesAggregated.get(new ResourceTypeAndModifier({
      type: key,
      modifier: ResourceModifier.Flat
    })) || 0;
    amount *= (1 + (playerResourceNodesAggregated.get(new ResourceTypeAndModifier({
      type: key,
      modifier: ResourceModifier.Increased0,
    })) || 0));
    amount += playerResourceNodesAggregated.get(new ResourceTypeAndModifier({
      type: key,
      modifier: ResourceModifier.AfterIncreased0
    })) || 0;
    amount *= (1 + (playerResourceNodesAggregated.get(new ResourceTypeAndModifier({
      type: key,
      modifier: ResourceModifier.Increased1,
    })) || 0));
    amount += playerResourceNodesAggregated.get(new ResourceTypeAndModifier({
      type: key,
      modifier: ResourceModifier.AfterIncreased1
    })) || 0;
    amounts[key] = amount;
  }

  return {
    playerResourceAmounts: amounts as { [k in ResourceType]: number },
    playerResourceNodesAggregated
  };
}