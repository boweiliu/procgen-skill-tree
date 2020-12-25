import "./QuestProgress.css"
import React from "react";
import { Quest, ResourceType } from "../data/GameState";
import classnames from "classnames";

type Props = {
  remainingPoints: number,
  createQuestCb: () => void,
  activeQuest: Quest | undefined,
  numBatches: number,
  playerResourceAmounts?: { [k in ResourceType]: number },
}
export default function QuestProgress({
  activeQuest,
  remainingPoints,
  createQuestCb,
  numBatches,
  playerResourceAmounts,
}: Props) {

  const isQuestComplete = activeQuest && (playerResourceAmounts?.[activeQuest.resourceType] || 0) >= activeQuest.resourceAmount;
  const doClaimReward = () => {
    window.alert("your score increased by 831!");
  };
  return (
    <>
      {activeQuest === undefined ? (<>
        <h2> You have no <br />active quests! </h2>
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
          <div>{activeQuest.resourceAmount} {activeQuest.resourceType}</div>
          <br></br>
          <h3>Current:</h3>
          <div className={classnames({ good: isQuestComplete })}>{playerResourceAmounts?.[activeQuest.resourceType]} {activeQuest.resourceType}</div>
          <br></br>
          <h3>Efficiency:</h3>
          <div>{'SS'}</div>
          { isQuestComplete ? (<>
            <br></br>
            <button className="button" onClick={() => {
              doClaimReward();
            }}>
              Claim reward
            </button>
          </>) : (<></>)}
          <h3>Batches so far: </h3>
          <div>{numBatches}</div>
          <br></br>
          <div>(Hint: You won't run <br />out of skill points, but<br /> they come in batches -<br />
          try to use the <br /> fewest you can!)</div>
        </>)}
      <br></br>
      <h3> Available SP: </h3>
      <div>{remainingPoints}</div>
      {(remainingPoints === 0) ? (<div><br></br>(Start a quest first!)</div>) : (<></>) }
    </>
  );
}
