import { KeyedHashMap } from "../lib/util/data_structures/hash";
import { Vector2 } from "../lib/util/geometry/vector2";


export type WorldGenState = {
  seed: number;
  zLevels: { [z: number]: ZLevelGen };
};

export type ZLevelGen = {
  id: number;
  chunks: KeyedHashMap<Vector2, ChunkGen>;
};

export type ChunkGen = {
  id: number;
  pointNodes: KeyedHashMap<Vector2, PointNodeGen>;
};

export class ChunkGenConstants {
  public static CHUNK_DIM = 9; // each chunk is a DIM x DIM grid of nodes, centered on a single node
  public static CHUNK_HALF_DIM = (ChunkGenConstants.CHUNK_DIM - 1) / 2;
  public static DROP_NODES_CHANCE = 0.0; // before generating edges, how many of the nodes to throw out
}

export type PointNodeGen = {
  id: number;
} & ({
  // more data to be generated here - size, color, etc.
  resourceType: ResourceNontrivialType;
  resourceModifier: ResourceModifier;
  resourceAmount: number;
} | {
  resourceType: "Nothing"
} | {
  resourceType: "EfficiencyGate";
  resourceModifier: ResourceModifier;
  resourceAmount: number;

  efficiencyGateInfo: {
    resourceType: ResourceType;
    resourceAmountThreshold: number;
    timeUntilLocked: number;
  };
});

export enum ResourceNontrivialType {
  Mana0 = "Mana0",
  Mana1 = "Mana1",
  Mana2 = "Mana2",
}

export type ResourceType = "Nothing" | "EfficiencyGate" | ResourceNontrivialType;
// eslint-disable-next-line
export const ResourceType = {
  Nothing: "Nothing",
  EfficiencyGate: "EfficiencyGate",
  ...ResourceNontrivialType,
};

export enum ResourceModifier {
  Flat = "Flat",
  Increased0 = "% increased",
  AfterIncreased0 = "added after % increased",
  Increased1 = "% increased multiplier",
  AfterIncreased1 = "added after % increased multiplier",
}

