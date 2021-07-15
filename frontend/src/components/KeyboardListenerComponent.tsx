import React from 'react';
import { GameState } from '../data/GameState';
import {
  defaultKeyIntentConfig,
  IntentName,
  PlayerIntentState,
} from '../data/PlayerIntentState';
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

  transformKey(e: KeyboardEvent): BrowserKeys {
    let key: BrowserKeys = e.key;
    // special case to handle left/right control and alt keys
    if (
      // e.ctrlKey || e.altKey || e.metaKey || e.shiftKey
      key === 'Control' ||
      key === 'Shift' ||
      key === 'Meta' ||
      key === 'Alt'
    ) {
      if (e.location === 1) {
        key = 'Left' + key;
      } else if (e.location === 2) {
        key = 'Right' + key;
      } else if (e.location === 3) {
        key = 'Extra' + key;
      }
    } else {
      // reversed order of prefixes! 'Ctrl-Alt-Shift' is canonical order
      if (e.shiftKey) {
        key = 'Shift-' + key;
      }
      if (e.altKey) {
        key = 'Alt-' + key;
      }
      if (e.ctrlKey) {
        key = 'Ctrl-' + key;
      }
    }
    return key;
  }

  // NOTE(bowei): does using e.repeat here break when window loses focus??
  handleKeydown = (e: KeyboardEvent) => {
    const { keyIntentConfig } = this.state;
    let key: BrowserKeys = this.transformKey(e);

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
      console.log('Unregistered key ', key, e);
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
    let key: BrowserKeys = this.transformKey(e);
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
