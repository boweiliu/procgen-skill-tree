import React, { useEffect, useState } from "react";
import { PointNodeRef } from "../data/GameState";

export function NodeDetail({
  selectedPointNode,
}: {
  selectedPointNode?: PointNodeRef
}) {
  const [history, setHistory] = useState<PointNodeRef[]>([]);
  useEffect(() => {
    if (!selectedPointNode) return;
    setHistory((history) => [...history, selectedPointNode]);
  }, [selectedPointNode]);
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
      )}
    </>
  );
}
