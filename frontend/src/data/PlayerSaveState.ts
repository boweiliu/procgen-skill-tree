import {
  LockStatus,
  NodeAllocatedStatus,
} from '../components/GameArea/GameAreaGrid';
import {
  HashMap,
  HashSet,
  KeyedHashMap,
} from '../lib/util/data_structures/hash';
import { Vector3 } from '../lib/util/geometry/vector3';
import { Lazy, LazyHashMap } from '../lib/util/lazy';
import { PointNodeRef } from './PointNodeRef';
import { ResourceType } from './WorldGenState';

export type PlayerSaveState = {
  /**
   * DEPRECATED
   */
  activeQuest: Quest | undefined;
  spSpentThisQuest: number | undefined;
  questProgressHistory: number[];
  questInitialAmount: number;
  score: number;
  questsCompleted: Quest[];
  // TODO(bowei): save the seed in here as well?

  // selectedPointNodeHistory: PointNodeRef[],
  // justAllocated: PointNodeRef | undefined,
  allocatedPointNodeSet: HashSet<PointNodeRef>;
  // history[-1] == most recent, histoery[0] == oldest
  allocatedPointNodeHistory: PointNodeRef[];

  /**
   * NOT DEPRECATED
   */

  /**
   * Indicated which nodes are allocated or not. NOTE: does not contain fog of war information
   * TODO(bowei): this should be lazyHashMap with default == HIDDEN
   */
  allocationStatusMap: KeyedHashMap<Vector3, NodeAllocatedStatus>;
  // lockMap: LazyHashMap<Vector3, LockData | undefined>;
};

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
