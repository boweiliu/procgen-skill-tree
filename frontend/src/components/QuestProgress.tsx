import React from "react";

export default function QuestProgress({ remainingPoints }) {
  return (
    <>
      <h1>Quest Progress</h1>
      <h3>
        You have {remainingPoints} skill points left in your current batch
      </h3>
    </>
  );
}
