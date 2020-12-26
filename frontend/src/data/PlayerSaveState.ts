import { ResourceModifier, ResourceNontrivialType, ResourceType, WorldGenState } from "./WorldGenState";
import { HashSet, KeyedHashMap } from "../lib/util/data_structures/hash";
import { PointNodeRef } from "./PointNodeRef";

export type PlayerSaveState = {
  availableSp: number;
  activeQuest: Quest | undefined;
  batchesSinceQuestStart: number;
  // TODO(bowei): save the seed in here as well?

  // selectedPointNodeHistory: PointNodeRef[],
  // justAllocated: PointNodeRef | undefined,
  allocatedPointNodeSet: HashSet<PointNodeRef>;
  // history[-1] == most recent, histoery[0] == oldest
  allocatedPointNodeHistory: PointNodeRef[];
};

export type Quest = {
  description: string | undefined;
  resourceType: ResourceType;
  resourceAmount: number;
};

