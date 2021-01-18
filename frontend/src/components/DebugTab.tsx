import React, { useEffect, useState } from "react";
import { ComputedState, PlayerSaveState, PointNodeRef, ResourceType, WorldGenState } from "../data/GameState";
import { HashSet } from "../lib/util/data_structures/hash";
import { canAllocate } from "../game/Neighbors";
import { computeQuestEfficiencyPercent } from "../game/EfficiencyCalculator";

type Props = {
  selectedPointNode?: PointNodeRef
  allocatedPointNodeSet: HashSet<PointNodeRef>,
  worldGen: WorldGenState,
  playerSave: PlayerSaveState,
  computed: ComputedState
}

export function DebugTab({
  selectedPointNode,
  playerSave,
  worldGen,
  computed
}: Props) {
  const { allocatedPointNodeSet} = playerSave;

  let [b64PlayerSaveString, setB64PlayerSaveString] = useState<string>('');
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
  const canBeAllocated: string = canAllocate(selectedPointNode, worldGen, allocatedPointNodeSet, playerSave.activeQuest !== undefined);
  let nodeDescription: string = "Nothing (empty node)";
  if (pointNodeGen.resourceType !== "Nothing") {
    nodeDescription = `${pointNodeGen.resourceAmount} ${pointNodeGen.resourceModifier} ${pointNodeGen.resourceType}`
  }
  return (
    <>
      <h3>Player resources</h3> 
      {JSON.stringify(computed.playerResourceAmounts)}
      <h3>Export to string</h3>
      <div>
      <button onClick={() => {
        // window.alert(btoa(JSON.stringify(playerSave)));
        setB64PlayerSaveString(btoa(JSON.stringify(playerSave, undefined, 2)));
      }}>
        export to base64 {' '}
      </button></div>
      <div>{b64PlayerSaveString}</div>
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
      <h3>efficiency percent</h3>
      {
        computeQuestEfficiencyPercent(playerSave)
      }
      <h3>Quest progress history</h3>
      {
        playerSave.questProgressHistory.length === 0 ? (<> empty </>) : 
        playerSave.questProgressHistory.map((num, i) => {
          return (
            <div key={i}>
              i={i}, quest progress={num}
            </div>
          )
        })
      }
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

