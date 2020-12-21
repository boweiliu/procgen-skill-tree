import React from "react";
import { GameState } from "./data/GameState";

// should be OK, just remember to populate the context
export const GameContext = React.createContext<GameState>(null as any);