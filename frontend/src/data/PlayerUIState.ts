import { Vector2 } from '../lib/util/geometry/vector2';
import { Vector3 } from '../lib/util/geometry/vector3';

export type PlayerUIState = {
  /**
   * Determines if pixi (i.e. strategic view) is hidden or not.
   */
  isPixiHidden: boolean;
  /**
   * Determines where in the universe the user has scrolled to.
   */
  virtualGridLocation: Vector3;
  /**
   * Which, if any, node is highlighted with a selection cursor
   */
  cursoredNodeLocation: Vector3 | undefined;
  /**
   * state of the sidebar component
   */
  isSidebarOpen: boolean;
  /**
   * whether or not the cursor is captured by a text entry element. if so, we need to allow default behavior on keyboard events
   */
  isTextBoxFocused: boolean;

  // WIP?
  virtualApproximateScroll?: Vector2;
  strategicGridLocation?: Vector3;
};

export const newPlayerUIState = (): PlayerUIState => {
  return {
    isPixiHidden: true,
    virtualGridLocation: Vector3.Zero,
    cursoredNodeLocation: undefined,
    isSidebarOpen: false,
    isTextBoxFocused: false,
  };
};

const serializeToObject = (s: PlayerUIState): object => {
  return {
    ...s,
    virtualGridLocation: Vector3.SerializeToObject(s.virtualGridLocation),
  };
};

const serialize = (s: PlayerUIState) => JSON.stringify(serializeToObject(s));

const deserializeFromObject = (obj: {
  [k: string]: any;
}): PlayerUIState | undefined => {
  if (
    !obj.hasOwnProperty('isPixiHidden') ||
    !obj.hasOwnProperty('virtualGridLocation') ||
    !obj.hasOwnProperty('cursoredNodeLocation') ||
    !obj.hasOwnProperty('isSidebarOpen') ||
    !obj.hasOwnProperty('isTextBoxFocused')
  ) {
    console.error('Failed deserializing PlayerUIState');
  }

  const virtualGridLocation = Vector3.Deserialize(obj.virtualGridLocation);
  if (!virtualGridLocation) {
    return undefined;
  }

  return {
    ...obj,
    virtualGridLocation,
  } as PlayerUIState;
};

const deserialize = (obj: string) => deserializeFromObject(JSON.parse(obj));

const storageKey = 'PlayerUIState';

/**
 * Tries to load from local storage and falls back to creating a new object if unsuccessful.
 * see: https://gist.github.com/muzfr7/7e15582add46e74dee111002ec6cf594
 * http://vaughnroyko.com/idbonbeforeunload/
 * https://discourse.mozilla.org/t/saving-to-localstorage-on-window-close/35627/7
 * https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
 */
const tryLoad = (): PlayerUIState => {
  const loaded = load();
  if (loaded) {
    return loaded;
  } else {
    console.log('Failed to load PlayerUIState');
    return newPlayerUIState();
  }
};

const load = (): PlayerUIState | undefined => {
  const data = window.localStorage.getItem(storageKey);
  const loaded = (data && deserialize(data)) || undefined;
  return loaded;
};

const store = (obj: PlayerUIState) => {
  const data = serialize(obj);
  window.localStorage.setItem(storageKey, data);
};

export const PlayerUIState = {
  new: newPlayerUIState,
  serialize,
  deserialize,
  tryLoad,
  load,
  store,
};
