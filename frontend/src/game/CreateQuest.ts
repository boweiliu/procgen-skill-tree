import { GameState, Quest } from "../data/GameState";
import { UpdaterGeneratorType2 } from "../lib/util/updaterGenerator";


export function createQuest(updaters: UpdaterGeneratorType2<GameState>) {
  updaters.playerSave.activeQuest.enqueueUpdate((prev) => {
    return new QuestFactory({}).create();
  });
  updaters.playerSave.batchesSinceQuestStart.enqueueUpdate((prev) => {
    return 1;
  });
  updaters.playerSave.availableSp.enqueueUpdate((prev) =>  {
    return 5;
  });
}


type QuestFactoryConfig = { }
export class QuestFactory {
  public config: QuestFactoryConfig

  constructor(config: QuestFactoryConfig) {
    this.config = config;
  }

  public create(): Quest {
    return {
      description: "placeholder"
    };
  }

}