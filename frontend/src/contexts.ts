import React from "react";
import { GameState } from "./data/GameState";
import { DeepReadonly } from "./lib/util/misc";
import { UpdaterGeneratorType2 } from "./lib/util/updaterGenerator";

// nullable, but should be OK, just remember to populate the context
// export const GameContext = React.createContext<GameState>(null as any);
// export const GameUpdatersContext = React.createContext<UpdaterGeneratorType<GameState>>(null as any);
export const UseGameStateContext = React.createContext<[DeepReadonly<GameState>, UpdaterGeneratorType2<GameState>, () => void]>([] as any);