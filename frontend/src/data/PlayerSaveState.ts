import { NodeAllocatedStatus } from '../components/GameArea/GameAreaComponent';
import { HashMap, HashSet } from '../lib/util/data_structures/hash';
import { Vector3 } from '../lib/util/geometry/vector3';
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

  allocationStatusMap: HashMap<Vector3, NodeAllocatedStatus>;
};

export type Quest = {
  description: string | undefined;
  resourceType: ResourceType;
  resourceAmount: number;
};
