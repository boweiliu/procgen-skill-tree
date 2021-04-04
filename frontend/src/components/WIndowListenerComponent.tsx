import React from "react";
import { GameState, IntentName, PlayerIntentState, WindowState } from "../data/GameState";
import { UpdaterGeneratorType2 } from "../lib/util/updaterGenerator";

type Props = {
  updaters: UpdaterGeneratorType2<WindowState, GameState>;
};

type State = {};

/**
 * Empty react element with listeners for keyboard actions. 
 */
export class WindowListenerComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { };
    window.addEventListener("resize", this.handleWindowResize);
  }

  // NOTE(bowei): does using e.repeat here break when window loses focus??
  handleWindowResize = (e: any) => {
    this.props.updaters.enqueueUpdate(old => {
      // console.log("executing window state update in window onresize in app");
      old.innerWidth = window.innerWidth;
      old.innerHeight = window.innerHeight;
      return { ...old };
    })
  };

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleWindowResize);
  }
  render() {
    return (< > </>)
  }
}
