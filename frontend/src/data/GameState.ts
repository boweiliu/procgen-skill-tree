import { HashMap, HashSet } from "../lib/util/data_structures/hash"
import { Vector2 } from "../lib/util/geometry/vector2"

export type GameState = {
  worldGen: WorldGenState,
  player: PlayerState
}

export type WorldGenState = {
  seed: number,
  zLevels: {[z: number]: ZLevelGen}
}

export type ZLevelGen = {
  id: number,
  chunks: HashMap<Vector2, ChunkGen>
}

export type ChunkGen = {
  id: number,
  nodes: HashMap<Vector2, NodeGen>
}

export type NodeGen = {
  id: number

  // more data to be generated here - size, color, etc.
}

export type PlayerState = {
  selectedNode: NodeRef,
  selectedNodeHistory: NodeRef[],
  allocatedNodeSet: HashSet<NodeRef>,
  allocatedNodeHistory: NodeRef[],
}

// class, so it can be hashed
export class NodeRef {
  public z: number;
  public chunkCoord: Vector2;
  public nodeCoord: Vector2;
  public nodeId: number;

  public hash(): string {
    return this.nodeId.toString();
  }
}