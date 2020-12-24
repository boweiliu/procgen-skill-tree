import React, { useEffect, useState } from "react";
import { PointNodeRef, ResourceModifier, ResourceType, WorldGenState } from "../data/GameState";
import { HashSet } from "../lib/util/data_structures/hash";
import { canAllocate } from "../pixi/components/PointNodeComponent";

type Props = {
  selectedPointNode?: PointNodeRef
  allocatedPointNodeSet: HashSet<PointNodeRef>,
  worldGen: WorldGenState,
}

export function NodeDetail({
  selectedPointNode,
  allocatedPointNodeSet,
  worldGen
}: Props) {
  const [history, setHistory] = useState<PointNodeRef[]>([]);
  useEffect(() => {
    if (!selectedPointNode) return;
    setHistory((history) => [...history, selectedPointNode]);
  }, [selectedPointNode]);

  if (!selectedPointNode) {
    return (<> </>)
  }
  const pointNodeGen = worldGen.zLevels[selectedPointNode.z]!.chunks.get(selectedPointNode.chunkCoord)!.pointNodes.get(selectedPointNode.pointNodeCoord)!
  const isAllocated = (allocatedPointNodeSet.contains(selectedPointNode));
  const canBeAllocated = canAllocate(selectedPointNode, worldGen, allocatedPointNodeSet)
  let nodeDescription: string = "Nothing (empty node)";
  if (pointNodeGen.resourceType !== ResourceType.Nothing) {
    nodeDescription = `${pointNodeGen.resourceAmount} ${pointNodeGen.resourceModifier} ${pointNodeGen.resourceType}`
  }
  return (
    <>
      <h1>Current</h1>
      <div>
        Z: {selectedPointNode.z} . Chunk: {selectedPointNode.chunkCoord.x}, {selectedPointNode.chunkCoord.y} . Node: {selectedPointNode.pointNodeCoord.x}, {selectedPointNode.pointNodeCoord.y} .
      </div>
      <br></br>
      <div>Allocated? {isAllocated ? "yes" : "no"} </div>
      <div>Can be allocated? {canBeAllocated ? (<>yes</>) : (<b>no</b>)} </div>
      <br></br>
      <div> Stats: </div>
      <div> {nodeDescription} </div>
      <h2>Previous</h2>
      {history
        .slice(0, -1)
        .map((pointNodeRef: PointNodeRef, i) => {
          return (
            <div key={i}>
              Chunk ({pointNodeRef.chunkCoord.x},{pointNodeRef.chunkCoord.y}) at ({pointNodeRef.pointNodeCoord.x},
              {pointNodeRef.pointNodeCoord.y})
            </div>
          );
        })
        .reverse()}
    </>
  );
}
