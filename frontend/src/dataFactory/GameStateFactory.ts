import { GameState } from "../data/GameState";
import { HashSet } from "../lib/util/data_structures/hash";

export type GameStateConfig = any;

export class GameStateFactory {
  public config: GameStateConfig;

  constructor(config: GameStateConfig) {
    this.config = config;
  }

  public create(): GameState {
    console.log("BOWEI CREATING GAME STATE, should only run once!!")
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
      }
    }
  }
}