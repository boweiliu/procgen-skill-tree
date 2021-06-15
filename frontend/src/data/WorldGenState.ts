import { NodeContents } from '../game/worldGen/nodeContents/NodeContentsFactory';
import { KeyedHashMap } from '../lib/util/data_structures/hash';
import { Vector2 } from '../lib/util/geometry/vector2';
import { Vector3 } from '../lib/util/geometry/vector3';
import { LazyHashMap } from '../lib/util/lazy';
import { LockData } from './PlayerSaveState';

export type WorldGenState = {
  seed: number;
  /**
   * What sort of locks are generated. Does not store the live status of the locks.
   */
  lockMap: LazyHashMap<Vector3, LockData | undefined>;

  /**
   * Data about each node.
   */
  nodeContentsMap: LazyHashMap<Vector3, NodeContents>;
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
} & (
  | {
      nodeType: NodeType.Basic;
      // more data to be generated here - size, color, etc.
      resourceType: ResourceNontrivialType;
      resourceModifier: ResourceModifier;
      resourceAmount: number;
    }
  | {
      nodeType: NodeType.Nothing;
    }
  | {
      nodeType: NodeType.EfficiencyGate;
      resourceType: ResourceNontrivialType;
      resourceModifier: ResourceModifier;
      resourceAmount: number;

      efficiencyGateInfo: {
        thresholdResourceType: ResourceType;
        thresholdResourceAmount: number;
        timeUntilLocked: number;
      };
    }
);

export enum NodeType {
  Basic = 'Basic',
  Nothing = 'Nothing',
  EfficiencyGate = 'EfficiencyGate',
}

export enum ResourceNontrivialType {
  Mana0 = 'Mana0',
  Mana1 = 'Mana1',
  Mana2 = 'Mana2',
}

export type ResourceType = ResourceNontrivialType;
// // eslint-disable-next-line
// export const ResourceType = {
//   Nothing: "Nothing",
//   EfficiencyGate: "EfficiencyGate",
//   ...ResourceNontrivialType,
// };

export enum ResourceModifier {
  Flat = 'Flat',
  Increased0 = '% increased',
  AfterIncreased0 = 'added after % increased',
  Increased1 = '% increased multiplier',
  AfterIncreased1 = 'added after % increased multiplier',
}
