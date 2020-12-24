import "./QuestProgress.css"
import React, { useState } from "react";

type Props = {
  remainingPoints: number,
  allocatedPoints: number
}
export default function QuestProgress({
  remainingPoints,
  allocatedPoints
}: Props) {
  let [activeQuest, setActiveQuest] = useState<string | null>(null);

  return (
    <>
      <h2> Available SP: </h2>
      <div>{remainingPoints}</div>
      {(remainingPoints === 0) ? (<div><br></br>(Start a quest first!)</div>) : (<></>) }
      {activeQuest === null ? (<>
        <h2> You have no active quests! </h2>
        <br></br>
        <br></br>
        <button className="button" onClick={() => {
          setActiveQuest("1000 Mana0");
        }}>Get a quest</button>
      </>) : (<>
          <h2> Active quest: </h2>
          <div>Goal: {activeQuest}</div>
          <br></br>
          <div>Current: {'[PLACEHOLDER]'}</div>
          <br></br>
          <div>(Hint: You won't run out of skill points, but they come in batches - try to use the fewest you can!)</div>
          <br></br>
          <h3>Batches so far: </h3>
          <div>{3}</div>
      </>)}
    </>
  );
}
