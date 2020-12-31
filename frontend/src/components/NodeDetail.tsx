import React from "react";
import { PointNodeRef, ResourceType, WorldGenState } from "../data/GameState";
import { canAllocate } from "../game/Neighbors";
import { HashSet } from "../lib/util/data_structures/hash";

type Props = {
  selectedPointNode?: PointNodeRef;
  allocatedPointNodeSet: HashSet<PointNodeRef>;
  worldGen: WorldGenState;
  hasActiveQuest: boolean;
};
export const NodeDetail = React.memo(NodeDetailComponent);
function NodeDetailComponent({
  selectedPointNode,
  allocatedPointNodeSet,
  worldGen,
  hasActiveQuest,
}: Props) {
  if (!selectedPointNode) {
    return (
      <>
        <h1>Stats</h1>
        <div>Select a node first!</div>
      </>
    );
  }
  const pointNodeGen = worldGen.zLevels[selectedPointNode.z]!.chunks.get(
    selectedPointNode.chunkCoord
  )!.pointNodes.get(selectedPointNode.pointNodeCoord)!;
  const isAllocated = allocatedPointNodeSet.contains(selectedPointNode);
  const canBeAllocated: string = canAllocate(
    selectedPointNode,
    worldGen,
    allocatedPointNodeSet,
    hasActiveQuest,
  );
  let nodeDescription: string = "Nothing (empty node)";
  if (pointNodeGen.resourceType !== ResourceType.Nothing) {
    nodeDescription = `${pointNodeGen.resourceAmount} ${pointNodeGen.resourceModifier} ${pointNodeGen.resourceType}`;
  }
  return (
    <>
      <h1>Stats</h1>
      <div> {nodeDescription} </div>
      <h3>Allocated?</h3>
      {isAllocated ? "yes" : "no"}
      <h3>Can be allocated?</h3>
      {canBeAllocated}
    </>
  );
}
