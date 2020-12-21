import { GameState } from "../data/GameState";

export type  GameStateConfig = any;
export class GameStateFactory {
  public config: GameStateConfig;

  constructor(config: GameStateConfig) {
    this.config = config;
  }

  public create(): GameState {
    return {
      worldGen: null,
      player: null
    }
  }
}