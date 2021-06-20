import { TAB_NAME } from '../components/Sidebars/TabContentInterface';
import { Vector2 } from '../lib/util/geometry/vector2';
import { Vector3 } from '../lib/util/geometry/vector3';

export const initialTabLabels: { [k in 'left' | 'right']: TAB_NAME[] } = {
  left: [],
  right: [
    TAB_NAME.SELECTED_NODE,
    TAB_NAME.STATS,
    TAB_NAME.QUESTS,
    TAB_NAME.DEBUG,
    TAB_NAME.HELP,
    TAB_NAME.STRATEGIC_VIEW,
  ],
};

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
  cursoredNodeLocation: Vector3 | null;
  /**
   * state of the sidebar component
   */
  isSidebarOpen: boolean;
  /**
   * whether or not the cursor is captured by a text entry element. if so, we need to allow default behavior on keyboard events
   */
  isTextBoxFocused: boolean;
  /**
   * change this state in order to trigger a useeffect which causes scroll to recenter. this function is not guaranteed to be ever be called
   */
  triggerScrollRecenterCb: () => void;

  /**
   * Tab controls.
   */
  tabs: {
    left: {
      tabs: TAB_NAME[];
      activeIndex: number;
    };
    right: {
      tabs: TAB_NAME[];
      activeIndex: number;
    };
  };

  strategicSearch: StrategicSearchState;

  // WIP?
  virtualApproximateScroll?: Vector2;
  strategicGridLocation?: Vector3;
};

export type StrategicSearchState = {
  highlight1: {
    value: string;
  };
};

export const newPlayerUIState = (): PlayerUIState => {
  return {
    triggerScrollRecenterCb: () => {},
    tabs: {
      left: {
        tabs: initialTabLabels['left'],
        activeIndex: 0,
      },
      right: {
        tabs: initialTabLabels['right'],
        activeIndex: 0,
      },
    },
    strategicSearch: {
      highlight1: {
        value: '',
      },
    },
    isPixiHidden: true,
    virtualGridLocation: Vector3.Zero,
    cursoredNodeLocation: null,
    isSidebarOpen: false,
    isTextBoxFocused: false,
  };
};

const serializeToObject = (s: PlayerUIState): object => {
  return {
    ...s,
    triggerScrollRecenterCb: undefined,
    virtualGridLocation: Vector3.SerializeToObject(s.virtualGridLocation),
  };
};

const serialize = (s: PlayerUIState) => JSON.stringify(serializeToObject(s));

const deserializeFromObject = (obj: any): PlayerUIState | null => {
  if (
    !obj ||
    !obj.hasOwnProperty('isPixiHidden') ||
    !obj.hasOwnProperty('virtualGridLocation') ||
    !obj.hasOwnProperty('cursoredNodeLocation') ||
    !obj.hasOwnProperty('isSidebarOpen') ||
    !obj.hasOwnProperty('isTextBoxFocused') ||
    !obj.hasOwnProperty('tabs') ||
    !obj.hasOwnProperty('strategicSearch')
  ) {
    console.error('Failed deserializing PlayerUIState: ', obj);
    return null;
  }

  const virtualGridLocation = Vector3.Deserialize(obj.virtualGridLocation);
  if (!virtualGridLocation) {
    console.error('Failed deserializing PlayerUIState: ', obj);
    return null;
  }
  const cursoredNodeLocation = Vector3.Deserialize(obj.cursoredNodeLocation);

  return {
    ...(obj as PlayerUIState),
    virtualGridLocation,
    cursoredNodeLocation,
    triggerScrollRecenterCb: () => {},
  };
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

const load = (): PlayerUIState | null => {
  const data = window.localStorage.getItem(storageKey);
  const loaded = (data && deserialize(data)) || null;
  return loaded;
};

const store = (s: PlayerUIState) => {
  const data = serialize(s);
  window.localStorage.setItem(storageKey, data);
};

const clear = () => {
  window.localStorage.setItem(storageKey, '');
};

// eslint-disable-next-line
export const PlayerUIState = {
  new: newPlayerUIState,
  serialize,
  deserialize,
  tryLoad,
  load,
  store,
  clear,
};
