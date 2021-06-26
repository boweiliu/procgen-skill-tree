import React from 'react';
import { GameState } from '../data/GameState';
import { IntentName, PlayerIntentState } from '../data/PlayerIntentState';
import { UpdaterGeneratorType2 } from '../lib/util/updaterGenerator';

type Props = {
  updaters: UpdaterGeneratorType2<PlayerIntentState, GameState>;
  isTextBoxFocused: boolean;
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
  // ArrowUp: IntentName.PAN_NORTH,
  // ArrowLeft: IntentName.PAN_WEST,
  // ArrowDown: IntentName.PAN_SOUTH,
  // ArrowRight: IntentName.PAN_EAST,
  w: IntentName.PAN_NORTH,
  a: IntentName.PAN_WEST,
  s: IntentName.PAN_SOUTH,
  d: IntentName.PAN_EAST,
  k: IntentName.PAN_NORTH,
  h: IntentName.PAN_WEST,
  j: IntentName.PAN_SOUTH,
  l: IntentName.PAN_EAST,
  m: IntentName.TOGGLE_STRATEGIC_VIEW,
  // i: IntentName.TOGGLE_SIDEBAR,
  t: IntentName.TOGGLE_LEFT_SIDEBAR,
  y: IntentName.TOGGLE_RIGHT_SIDEBAR,
  Escape: IntentName.TURN_OFF_SIDEBAR,
  // w: IntentName.MOVE_CURSOR_NORTH,
  // a: IntentName.MOVE_CURSOR_WEST,
  // s: IntentName.MOVE_CURSOR_SOUTH,
  // d: IntentName.MOVE_CURSOR_EAST,
  ArrowUp: IntentName.MOVE_CURSOR_NORTH,
  ArrowLeft: IntentName.MOVE_CURSOR_WEST,
  ArrowDown: IntentName.MOVE_CURSOR_SOUTH,
  ArrowRight: IntentName.MOVE_CURSOR_EAST,
  // q: IntentName.MOVE_CURSOR_NORTHWEST,
  // e: IntentName.MOVE_CURSOR_NORTHEAST,
  // z: IntentName.MOVE_CURSOR_SOUTHWEST,
  // x: IntentName.MOVE_CURSOR_SOUTHEAST,
  // c: IntentName.MOVE_CURSOR_SOUTHEAST,
  ' ': IntentName.INTERACT_WITH_NODE,
  z: IntentName.ZOOM_RECENTER_AT_NODE,
  '<': IntentName.TRAVEL_UPSTAIRS,
  '>': IntentName.TRAVEL_DOWNSTAIRS,
};

/**
 * Empty react element with listeners for keyboard actions.
 */
export class KeyboardListenerComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      keyIntentConfig: defaultKeyIntentConfig,
    };
  }

  componentDidMount() {
    // console.log('adding event listeners for keyboard component');
    document.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('keyup', this.handleKeyup);
  }

  // NOTE(bowei): does using e.repeat here break when window loses focus??
  handleKeydown = (e: KeyboardEvent) => {
    const { keyIntentConfig } = this.state;
    const key: BrowserKeys = e.key;
    const configuredIntent = keyIntentConfig[key];
    if (configuredIntent) {
      if (this.props.isTextBoxFocused) {
        console.log(
          'bypassing keyboard event processing because text box is focused'
        );
        return;
      } else {
        // console.log("skipping default on keyboard event because text box is not focused");
        e.preventDefault();
      }
    } else {
      console.log('Unregistered key ', key);
    }

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
    // console.log('removing event listeners for keyboard component');
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('keyup', this.handleKeyup);
  }

  render() {
    return <> </>;
  }
}
