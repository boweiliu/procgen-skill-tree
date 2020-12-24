import React, { useEffect, useState } from "react";
import { PointNodeRef, WorldGenState } from "../data/GameState";
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
  const isAllocated = (allocatedPointNodeSet.contains(selectedPointNode));
  const canBeAllocated = canAllocate(selectedPointNode, worldGen, allocatedPointNodeSet)
  return (
    <>
      <h1>Current</h1>
      <h3>
        Chunk: {selectedPointNode.chunkCoord.x},{selectedPointNode.chunkCoord.y}
      </h3>
      <h3>X: {selectedPointNode.pointNodeCoord.x}</h3>
      <h3>Y: {selectedPointNode.pointNodeCoord.y}</h3>
      <div>Allocated? {isAllocated ? "yes" : "no"} </div>
      <div>Can be allocated? {canBeAllocated ? (<>yes</>) : (<b>no</b>)} </div>
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
