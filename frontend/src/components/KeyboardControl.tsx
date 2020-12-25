import React from "react";
import { GameState, IntentName, PlayerIntentState } from "../data/GameState";
import { UpdaterGeneratorType2 } from "../lib/util/updaterGenerator";
type Props = {
  updaters: UpdaterGeneratorType2<GameState>["intent"];
  intent: PlayerIntentState;
};
type keyToIntentMap = {
  [key in BrowserKeys]: IntentName;
};
type BrowserKeys = string;

const defaultKeyIntentConfig = {
  ArrowUp: IntentName.PAN_UP,
  ArrowLeft: IntentName.PAN_LEFT,
  ArrowDown: IntentName.PAN_DOWN,
  ArrowRight: IntentName.PAN_RIGHT,
  "<": IntentName.TRAVEL_OUT,
  ">": IntentName.TRAVEL_IN,
};
type State = {
  keyIntentConfig: keyToIntentMap;
};
export class KeyboardControlComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      keyIntentConfig: defaultKeyIntentConfig,
    };
    document.addEventListener("keydown", this.handleKeydown);
    document.addEventListener("keyup", this.handleKeyup);
  }
  handleKeydown = (e: KeyboardEvent) => {
    const keyIntentConfig = this.state.keyIntentConfig;
    const key: BrowserKeys = e.key;
    const configuredIntent = keyIntentConfig[key];
    if (
      e.repeat === false &&
      configuredIntent !== undefined &&
      configuredIntent !== IntentName.NOOP
    ) {
      this.props.updaters.newIntent[configuredIntent].enqueueUpdate(() => {
        this.props.updaters.newIntent[configuredIntent].enqueueUpdate(
          () => false
        );
        return true;
      });
      this.props.updaters.activeIntent[configuredIntent].enqueueUpdate(
        () => true
      );
    }
  };
  handleKeyup = (e: KeyboardEvent) => {
    const keyIntentConfig = this.state.keyIntentConfig;
    const key: BrowserKeys = e.key;
    const configuredIntent = keyIntentConfig[key];
    if (
      configuredIntent !== undefined &&
      configuredIntent !== IntentName.NOOP
    ) {
      this.props.updaters.activeIntent[configuredIntent].enqueueUpdate(
        () => false
      );
      this.props.updaters.endedIntent[configuredIntent].enqueueUpdate(() => {
        this.props.updaters.endedIntent[configuredIntent].enqueueUpdate(
          () => false
        );
        return true;
      });
    }
  };
  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeydown);
    document.removeEventListener("keyup", this.handleKeyup);
  }
  render() {
    return "hi";
  }
}