import "./App.css";

import React, { useCallback, useState } from "react";
import { NodeDetail } from "./components/NodeDetail";
import { PixiComponent } from "./components/PixiComponent";

function App() {
  const [focusedNode, setFocusedNode] = useState({ chunk: null, node: null });
  const handleFocusedNodeChange = useCallback(
    (chunk, node) => {
      console.log("asdf");
      setFocusedNode({ chunk, node });
    },
    [setFocusedNode]
  );
  return (
    <div className="App">
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
  </header> */}
      <PixiComponent onFocusedNodeChange={handleFocusedNodeChange} />
      <NodeDetail focusedNode={focusedNode} />
    </div>
  );
}

export default App;
