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
      {activeQuest === null ? (<>
        <h2> You have no active quests! </h2>
        <br></br>
        <br></br>
        <button className="button" onClick={() => {
          setActiveQuest("1000 Mana0");
        }}>Get a quest</button>
        <br></br>
        <br></br>
        <br></br>
      </>) : (<>
          <h2> Active quest: </h2>
          <h3>Goal:</h3>
          <div>{activeQuest}</div>
          <br></br>
          <h3>Current:</h3>
          <div>{'[PLACEHOLDER]'}</div>
          <br></br>
          <h3>Reward:</h3>
          <div>{'???'}</div>
          <h3>Batches so far: </h3>
          <div>{3}</div>
          <br></br>
          <div>(Hint: You won't run out of skill points, but they come in batches - try to use the fewest you can!)</div>
        </>)}
      <br></br>
      <h3> Available SP: </h3>
      <div>{remainingPoints}</div>
      {(remainingPoints === 0) ? (<div><br></br>(Start a quest first!)</div>) : (<></>) }
    </>
  );
}
