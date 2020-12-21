import React, { useEffect, useState } from "react";
import { PointNodeRef } from "../data/GameState";

export function NodeDetail({
  selectedPointNode,
}: {
  selectedPointNode?: PointNodeRef
}) {
  // const [history, setHistory] = useState<{ chunk: any; node: any }[]>([]);
  // useEffect(() => {
  //   if (!focusedNode || focusedNode?.chunk === null) return;
  //   setHistory((history) => [...history, focusedNode]);
  // }, [focusedNode]);
  console.log("in nodedetail, ", selectedPointNode);
  return (
    <>
      {selectedPointNode && (
        <>
          <h1>Current</h1>
          <h3>
            Chunk: {selectedPointNode.chunkCoord.x},{selectedPointNode.chunkCoord.y}
          </h3>
          <h3>X: {selectedPointNode.pointNodeCoord.x}</h3>
          <h3>Y: {selectedPointNode.pointNodeCoord.y}</h3>
          <h2>Previous</h2>
          {/* ([] as any)
            .slice(0, -1)
            .map(({ chunk, node }, i) => {
              return (
                <div key={i}>
                  Chunk ({chunk.location.x},{chunk.location.y}) at ({node.x},
                  {node.y})
                </div>
              );
            })
          .reverse() */}
        </>
      )}
    </>
  );
}
