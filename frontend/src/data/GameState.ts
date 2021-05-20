import {
  LockStatus,
  NodeAllocatedStatus,
} from '../components/GameArea/GameAreaGrid';
import { HashMap } from '../lib/util/data_structures/hash';
import { Vector2 } from '../lib/util/geometry/vector2';
import { Vector3 } from '../lib/util/geometry/vector3';
import { LazyHashMap } from '../lib/util/lazy';
import { Const, enumKeys } from '../lib/util/misc';
import { PlayerSaveState } from './PlayerSaveState';
import { PointNodeRef } from './PointNodeRef';
import {
  ResourceModifier,
  ResourceNontrivialType,
  ResourceType,
  WorldGenState,
} from './WorldGenState';

export { PointNodeRef, ChunkRef } from './PointNodeRef';
export type { PlayerSaveState, Quest } from './PlayerSaveState';
export type {
  WorldGenState,
  ChunkGen,
  ZLevelGen,
  PointNodeGen,
  ResourceType,
} from './WorldGenState';
export {
  ChunkGenConstants,
  ResourceModifier,
  ResourceNontrivialType,
} from './WorldGenState';

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
};

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

  MOVE_CURSOR_WEST = 'MOVE_CURSOR_WEST',
  MOVE_CURSOR_EAST = 'MOVE_CURSOR_EAST',
  MOVE_CURSOR_NORTH = 'MOVE_CURSOR_NORTH',
  MOVE_CURSOR_SOUTH = 'MOVE_CURSOR_SOUTH',
  MOVE_CURSOR_NORTHWEST = 'MOVE_CURSOR_NORTHWEST',
  MOVE_CURSOR_NORTHEAST = 'MOVE_CURSOR_NORTHEAST',
  MOVE_CURSOR_SOUTHWEST = 'MOVE_CURSOR_SOUTHWEST',
  MOVE_CURSOR_SOUTHEAST = 'MOVE_CURSOR_SOUTHEAST',

  INTERACT_WITH_NODE = 'INTERACT_WITH_NODE',
}

export const noIntent = enumKeys(IntentName).reduce((object: Intent, key) => {
  object[key] = false;
  return object;
}, {} as Intent);

/**
 * current window settings -- allows for dynamic resizing and also rotation on mobile web
 */
export type WindowState = {
  orientation: 'original' | 'rotated'; // rotated === we are forcing landscape-in-portrait
  innerWidth: number;
  innerHeight: number;
};

/**
 * given the dimensions of the entire html window, computes the size of the intended play area -- leaves a 24px border
 */
export function appSizeFromWindowSize(window?: Const<Vector2>): Vector2 {
  return new Vector2({
    x: Math.min(1920, (window?.x || Infinity) - 24),
    y: Math.min(1080, (window?.y || Infinity) - 24),
  });
}

export type ComputedState = {
  // DEPRECATED
  playerResourceAmounts?: { [k in ResourceType]: number };
  playerResourceNodesAggregated?: HashMap<ResourceTypeAndModifier, number>;

  // NOT DEPRECATED
  fogOfWarStatusMap?: HashMap<Vector3, NodeAllocatedStatus>;
  lockStatusMap?: HashMap<Vector3, LockStatus | undefined>;
};

export class ResourceTypeAndModifier {
  public type: ResourceNontrivialType;
  public modifier: ResourceModifier;

  constructor(args: {
    type: ResourceNontrivialType;
    modifier: ResourceModifier;
  }) {
    this.type = args.type;
    this.modifier = args.modifier;
  }

  public hash(): string {
    return this.type.toString() + ',' + this.modifier.toString();
  }
}

export type PlayerUIState = {
  // DEPRECATED
  selectedPointNode: PointNodeRef | undefined;
  activeTab: number;

  // NOT DEPRECATED
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

  // WIP?
  virtualApproximateScroll?: Vector2;
  strategicGridLocation?: Vector3;
};
