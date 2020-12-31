import { HashSet } from "../lib/util/data_structures/hash";
import { PointNodeRef } from "./PointNodeRef";
import { ResourceType } from "./WorldGenState";

export type PlayerSaveState = {
  availableSp: number;
  activeQuest: Quest | undefined;
  batchesSinceQuestStart: number;
  spSpentThisQuest: number | undefined;
  questProgressHistory: number[];
  questInitialAmount: number;
  // TODO(bowei): save the seed in here as well?

  // selectedPointNodeHistory: PointNodeRef[],
  // justAllocated: PointNodeRef | undefined,
  allocatedPointNodeSet: HashSet<PointNodeRef>;
  // history[-1] == most recent, histoery[0] == oldest
  allocatedPointNodeHistory: PointNodeRef[];
  score: number;
};

export type Quest = {
  description: string | undefined;
  resourceType: ResourceType;
  resourceAmount: number;
};
