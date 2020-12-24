import { GameState } from "../data/GameState";
import { HashSet } from "../lib/util/data_structures/hash";
import { assertOnlyCalledOnce } from "../lib/util/misc";

export type GameStateConfig = any;

export class GameStateFactory {
  public config: GameStateConfig;

  constructor(config: GameStateConfig) {
    this.config = config;
  }

  public create(): GameState {
    assertOnlyCalledOnce("GameStateFactory.create");
    return {
      worldGen: {
        seed: 0xcafebabe,
        zLevels: []
      },
      playerSave: {
        // selectedPointNodeHistory: [],
        allocatedPointNodeSet: new HashSet(),
        allocatedPointNodeHistory: []
      },
      playerUI: {
        selectedPointNode: undefined,
        activeTab: 0
      }
    }
  }
}