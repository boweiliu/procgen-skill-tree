import React from "react";

type Props = {
  remainingPoints: number,
  allocatedPoints: number
}
export default function QuestProgress({ remainingPoints, allocatedPoints } : Props) {
  return (
    <>
      <h1>Quest Progress</h1>
      <h3>
        Allocated points so far: {allocatedPoints}
      </h3>
      <h3>
        You have {remainingPoints} skill points left in your current batch
      </h3>
    </>
  );
}
