import { HashMap } from '../lib/util/data_structures/hash';
import { Vector2 } from '../lib/util/geometry/vector2';
import { Vector3 } from '../lib/util/geometry/vector3';
import { Const } from '../lib/util/misc';
import { PlayerIntentState } from './PlayerIntentState';
import { PlayerSaveState } from './PlayerSaveState';
import { WindowState } from './WindowState';
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
  debug: DebugState;
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

export enum NodeAllocatedStatus {
  TAKEN = 'TAKEN', // already allocated
  AVAILABLE = 'AVAILABLE', // visible and adjacent to other allocated nodes, but not already allocated
  UNREACHABLE = 'UNREACHABLE', // visible but not immediately allocatable due to being not adjacent
  HIDDEN = 'HIDDEN', // hidden due to fog of war
}

/**
 * taken implies reachable. reachable implies visible.
 */
export type NodeTakenStatus = {
  taken: boolean;
};
export type NodeVisibleStatus = {
  visible: boolean;
};
export type NodeReachableStatus = {
  reachable: boolean;
};
/**
 * Immutable, readable booleans
 */
export enum BoolEnum {
  true = 'true',
  false = 'false',
}
// eslint-disable-next-line
export const NodeTakenStatus: { [k in BoolEnum]: NodeTakenStatus } = {
  true: { taken: true },
  false: { taken: false },
};
// eslint-disable-next-line
export const NodeVisibleStatus: { [k in BoolEnum]: NodeVisibleStatus } = {
  true: { visible: true },
  false: { visible: false },
};
// eslint-disable-next-line
export const NodeReachableStatus: { [k in BoolEnum]: NodeReachableStatus } = {
  true: { reachable: true },
  false: { reachable: false },
};

export enum LockStatus {
  CLOSED = 'CLOSED',
  TICKING = 'TICKING',
  OPEN = 'OPEN',
}

export type ComputedState = {
  // DEPRECATED
  playerResourceAmounts?: { [k in ResourceType]: number };
  playerResourceNodesAggregated?: HashMap<ResourceTypeAndModifier, number>;

  // NOT DEPRECATED
  /**
   * Indicates the visibility states of all the nodes. Can be recomputed from saveState.allocationStatusMap and lock info
   * Also stores the allocatability (whether it's connected to the existing tree).
   */
  fogOfWarStatusMap?: HashMap<Vector3, NodeVisibleStatus>;
  reachableStatusMap?: HashMap<Vector3, NodeReachableStatus>;
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

export type DebugState = {
  retriggerVirtualGridDims: () => void;
  debugShowScrollbars: boolean; // default false
  rerenderGameAreaGrid: () => void;
  enableScrollJump: boolean; // default true
  getForceJumpOffset: () => Vector2 | void;
  getOffsetX: () => number | void;
  isFlipCursored: () => boolean | void;
};
