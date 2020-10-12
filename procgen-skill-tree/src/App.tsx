import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { Area } from "./components/Area";

function App() {
  return (
    <div className="App">
      Hi stuff is here
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
      <Area />
    </div>
  );
}

export default App;
