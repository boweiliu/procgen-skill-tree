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
type QuestScoreDetails = {
  total: number;
  scoreComponents: ScoreComponent[];
};
type ScoreComponent = {
  inputAmount: number;
  inputTitle: string;
  outputScore: number;
  outputDescription: string;
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
  const [scoreDetails, setScoreDetails] = useState<QuestScoreDetails>({
    total: 0,
    scoreComponents: [],
  });
  const isQuestComplete =
    activeQuest &&
    (playerResourceAmounts?.[activeQuest.resourceType] || 0) >=
      activeQuest.resourceAmount;
  function calculateQuestScoreDetails() {
    const questScore: { scoreComponents: ScoreComponent[] } = {
      scoreComponents: [],
    };
    questScore.scoreComponents.push({
      inputAmount: 1,
      inputTitle: "quest completed",
      outputScore: 5,
      outputDescription: "",
    });
    questScore.scoreComponents.push({
      inputAmount: numBatches,
      inputTitle: "nodes allocated",
      outputScore: Math.floor(10 / (numBatches + 1)),
      outputDescription: "efficiency",
    });
    const total = questScore.scoreComponents.reduce(
      (subtotal, prev) => subtotal + prev.outputScore,
      0
    );
    console.log(total);
    return { ...questScore, total };
  }
  const doClaimReward = () => {
    const questScore = calculateQuestScoreDetails();
    updaters.score.enqueueUpdate((lastScore) => {
      console.log({ score, lastScore, questScore });
      console.log("updating score");
      return lastScore + questScore.total;
    });
    updaters.activeQuest.enqueueUpdate(() => {
      return undefined;
    });
    setScoreDetails(questScore);
  };
  const handleStartQuest = () => {
    // setOldPoints()
    createQuestCb();
  };
  return (
    <>
      {<Score score={score} scoreDetails={scoreDetails} />}
      {activeQuest === undefined ? (
        <>
          <h2>
            {" "}
            You have no <br />
            active quests!{" "}
          </h2>
          <br></br>
          <br></br>
          <button className="button" onClick={handleStartQuest}>
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

function Score({
  scoreDetails,
  score,
}: {
  score: number;
  scoreDetails: QuestScoreDetails;
}) {
  const [viewed, setViewed] = useState(true);
  useEffect(() => {
    console.log({ scoreDetails });
    if (scoreDetails.total === 0) return;
    setViewed(false);
  }, [scoreDetails]);
  return (
    <>
      {!viewed && (
        <>
          <h3>Score: {score}</h3>
          {!!scoreDetails.total && (
            <h4>Your score increased by {scoreDetails.total}!</h4>
          )}
          {scoreDetails.scoreComponents.map((scoreComponent) => {
            return (
              <React.Fragment key={scoreComponent.inputTitle}>
                <h5>
                  {scoreComponent.outputDescription &&
                    scoreComponent.outputDescription + ": "}
                  {formatDelta(scoreComponent.outputScore)} score for{" "}
                  {scoreComponent.inputAmount} {scoreComponent.inputTitle}
                </h5>
              </React.Fragment>
            );
          })}
          <button onClick={() => setViewed(true)}>OK</button>
        </>
      )}
    </>
  );
}

function formatDelta(d: number): string {
  return d < 0 ? d.toString() : "+" + d.toString();
}
