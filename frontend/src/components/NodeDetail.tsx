import React, { useEffect, useState } from "react";
import "./NodeDetail.css";
const a = [1, 2, 3, 4, 5, 6];

export function NodeDetail({ focusedNode }: { focusedNode: {chunk: any, node: any} }) {
  const [history, setHistory] = useState<{ chunk: any, node: any }[]>([]);
  console.log(focusedNode);
  useEffect(() => {
    if (focusedNode.chunk === null) return;
    setHistory((history) => [...history, focusedNode]);
  }, [focusedNode]);
  return (
    <>
      <div className="layout">
        <h1>Current</h1>
        <h3>Chunk: {focusedNode.chunk?.id}</h3>
        <h3>X: {focusedNode.node?.x}</h3>
        <h3>Y: {focusedNode.node?.y}</h3>
        <h2>Previous</h2>
        {history
          
          .map(({ chunk, node }, i) => {
              return (
                <div key={i}>
                  Chunk {chunk?.id} at {node?.x},{node?.y}
                </div>
              );
            })
          
          .reverse()}
      </div>
    </>
  );
}
