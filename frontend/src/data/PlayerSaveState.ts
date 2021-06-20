import { LockStatus, NodeTakenStatus } from './NodeStatus';
import { KeyedHashMap } from '../lib/util/data_structures/hash';
import { Vector3 } from '../lib/util/geometry/vector3';
import { ResourceType } from './WorldGenState';

export type PlayerSaveState = {
  /**
   * Indicated which nodes are allocated or not. NOTE: does not contain fog of war information
   */
  allocationStatusMap: KeyedHashMap<Vector3, NodeTakenStatus>;
};

// DEPRECATED
export type Quest = {
  description: string | undefined;
  resourceType: ResourceType;
  resourceAmount: number;
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
