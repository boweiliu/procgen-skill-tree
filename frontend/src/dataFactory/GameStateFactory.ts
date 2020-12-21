import { GameState, WorldGenState } from "../data/GameState";
import { HashSet } from "../lib/util/data_structures/hash";

export type GameStateConfig = any;

export class GameStateFactory {
  public config: GameStateConfig;

  constructor(config: GameStateConfig) {
    this.config = config;
  }

  public create(): GameState {
    return {
      worldGen: {
        seed: 0xcafebabe,
        zLevels: []
      },
      player: {
        selectedPointNode: undefined,
        selectedPointNodeHistory: [],
        allocatedPointNodeSet: new HashSet(),
        allocatedPointNodeHistory: []
      }
    }
  }
}