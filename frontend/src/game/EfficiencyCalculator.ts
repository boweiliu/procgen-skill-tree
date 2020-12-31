import { PlayerSaveState } from "../data/GameState";
import { Const } from "../lib/util/misc";


export function computeQuestEfficiencyPercent(playerSave: Const<PlayerSaveState>): number {
  if (playerSave.questProgressHistory.length === 0) {
    return 100;
  }
  let noEffectNodeCount = 0;
  playerSave.questProgressHistory.forEach((num, i, arr) => {
    let prev = (i === 0) ? playerSave.questInitialAmount : arr[i - 1];
    if (num === prev) {
      noEffectNodeCount += 1;
    }
  });
  // guaranteed to be between 0 and 100
  // let noEffectNodePercent = 100 * noEffectNodeCount / (playerSave.questProgressHistory.length); 
  // add a 2-node buffer so efficiency doesnt drop to 0 at the very beginning of a quest
  const noEffectNodeBufferCount = 0.5;
  let noEffectNodePercent = 100 * (noEffectNodeCount) / (playerSave.questProgressHistory.length + noEffectNodeBufferCount); 
  console.log({ noEffectNodeCount, noEffectNodePercent });

  // the baseline we expect effect node percent to be -- influenced by world gen
  // let hasEffectNodePercentBaseline = 100;
  // let hasEffectNodeEfficiencyRaw = Math.min((100 - noEffectNodePercent) / hasEffectNodePercentBaseline * 100, 100);

  return (100 - noEffectNodePercent);
}

export function remapQuestEfficiencyToDisplayable(percent: number): number {
  // remaps the 0-100 percent scale to something that looks better
  // let's try: 5-110, but also 50 -> 80
  let x = percent / 100;
  x = 1 - Math.pow((1 - x), 3);
  x = x * 1.05 + 0.05;
  x = Math.max(0, Math.min(x * 100, 100));
  return x;
}

export function remapQuestEfficiencyToGrade(percent: number): string {
  const displayable = remapQuestEfficiencyToDisplayable(percent);
  // 0 - 100, remap to grades D, C, B, A, S
  if (displayable <= 20) {
    return "D";
  } else if (displayable <= 40) {
    return "C";
  } else if (displayable <= 60) {
    return "B";
  } else if (displayable <= 80) {
    return "A";
  } else {
    return "S";
  }
}