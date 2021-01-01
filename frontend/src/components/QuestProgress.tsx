import "./QuestProgress.css";

import classnames from "classnames";
import React, { useState } from "react";
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
type QuestScoreReward = {
  total: number;
  scoreComponents: ScoreComponent[];
};
type ScoreComponent = {
  // inputAmount: number | string;
  // inputTitle: string;
  // outputScore: number;
  // outputDescription: string;
  scoreAmount: number;
  scoreReason: string;
};


export default React.memo(QuestProgressComponent);

function calculateQuestScoreReward(grade: Grade): QuestScoreReward {
  const scoreComponents = [
    {
      scoreReason: 'Quest completed',
      scoreAmount: 50,
    },
    {
      scoreReason: `Efficiency: "${grade}"`,
      scoreAmount: remapEfficiencyGradeToNumber(grade) * 25,
    }
  ];
  const total = scoreComponents.reduce((pv, cv) => pv + cv.scoreAmount, 0);
  return {
    total,
    scoreComponents,
  };
}

function QuestProgressComponent({
  activeQuest,
  spSpentThisQuest,
  createQuestCb,
  playerResourceAmounts,
  updaters,
  efficiencyGrade,
  // score,
  questInitialAmount,
}: Props) {
  /**
   * activeQuest === undefined => no active quest, need to start quest
   * isQuestComplete => can finish the quest to generate rewards
   * rewards ready => can accept rewards to increment score; cannot generate a new quest
   */
  const isQuestComplete =
    activeQuest &&
    (playerResourceAmounts?.[activeQuest.resourceType] || 0) >= activeQuest.resourceAmount;

  const [didAcceptRewards, setDidAcceptRewards] = useState(true);
  const [scoreReward, setScoreReward] = useState<QuestScoreReward | undefined>();

  const handleStartQuest = () => {
    createQuestCb();
  };

  const doFinishQuest = () => {
    updaters.activeQuest.enqueueUpdate(() => {
      return undefined;
    });
    setScoreReward(calculateQuestScoreReward(efficiencyGrade));
    setDidAcceptRewards(false);
  };

  const doClaimRewards = () => {
    if (scoreReward) {
      updaters.score.enqueueUpdate((prev) => {
        return prev + scoreReward.total;
      });
      setDidAcceptRewards(true);
    }
  };

  return (
    <>
      {<Score doClaimRewards={doClaimRewards} scoreReward={scoreReward} didAcceptRewards={didAcceptRewards}/>}
      {activeQuest === undefined ? (
        <>
          <h2>No active quest
          </h2>
          <br></br>
          <button className="button" onClick={handleStartQuest} disabled={!didAcceptRewards}>
            {didAcceptRewards ? 'Start a quest' : 'Claim rewards first!'}
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
                <button className="button" onClick={doFinishQuest}>
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
  scoreReward,
  doClaimRewards,
  didAcceptRewards,
}: {
    scoreReward: QuestScoreReward | undefined;
    doClaimRewards: () => void;
    didAcceptRewards: boolean;
}) {
  if (scoreReward === undefined) {
    return (<> </>);
  }

  return (
    <>
      <h3>Quest Rewards</h3>
      <div>+{scoreReward.total} to your score! </div>
      <br></br>
      <table className={classnames({ table: true })}>
        {scoreReward.scoreComponents.map((it) => (
          <tr>
            <td> +{it.scoreAmount} score </td>
            <td> {it.scoreReason} </td>
          </tr>))
        }
      </table>
      <br></br>
      {(
        didAcceptRewards ? (<> </>) : 
          (
      <button
        className="button"
        onClick={() => doClaimRewards()}>
        Claim rewards!
      </button>
          )
      )}
    </>
  );
}

// function formatDelta(d: number): string {
//   return d < 0 ? d.toString() : "+" + d.toString();
// }
