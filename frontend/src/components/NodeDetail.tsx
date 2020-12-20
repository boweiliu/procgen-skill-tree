import React, { useEffect, useState } from "react";
import "./NodeDetail.css";

export function NodeDetail({
  focusedNode,
}: {
  focusedNode?: { chunk: any; node: any };
}) {
  const [history, setHistory] = useState<{ chunk: any; node: any }[]>([]);
  useEffect(() => {
    if (!focusedNode || focusedNode?.chunk === null) return;
    setHistory((history) => [...history, focusedNode]);
  }, [focusedNode]);
  return (
    <>
      <div className="layout">
        {focusedNode && focusedNode.chunk && (
          <>
            <h1>Current</h1>
            <h3>
              Chunk: {focusedNode.chunk.location.x},
              {focusedNode.chunk.location.y}
            </h3>
            <h3>X: {focusedNode.node.x}</h3>
            <h3>Y: {focusedNode.node.y}</h3>
            <h2>Previous</h2>
            {history
              .slice(0, -1)
              .map(({ chunk, node }, i) => {
                return (
                  <div key={i}>
                    Chunk ({chunk.location.x},{chunk.location.y}) at ({node.x},
                    {node.y})
                  </div>
                );
              })
              .reverse()}
          </>
        )}
      </div>
    </>
  );
}
