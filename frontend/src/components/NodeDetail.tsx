import React, { useState } from "react";
import "./NodeDetail.css";
const a = [1, 2, 3, 4, 5, 6];

export function NodeDetail({ focusedNode }: { focusedNode: any }) {
  console.log(focusedNode);
  return (
    <>
      <div className="layout">
        <h1>{focusedNode.chunk?.id}</h1>
        {a.map((z) => (
          <div>{z}</div>
        ))}
      </div>
    </>
  );
}
