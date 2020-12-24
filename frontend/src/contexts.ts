import React from "react";
import { GameState } from "./data/GameState";
import { DeepReadonly, UpdaterGeneratorType } from "./lib/util/misc";

// nullable, but should be OK, just remember to populate the context
// export const GameContext = React.createContext<GameState>(null as any);
// export const GameUpdatersContext = React.createContext<UpdaterGeneratorType<GameState>>(null as any);
export const UseGameStateContext = React.createContext<[DeepReadonly<GameState>, UpdaterGeneratorType<GameState>, () => void]>([] as any);