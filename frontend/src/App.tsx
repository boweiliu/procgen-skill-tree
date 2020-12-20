import "./App.css";

import React, { useCallback, useMemo, useState } from "react";
import { NodeDetail } from "./components/NodeDetail";
import { PixiComponent } from "./components/PixiComponent";
import { GameContext, UIContext } from "./contexts";
import { Chunk } from "./pixi/Chunk";
import { Vector2 } from "./lib/util/geometry/vector2";

function App() {
  const [focusedNode, setFocusedNode] = useState < { chunk: Chunk, node: Vector2 }>();
  const uiState = useMemo(() => ({ focusedNode }), [focusedNode]);
  const game = useMemo(() => ({}),[])
  const handleFocusedNodeChange = useCallback(
    (chunk, node) => {
      setFocusedNode({ chunk, node });
    },
    [setFocusedNode]
  );
  return (
    <div className="App">
      <GameContext.Provider value={game}>
        <UIContext.Provider value={uiState}>
            <PixiComponent onFocusedNodeChange={handleFocusedNodeChange} />
            <NodeDetail focusedNode={focusedNode} />
        </UIContext.Provider>
      </GameContext.Provider>
    </div>
  );
}

export default App;
