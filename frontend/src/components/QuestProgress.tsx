import "./QuestProgress.css"
import React from "react";
import { Quest } from "../data/GameState";

type Props = {
  remainingPoints: number,
  createQuestCb: () => void,
  activeQuest: Quest | undefined,
  numBatches: number,
}
export default function QuestProgress({
  activeQuest,
  remainingPoints,
  createQuestCb,
  numBatches,
}: Props) {
  return (
    <>
      {activeQuest === undefined ? (<>
        <h2> You have no active quests! </h2>
        <br></br>
        <br></br>
        <button className="button" onClick={() => {
          createQuestCb();
        }}>Get a quest</button>
        <br></br>
        <br></br>
        <br></br>
      </>) : (<>
          <h2> Active quest: </h2>
          <h3>Goal:</h3>
          <div>{activeQuest.description}</div>
          <br></br>
          <h3>Current:</h3>
          <div>{'[PLACEHOLDER]'}</div>
          <br></br>
          <h3>Reward:</h3>
          <div>{'???'}</div>
          <h3>Batches so far: </h3>
          <div>{numBatches}</div>
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
