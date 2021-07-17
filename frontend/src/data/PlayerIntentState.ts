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
  HARD_REFRESH_PAGE = 'HARD_REFRESH_PAGE',

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
  SHIFT_INTERACT_WITH_NODE = 'SHIFT_INTERACT_WITH_NODE',
  DEALLOCATE_NODE = 'DEALLOCATE_NODE',
  ZOOM_RECENTER_AT_NODE = 'ZOOM_RECENTER_AT_NODE',

  // TODO(bowei): implement these
  // if in era A, removes all bookmarks. also should be undoable
  MAYBE_RESET_BOOKMARKS_THIS_ERA = 'MAYBE_RESET_BOOKMARKS_THIS_ERA',
  // goes to next era; must be clicked twice to work
  MAYBE_PROGRESS_NEXT_ERA = 'MAYBE_PROGRESS_NEXT_ERA',
  // pop the most recent action stack, perform the reverse action, and push to the most recent undo stack. Only allocate/deallocates are reversible, not cursor select changes or era progression.
  UNDO = 'UNDO',
  // pop the most recent undo stack, perform the original action, and push to the most recent action stack
  REDO = 'REDO',
  // capslock - causes cursor selection "[" to also show cursors on the shortest path from selection to origin (going through .taken nodes costs 0.01), on both strategic and detailed
  TOGGLE_SHOW_PATHS = 'TOGGLE_SHOW_PATHS',
  // temporarily causes cursor selection "[" to also show cursors on the shortest path from selection to origin (going through .taken nodes costs 0.01), on both strategic and detailed
  TEMP_SHOW_PATHS = 'TEMP_SHOW_PATHS',
}

export const defaultKeyIntentConfig = {
  'Ctrl-Backspace': IntentName.MAYBE_RESET_BOOKMARKS_THIS_ERA,
  'Ctrl-z': IntentName.UNDO,
  'Ctrl-y': IntentName.REDO,
  'Ctrl-r': IntentName.REDO,
  g: IntentName.MAYBE_PROGRESS_NEXT_ERA,
  CapsLock: IntentName.TOGGLE_SHOW_PATHS,
  LeftShift: IntentName.TEMP_SHOW_PATHS,

  // ArrowUp: IntentName.PAN_NORTH,
  // ArrowLeft: IntentName.PAN_WEST,
  // ArrowDown: IntentName.PAN_SOUTH,
  // ArrowRight: IntentName.PAN_EAST,
  w: IntentName.PAN_NORTH,
  a: IntentName.PAN_WEST,
  s: IntentName.PAN_SOUTH,
  d: IntentName.PAN_EAST,

  // k: IntentName.PAN_NORTH,
  // h: IntentName.PAN_WEST,
  // j: IntentName.PAN_SOUTH,
  // l: IntentName.PAN_EAST,

  // m: IntentName.TOGGLE_STRATEGIC_VIEW,
  b: IntentName.TOGGLE_STRATEGIC_VIEW,

  // i: IntentName.TOGGLE_SIDEBAR,
  t: IntentName.TOGGLE_LEFT_SIDEBAR,
  y: IntentName.TOGGLE_RIGHT_SIDEBAR,

  Escape: IntentName.EXIT,

  // w: IntentName.MOVE_CURSOR_NORTH,
  // a: IntentName.MOVE_CURSOR_WEST,
  // s: IntentName.MOVE_CURSOR_SOUTH,
  // d: IntentName.MOVE_CURSOR_EAST,
  // q: IntentName.MOVE_CURSOR_NORTHWEST,
  // e: IntentName.MOVE_CURSOR_NORTHEAST,
  // z: IntentName.MOVE_CURSOR_SOUTHWEST,
  // x: IntentName.MOVE_CURSOR_SOUTHEAST,
  // c: IntentName.MOVE_CURSOR_SOUTHEAST,

  j: IntentName.MOVE_CURSOR_WEST,
  l: IntentName.MOVE_CURSOR_EAST,
  u: IntentName.MOVE_CURSOR_NORTHWEST,
  i: IntentName.MOVE_CURSOR_NORTHEAST,
  n: IntentName.MOVE_CURSOR_SOUTHWEST,
  m: IntentName.MOVE_CURSOR_SOUTHEAST,
  k: IntentName.MOVE_CURSOR_SOUTHWEST,
  'Shift-J': IntentName.MOVE_CURSOR_WEST,
  'Shift-L': IntentName.MOVE_CURSOR_EAST,
  'Shift-U': IntentName.MOVE_CURSOR_NORTHWEST,
  'Shift-I': IntentName.MOVE_CURSOR_NORTHEAST,
  'Shift-N': IntentName.MOVE_CURSOR_SOUTHWEST,
  'Shift-M': IntentName.MOVE_CURSOR_SOUTHEAST,
  'Shift-K': IntentName.MOVE_CURSOR_SOUTHWEST,

  // ArrowUp: IntentName.MOVE_CURSOR_NORTHNORTH,
  ArrowUp: IntentName.MOVE_CURSOR_NORTHEAST,
  ArrowLeft: IntentName.MOVE_CURSOR_WEST,
  ArrowDown: IntentName.MOVE_CURSOR_SOUTHWEST,
  ArrowRight: IntentName.MOVE_CURSOR_EAST,
  'Shift-ArrowUp': IntentName.MOVE_CURSOR_NORTHEAST,
  'Shift-ArrowLeft': IntentName.MOVE_CURSOR_WEST,
  'Shift-ArrowDown': IntentName.MOVE_CURSOR_SOUTHWEST,
  'Shift-ArrowRight': IntentName.MOVE_CURSOR_EAST,
  RightShift: IntentName.MOVE_CURSOR_NORTHWEST,
  RightControl: IntentName.MOVE_CURSOR_SOUTHEAST,

  ' ': IntentName.INTERACT_WITH_NODE,
  'Shift- ': IntentName.SHIFT_INTERACT_WITH_NODE,
  Backspace: IntentName.DEALLOCATE_NODE,
  // z: IntentName.ZOOM_RECENTER_AT_NODE,
  r: IntentName.ZOOM_RECENTER_AT_NODE,
  '\\': IntentName.ZOOM_RECENTER_AT_NODE,
  'Shift-|': IntentName.ZOOM_RECENTER_AT_NODE,
  '<': IntentName.TRAVEL_UPSTAIRS,
  '>': IntentName.TRAVEL_DOWNSTAIRS,
  'Ctrl-Shift-R': IntentName.HARD_REFRESH_PAGE,
};

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
