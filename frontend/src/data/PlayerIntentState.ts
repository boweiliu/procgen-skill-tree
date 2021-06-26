import { enumKeys } from '../lib/util/misc';

/**
 * Player intents == what they want to do when they press certain mouse/keyboard keys. This is decoupled
 * from their actual keyboard keys to make remapping easier.
 */

export type PlayerIntentState = {
  activeIntent: Intent;
  newIntent: Intent;
  endedIntent: Intent;
};

export type Intent = {
  [name in IntentName]: boolean;
};

export enum IntentName {
  // Default intent - does nothing
  NOOP = 'NOOP',

  PAN_NORTH = 'PAN_NORTH',
  PAN_SOUTH = 'PAN_SOUTH',
  PAN_WEST = 'PAN_WEST',
  PAN_EAST = 'PAN_EAST',
  TRAVEL_UPSTAIRS = 'TRAVEL_UPSTAIRS',
  TRAVEL_DOWNSTAIRS = 'TRAVEL_DOWNSTAIRS',

  TOGGLE_STRATEGIC_VIEW = 'TOGGLE_STRATEGIC_VIEW',
  TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR',
  TOGGLE_LEFT_SIDEBAR = 'TOGGLE_LEFT_SIDEBAR',
  TOGGLE_RIGHT_SIDEBAR = 'TOGGLE_RIGHT_SIDEBAR',
  TURN_OFF_SIDEBAR = 'TURN_OFF_SIDEBAR',
  EXIT = 'EXIT',

  MOVE_CURSOR_WEST = 'MOVE_CURSOR_WEST',
  MOVE_CURSOR_EAST = 'MOVE_CURSOR_EAST',
  MOVE_CURSOR_NORTH = 'MOVE_CURSOR_NORTH',
  MOVE_CURSOR_SOUTH = 'MOVE_CURSOR_SOUTH',
  MOVE_CURSOR_NORTHWEST = 'MOVE_CURSOR_NORTHWEST',
  MOVE_CURSOR_NORTHEAST = 'MOVE_CURSOR_NORTHEAST',
  MOVE_CURSOR_SOUTHWEST = 'MOVE_CURSOR_SOUTHWEST',
  MOVE_CURSOR_SOUTHEAST = 'MOVE_CURSOR_SOUTHEAST',
  MOVE_CURSOR_NORTHNORTH = 'MOVE_CURSOR_NORTHNORTH',
  MOVE_CURSOR_SOUTHSOUTH = 'MOVE_CURSOR_SOUTHSOUTH',

  INTERACT_WITH_NODE = 'INTERACT_WITH_NODE',
  ZOOM_RECENTER_AT_NODE = 'ZOOM_RECENTER_AT_NODE',
}

export const noIntent = enumKeys(IntentName).reduce((object: Intent, key) => {
  object[key] = false;
  return object;
}, {} as Intent);

export const newPlayerIntentState = (): PlayerIntentState => {
  return {
    activeIntent: noIntent,
    newIntent: noIntent,
    endedIntent: noIntent,
  };
};
