import "./QuestProgress.css";

import classnames from "classnames";
import React, { useEffect, useState } from "react";
import { GameState, Quest, ResourceType } from "../data/GameState";
import { UpdaterGeneratorType2 } from "../lib/util/updaterGenerator";
import { Grade, remapEfficiencyGradeToNumber } from "../game/EfficiencyCalculator";

type Props = {
  spSpentThisQuest: number | undefined;
  createQuestCb: () => void;
  activeQuest: Quest | undefined;
  playerResourceAmounts?: { [k in ResourceType]: number };
  updaters: UpdaterGeneratorType2<GameState, GameState>["playerSave"];
  efficiencyGrade: Grade;
  score: GameState["playerSave"]["score"];
  questInitialAmount: number;
};
type QuestScoreDetails = {
  total: number;
  scoreComponents: ScoreComponent[];
};
type ScoreComponent = {
  inputAmount: number | string;
  inputTitle: string;
  outputScore: number;
  outputDescription: string;
};

export default React.memo(QuestProgressComponent);

function QuestProgressComponent({
  activeQuest,
  spSpentThisQuest,
  createQuestCb,
  playerResourceAmounts,
  updaters,
  efficiencyGrade,
  score,
  questInitialAmount,
}: Props) {
  const [scoreDetails, setScoreDetails] = useState<QuestScoreDetails>({
    total: 0,
    scoreComponents: [],
  });

  const isQuestComplete =
    activeQuest &&
    (playerResourceAmounts?.[activeQuest.resourceType] || 0) >= activeQuest.resourceAmount;

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
      inputAmount: "",
      inputTitle: "efficiency grade: " + efficiencyGrade,
      outputScore: Math.floor(10 / (remapEfficiencyGradeToNumber(efficiencyGrade) + 1)),
      outputDescription: "",
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
      // console.log({ score, lastScore, questScore });
      // console.log("updating score");
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
      {<Score scoreDetails={scoreDetails} />}
      {activeQuest === undefined ? (
        <>
          <h2>No active quest
          </h2>
          <br></br>
          <button className="button" onClick={handleStartQuest}>
            Start a quest
          </button>
          <br></br>
          <br></br>
          <br></br>
        </>
      ) : (
        <>
            <h2> Active quest: </h2>
            <table className={classnames({ table: true })}>
              <tr>
                <td>
                  Initial
                </td>
                <td>
                  {questInitialAmount} {activeQuest.resourceType}
                </td>
              </tr>
              <tr>
                <td>
                  Current
                </td>
                <td>
                  {playerResourceAmounts?.[activeQuest.resourceType]} {activeQuest.resourceType}
                </td>
              </tr>
              <tr>
                <td>
                  Target
                </td>
                <td>
                  {activeQuest.resourceAmount} {activeQuest.resourceType}
                </td>
              </tr>
              <tr>
                <td>
                  SP spent
                </td>
                <td>
                  {spSpentThisQuest === undefined ? "" : spSpentThisQuest}
                </td>
              </tr>
              <tr>
                <td>
                  Efficiency
                </td>
                <td>
                  {efficiencyGrade}
                </td>
              </tr>
            </table>

          {isQuestComplete ? (
            <>
              <br></br>
              <button
                className="button"
                onClick={() => {
                  doClaimReward();
                }}
              >
                Finish quest
              </button>
            </>
          ) : (
            <></>
          )}
        </>
      )}
    </>
  );
}

function Score({
  scoreDetails,
}: {
  scoreDetails: QuestScoreDetails | undefined;
}) {
  const [didAcceptRewards, setDidAcceptRewards] = useState(true);

  useEffect(() => {
    // console.log({ scoreDetails });
    if (!scoreDetails || scoreDetails.total === 0) return;
    setDidAcceptRewards(false);
  }, [scoreDetails]);

  return (
    <>
      {!didAcceptRewards && (
        <>
          <h3>Quest Rewards</h3>
          {!!(scoreDetails?.total) && (
            <> +{scoreDetails?.total} to your score! </>
          )}
          <br></br>
          {scoreDetails?.scoreComponents.map((scoreComponent) => {
            return (
              <React.Fragment key={scoreComponent.inputTitle}>
                <br></br>
                <div>
                  {scoreComponent.outputDescription &&
                    scoreComponent.outputDescription + ": "}
                  {formatDelta(scoreComponent.outputScore)} score for{" "}
                  {scoreComponent.inputAmount} {scoreComponent.inputTitle}
                </div>
                </React.Fragment>
            );
          })}
          <br></br>
          <button onClick={() => setDidAcceptRewards(true)}>Claim rewards!</button>
        </>
      )}
    </>
  );
}

function formatDelta(d: number): string {
  return d < 0 ? d.toString() : "+" + d.toString();
}
