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
  pointNodes: HashMap<Vector2, PointNodeGen>
}

export type PointNodeGen = {
  id: number

  // more data to be generated here - size, color, etc.
}

export type PlayerState = {
  selectedPointNode?: PointNodeRef,
  selectedPointNodeHistory: PointNodeRef[],
  allocatedPointNodeSet: HashSet<PointNodeRef>,
  allocatedPointNodeHistory: PointNodeRef[],
}

export class PointNodeRef {
  public z!: number;
  public chunkCoord!: Vector2;
  public pointNodeCoord!: Vector2;
  public pointNodeId!: number;

  constructor(z: number, chunkCoord: Vector2, pointNodeCoord: Vector2, pointNodeId: number) {
    this.z = z;
    this.chunkCoord = chunkCoord;
    this.pointNodeCoord = pointNodeCoord;
    this.pointNodeId = pointNodeId;
  }

  public hash(): string {
    return this.pointNodeId.toString();
  }
}