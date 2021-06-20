import { LockStatus, NodeTakenStatus } from './NodeStatus';
import { KeyedHashMap } from '../lib/util/data_structures/hash';
import { Vector3 } from '../lib/util/geometry/vector3';

export type PlayerSaveState = {
  /**
   * Indicated which nodes are allocated or not. NOTE: does not contain fog of war information
   */
  allocationStatusMap: KeyedHashMap<Vector3, NodeTakenStatus>;
};

// NOT DEPRECATED
export type LockData = {
  shortTextTarget: string;
  shortTextTimer: string;
  lockStatus: LockStatus;
};

export const newPlayerSaveState = (): PlayerSaveState => {
  return {
    // make sure to allocate the beginning node
    allocationStatusMap: new KeyedHashMap<Vector3, NodeTakenStatus>([
      [Vector3.Zero, NodeTakenStatus.true],
    ]),
  };
};

const serializeToObject = (s: PlayerSaveState): object => {
  return {
    ...s,
    allocationStatusMap: KeyedHashMap.SerializeToObject(s.allocationStatusMap),
  };
};

const serialize = (s: PlayerSaveState) => JSON.stringify(serializeToObject(s));

const deserializeFromObject = (obj: any): PlayerSaveState | null => {
  if (!obj || !obj.hasOwnProperty('allocationStatusMap')) {
    console.error('Failed deserializing PlayerSaveState: ', obj);
    return null;
  }

  const allocationStatusMap = KeyedHashMap.Deserialize<
    Vector3,
    NodeTakenStatus
  >(obj.allocationStatusMap);
  if (!allocationStatusMap) {
    console.error('Failed deserializing PlayerSaveState: ', obj);
    return null;
  }

  return {
    ...(obj as PlayerSaveState),
    allocationStatusMap,
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
