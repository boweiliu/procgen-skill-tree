import { HashMap } from '../lib/util/data_structures/hash';
import { Vector3 } from '../lib/util/geometry/vector3';
import { DebugState } from './DebugState';
import {
  NodeVisibleStatus,
  NodeReachableStatus,
  LockStatus,
} from './NodeStatus';
import { PlayerIntentState } from './PlayerIntentState';
import { PlayerSaveState } from './PlayerSaveState';
import { PlayerUIState } from './PlayerUIState';
import { WindowState } from './WindowState';
import { WorldGenState } from './WorldGenState';

/**
 * Data owned by the master "App" component, to be made available as props to ALL subcomponents (both pixi and react); react uses context providers to make this easier
 * 1. world generation data, stuff that was computed off of the random seed and is stored so we can do logic off of it,
 *   but can be deleted/recomputed any time.
 *   May or may not be persisted to disk - unimportant apart from the random seed.
 * 2. data about player activity in the game e.g. which nodes were allocated, what quest stage they are on
 *   Must be persisted to disk - this is essentially the player's "save file"
 * 3. data about player activity that only influences the UI, e.g. which node was selected, but affects UI across
 *   very far away pixi/react components.
 *   Should be persisted to disk - will help the player "remember their place" in the game, but not a big deal if lost.
 * 4. data about the window display - should never be persisted to disk.
 * 5. data that is computed from other data - no need to persist to disk.
 *
 * Does NOT include UI data which is only relevant to a small part of the component hierarchy - e.g. how many seconds since last tap.
 * That data should belong in state owned by subcomponents.
 */
export type GameState = {
  tick: number;
  worldGen: WorldGenState;
  playerSave: PlayerSaveState;
  playerUI: PlayerUIState;
  computed: ComputedState;
  intent: PlayerIntentState;
  windowState: WindowState;
  debug: DebugState;
  justDisabledSave: boolean;
};

export type ComputedState = {
  /**
   * Indicates the visibility states of all the nodes. Can be recomputed from saveState.allocationStatusMap and lock info
   */
  fogOfWarStatusMap?: HashMap<Vector3, NodeVisibleStatus>;
  /**
   * Stores the allocatability (whether it's connected to the existing tree).
   */
  reachableStatusMap: HashMap<Vector3, NodeReachableStatus> | null;
  /**
   * WIP - not really used. intended to store lock open/close status
   */
  lockStatusMap?: HashMap<Vector3, LockStatus | undefined>;
};
