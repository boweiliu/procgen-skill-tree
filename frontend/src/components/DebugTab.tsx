import React, { useEffect, useState } from "react";
import { ComputedState, PointNodeRef, ResourceType, WorldGenState } from "../data/GameState";
import { HashSet } from "../lib/util/data_structures/hash";
import { canAllocate } from "../game/Neighbors";
import { computePlayerResourceAmounts } from "../game/ComputeState";

type Props = {
  selectedPointNode?: PointNodeRef
  allocatedPointNodeSet: HashSet<PointNodeRef>,
  worldGen: WorldGenState,
  availableSp: number,
  computed: ComputedState
}

export function DebugTab({
  selectedPointNode,
  allocatedPointNodeSet,
  worldGen,
  availableSp,
  computed
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
  const canBeAllocated: string = canAllocate(selectedPointNode, worldGen, allocatedPointNodeSet, availableSp);
  let nodeDescription: string = "Nothing (empty node)";
  if (pointNodeGen.resourceType !== ResourceType.Nothing) {
    nodeDescription = `${pointNodeGen.resourceAmount} ${pointNodeGen.resourceModifier} ${pointNodeGen.resourceType}`
  }
  return (
    <>
      <h3>Player resources</h3> 
      {JSON.stringify(computed.playerResourceAmounts)}
      <h3>Current Node</h3>
      <div>
        Z={selectedPointNode.z}
      </div>
      <div>
        Chunk={selectedPointNode.chunkCoord.x},{selectedPointNode.chunkCoord.y}
      </div>
      <div>
        Node={selectedPointNode.pointNodeCoord.x},{selectedPointNode.pointNodeCoord.y}
      </div>
      <br></br>
      <div>Allocated? <br />{isAllocated ? "yes" : "no"} </div>
      <br></br>
      <div>Can be allocated? <br />{canBeAllocated} </div>
      <br></br>
      <div> Stats: </div>
      <div> {nodeDescription} </div>
      <h3>Previous</h3>
      {history
        .slice(0, -1)
        .map((pointNodeRef: PointNodeRef, i) => {
          return (
            <div key={i}>
              <div>
                Z={pointNodeRef.z} { }
                Chunk={pointNodeRef.chunkCoord.x},{pointNodeRef.chunkCoord.y} { }
                Node={pointNodeRef.pointNodeCoord.x},{pointNodeRef.pointNodeCoord.y}
              </div>
            </div>
          );
        })
        .reverse()}
    </>
  );
}

