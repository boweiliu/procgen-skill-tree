import {
  NodeBookmarkedStatus,
  NodeExploredStatus,
  NodeTakenStatus,
} from './NodeStatus';
import { KeyedHashMap } from '../lib/util/data_structures/hash';
import { Vector3 } from '../lib/util/geometry/vector3';
import { DeserializationError } from '../lib/util/misc';
import { ERA_DEALLOCATION_POINTS } from '../game/actions/AllocateNode';

export type PlayerSaveState = {
  /**
   * Indicated which nodes are allocated or not. NOTE: does not contain fog of war information
   */
  allocationStatusMap: KeyedHashMap<Vector3, NodeTakenStatus>;

  /**
   * Similar but for era A
   */
  bookmarkedStatusMap: KeyedHashMap<Vector3, NodeBookmarkedStatus>;

  /**
   * Saves a map of all the nodes we bookmarked and then unbookmarked -- doing that preserves fog of war
   */
  exploredStatusMap: KeyedHashMap<Vector3, NodeExploredStatus>;

  /**
   * Which phase of the game we are in
   */
  currentEra: EraType;

  /**
   *
   */
  deallocationPoints: {
    remaining: number;
    provided: number;
  };
};

export type EraType = {
  type: 'A' | 'B';
  index: number;
};

// NOT DEPRECATED
export type LockData = {
  shortTextTarget: string;
  shortTextTimer: string;
};

export const newPlayerSaveState = (): PlayerSaveState => {
  return {
    // make sure to allocate the beginning node
    allocationStatusMap: new KeyedHashMap([
      [Vector3.Zero, NodeTakenStatus.true],
    ]),
    bookmarkedStatusMap: new KeyedHashMap(),
    exploredStatusMap: new KeyedHashMap([[Vector3.Zero, { explored: true }]]),
    currentEra: {
      type: 'B',
      index: 0,
    },
    deallocationPoints: {
      provided: ERA_DEALLOCATION_POINTS[0],
      remaining: ERA_DEALLOCATION_POINTS[0],
    },
  };
};

const serializeToObject = (s: PlayerSaveState): object => {
  return {
    ...s,
    allocationStatusMap: KeyedHashMap.SerializeToObject<
      Vector3,
      NodeTakenStatus
    >(s.allocationStatusMap, Vector3.SerializeToObject),
    bookmarkedStatusMap: KeyedHashMap.SerializeToObject<
      Vector3,
      NodeBookmarkedStatus
    >(s.bookmarkedStatusMap, Vector3.SerializeToObject),
    exploredStatusMap: KeyedHashMap.SerializeToObject<
      Vector3,
      NodeExploredStatus
    >(s.exploredStatusMap, Vector3.SerializeToObject),
  };
};

const serialize = (s: PlayerSaveState) => JSON.stringify(serializeToObject(s));

const deserializeFromObject = (obj: any): PlayerSaveState | null => {
  if (
    !obj ||
    !obj.hasOwnProperty('allocationStatusMap') ||
    !obj.hasOwnProperty('bookmarkedStatusMap') ||
    !obj.hasOwnProperty('exploredStatusMap') ||
    !obj.hasOwnProperty('deallocationPoints') ||
    !obj.hasOwnProperty('currentEra')
  ) {
    console.error('Failed deserializing PlayerSaveState: ', obj);
    return null;
  }

  const allocationStatusMap = KeyedHashMap.Deserialize<
    Vector3,
    NodeTakenStatus
  >(obj.allocationStatusMap, (it) => {
    const result = Vector3.Deserialize(it);
    if (!result) {
      throw new DeserializationError(
        `Failed deserializing vector3 ${JSON.stringify(it)}`
      );
    }
    return result;
  });
  if (!allocationStatusMap) {
    console.error(
      'Failed deserializing PlayerSaveState.allocationStatusMap: ',
      obj
    );
    return null;
  }

  const bookmarkedStatusMap = KeyedHashMap.Deserialize<
    Vector3,
    NodeBookmarkedStatus
  >(obj.bookmarkedStatusMap, (it) => {
    const result = Vector3.Deserialize(it);
    if (!result) {
      throw new DeserializationError(
        `Failed deserializing vector3 ${JSON.stringify(it)}`
      );
    }
    return result;
  });
  if (!bookmarkedStatusMap) {
    console.error(
      'Failed deserializing PlayerSaveState.bookmarkedStatusMap: ',
      obj
    );
    return null;
  }

  const exploredStatusMap = KeyedHashMap.Deserialize<
    Vector3,
    NodeExploredStatus
  >(obj.exploredStatusMap, (it) => {
    const result = Vector3.Deserialize(it);
    if (!result) {
      throw new DeserializationError(
        `Failed deserializing vector3 ${JSON.stringify(it)}`
      );
    }
    return result;
  });
  if (!exploredStatusMap) {
    console.error(
      'Failed deserializing PlayerSaveState.exploredStatusMap: ',
      obj
    );
    return null;
  }

  return {
    ...(obj as PlayerSaveState),
    allocationStatusMap,
    bookmarkedStatusMap,
    exploredStatusMap,
  };
};

const deserialize = (obj: string) => deserializeFromObject(JSON.parse(obj));

const storageKey = 'PlayerSaveState';

/**
 * Tries to load from local storage and falls back to creating a new object if unsuccessful.
 * see: https://gist.github.com/muzfr7/7e15582add46e74dee111002ec6cf594
 * http://vaughnroyko.com/idbonbeforeunload/
 * https://discourse.mozilla.org/t/saving-to-localstorage-on-window-close/35627/7
 * https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
 */
const tryLoad = (): PlayerSaveState => {
  const loaded = load();
  if (loaded) {
    return loaded;
  } else {
    console.log('Failed to load PlayerSaveState');
    return newPlayerSaveState();
  }
};

const load = (): PlayerSaveState | null => {
  const data = window.localStorage.getItem(storageKey);
  const loaded = (data && deserialize(data)) || null;
  return loaded;
};

const store = (s: PlayerSaveState) => {
  const data = serialize(s);
  window.localStorage.setItem(storageKey, data);
};

const clear = () => {
  window.localStorage.setItem(storageKey, '');
};

// eslint-disable-next-line
export const PlayerSaveState = {
  new: newPlayerSaveState,
  serialize,
  deserialize,
  tryLoad,
  load,
  store,
  clear,
};
