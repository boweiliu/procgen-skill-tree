export enum NodeAllocatedStatus {
  TAKEN = 'TAKEN',
  AVAILABLE = 'AVAILABLE',
  UNREACHABLE = 'UNREACHABLE',
  HIDDEN = 'HIDDEN',
}
/**
 * taken implies reachable. reachable implies visible.
 */

// Whether or not the node is allocated. implies reachable
export type NodeTakenStatus = {
  taken: boolean;
};
// Whether or not the node is within 1 distance from an allocated node. not used during exploration era. implies visible
export type NodeReachableStatus = {
  reachable: boolean;
};
// whether or not the node is revealed in fog of war. implies accessible
export type NodeVisibleStatus = {
  visible: boolean;
};
// whether or not the node exists in the current era of the game and can be accessed at all.
export type NodeAccessibleStatus = {
  accessible: boolean;
};
// whether or not the node was ever touched in the exploration era. once explored cannot be unexplored.
export type NodeExploredStatus = {
  explored: boolean;
};
// whether or not the node was allocated at the end of the exploration era. player can save or unsave nodes and they will be marked for convenience in the optimization era.
export type NodeSavedStatus = {
  saved: boolean;
};

/**
 * Immutable, readable booleans
 */
export enum BoolEnum {
  true = 'true',
  false = 'false',
}
// eslint-disable-next-line
export const NodeTakenStatus: {
  [k in BoolEnum]: NodeTakenStatus;
} = {
  true: { taken: true },
  false: { taken: false },
};
// eslint-disable-next-line
export const NodeVisibleStatus: {
  [k in BoolEnum]: NodeVisibleStatus;
} = {
  true: { visible: true },
  false: { visible: false },
};
// eslint-disable-next-line
export const NodeReachableStatus: {
  [k in BoolEnum]: NodeReachableStatus;
} = {
  true: { reachable: true },
  false: { reachable: false },
};

export enum LockStatus {
  CLOSED = 'CLOSED',
  TICKING = 'TICKING',
  OPEN = 'OPEN',
}
