import React from "react";
import { GameState, IntentName, PlayerIntentState } from "../data/GameState";
import { UpdaterGeneratorType2 } from "../lib/util/updaterGenerator";

type Props = {
  updaters: UpdaterGeneratorType2<PlayerIntentState, GameState>;
  intent: PlayerIntentState;
};

type State = {
  keyIntentConfig: keyToIntentMap;
};

// TODO: enumerate all the keyboard keys we care about
type BrowserKeys = string;

/**
 * Holds the mapping of which keyboard keys (as interpreted by the browser)
 * map to which intents, e.g. "up arrow" means "pan left"
 */
type keyToIntentMap = {
  [key in BrowserKeys]?: IntentName;
};

const defaultKeyIntentConfig = {
  w: IntentName.PAN_NORTH,
  a: IntentName.PAN_WEST,
  s: IntentName.PAN_SOUTH,
  d: IntentName.PAN_EAST,
  ArrowUp: IntentName.PAN_NORTH,
  ArrowLeft: IntentName.PAN_WEST,
  ArrowDown: IntentName.PAN_SOUTH,
  ArrowRight: IntentName.PAN_EAST,
  "<": IntentName.TRAVEL_OUT,
  ">": IntentName.TRAVEL_IN,
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

  // NOTE(bowei): does using e.repeat here break when window loses focus??
  handleKeydown = (e: KeyboardEvent) => {
    const { keyIntentConfig } = this.state;
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
    const { keyIntentConfig } = this.state;
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
    return (< > </>)
  }
}
