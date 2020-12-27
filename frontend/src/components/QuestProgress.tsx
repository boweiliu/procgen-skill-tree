import "./QuestProgress.css";

import classnames from "classnames";
import React, { useEffect, useState } from "react";
import { GameState, Quest, ResourceType } from "../data/GameState";
import { UpdaterGeneratorType2 } from "../lib/util/updaterGenerator";

type Props = {
  remainingPoints: number;
  createQuestCb: () => void;
  activeQuest: Quest | undefined;
  numBatches: number;
  playerResourceAmounts?: { [k in ResourceType]: number };
  updaters: UpdaterGeneratorType2<GameState, GameState>["playerSave"];

  score: GameState["playerSave"]["score"];
};
export default React.memo(QuestProgressComponent);
function QuestProgressComponent({
  activeQuest,
  remainingPoints,
  createQuestCb,
  numBatches,
  playerResourceAmounts,
  updaters,
  score,
}: Props) {
  const isQuestComplete =
    activeQuest &&
    (playerResourceAmounts?.[activeQuest.resourceType] || 0) >=
      activeQuest.resourceAmount;
  const doClaimReward = () => {
    // window.alert("your score increased by 831!");
    // const questScore = efficiency;
    const questScore = 831;
    updaters.score.enqueueUpdate((lastScore) => {
      console.log({ score, lastScore });
      console.log("updating score");
      return lastScore + questScore;
    });
    updaters.activeQuest.enqueueUpdate(() => {
      return undefined;
    });
  };
  return (
    <>
      {<Score score={score} />}
      {activeQuest === undefined ? (
        <>
          <h2>
            {" "}
            You have no <br />
            active quests!{" "}
          </h2>
          <br></br>
          <br></br>
          <button
            className="button"
            onClick={() => {
              createQuestCb();
            }}
          >
            Get a quest
          </button>
          <br></br>
          <br></br>
          <br></br>
        </>
      ) : (
        <>
          <h2> Active quest: </h2>
          <h3>Goal:</h3>
          <div>
            {activeQuest.resourceAmount} {activeQuest.resourceType}
          </div>
          <br></br>
          <h3>Current:</h3>
          <div className={classnames({ good: isQuestComplete })}>
            {playerResourceAmounts?.[activeQuest.resourceType]}{" "}
            {activeQuest.resourceType}
          </div>
          <br></br>
          <h3>Efficiency:</h3>
          <div>{"SS"}</div>
          {isQuestComplete ? (
            <>
              <br></br>
              <button
                className="button"
                onClick={() => {
                  doClaimReward();
                }}
              >
                Claim reward
              </button>
            </>
          ) : (
            <></>
          )}
          <h3>Batches so far: </h3>
          <div>{numBatches}</div>
          <br></br>
          <div>
            (Hint: You won't run <br />
            out of skill points, but
            <br /> they come in batches -<br />
            try to use the <br /> fewest you can!)
          </div>
        </>
      )}
      <br></br>
      <h3> Available SP: </h3>
      <div>{remainingPoints}</div>
      {remainingPoints === 0 ? (
        <div>
          <br></br>(Start a quest first!)
        </div>
      ) : (
        <></>
      )}
    </>
  );
}

function Score({ score }: { score: number }) {
  const [lastScore, setLastScore] = useState(0);
  const [delta, setDelta] = useState(0);
  useEffect(() => {
    console.log(`new score received: ${score}`);
    setLastScore((lastScore) => {
      setDelta(() => score - lastScore);
      return score;
    });
  }, [score]);

  return (
    <>
      {!!delta && <h6>Your score increased by {delta}!</h6>}
      {!!score && <h3>Score: {score}</h3>}
    </>
  );
}
