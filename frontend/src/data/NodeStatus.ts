export enum NodeAllocatedStatus {
  TAKEN = 'TAKEN',
  AVAILABLE = 'AVAILABLE',
  UNREACHABLE = 'UNREACHABLE',
  HIDDEN = 'HIDDEN',
}
/**
 * taken implies reachable. reachable implies visible.
 */

export type NodeTakenStatus = {
  taken: boolean;
  previouslyTaken: boolean; // if it was once allocated but since has been deallocated
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
// // eslint-disable-next-line
// export const NodeTakenStatus: {
//   [k in BoolEnum]: NodeTakenStatus;
// } = {
//   true: { taken: true },
//   false: { taken: false },
// };
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
