import { HashSet } from "../lib/util/data_structures/hash";
import { enumKeys } from "../lib/util/misc";
import { ChunkGenConstants, PointNodeRef, WorldGenState } from "../data/GameState";

enum Direction {
  up = 'up',
  down = 'down',
  left = 'left',
  right = 'right',
}

type NeighborsMap = { [k in Direction]?: PointNodeRef | undefined }

export function getNeighbors(selfPointNodeRef: PointNodeRef, worldGen: WorldGenState): PointNodeRef[] {
  let neighborsMap = getNeighborsMap(selfPointNodeRef, worldGen);
  let neighbors : PointNodeRef[] = []
  for (let direction of enumKeys(Direction)) {
    let it = neighborsMap[direction];
    if (it) {
      neighbors.push(it);
    }
  }
  return neighbors;
}

// TODO(bowei): support vertical neighbors
export function getNeighborsMap(selfPointNodeRef: PointNodeRef, worldGen: WorldGenState): NeighborsMap {
  let neighbors: NeighborsMap = {}

  let zLevel = worldGen.zLevels[selfPointNodeRef.z]!
  let myChunk = zLevel.chunks.get(selfPointNodeRef.chunkCoord)!;
  // first, the right neighbor:
  if (selfPointNodeRef.pointNodeCoord.x === ChunkGenConstants.CHUNK_HALF_DIM) {
    let chunkCoord = selfPointNodeRef.chunkCoord.addX(1)
    let chunk = zLevel.chunks.get(chunkCoord);
    if (chunk) {
      let pointNodeCoord = selfPointNodeRef.pointNodeCoord.withX(-ChunkGenConstants.CHUNK_HALF_DIM)
      let nbor = chunk.pointNodes.get(pointNodeCoord);
      if (nbor) {
        neighbors.right = new PointNodeRef({
          z: selfPointNodeRef.z,
          chunkCoord,
          pointNodeCoord,
          pointNodeId: nbor.id
        })
      }
    }
  } else {
    let pointNodeCoord = selfPointNodeRef.pointNodeCoord.addX(1);
    let nbor = myChunk.pointNodes.get(pointNodeCoord);
    if (nbor) {
      neighbors.right = new PointNodeRef({
        z: selfPointNodeRef.z,
        chunkCoord: selfPointNodeRef.chunkCoord,
        pointNodeCoord,
        pointNodeId: nbor.id
      })
    }
  }
  // left neighbor
  if (selfPointNodeRef.pointNodeCoord.x === -ChunkGenConstants.CHUNK_HALF_DIM) {
    let chunkCoord = selfPointNodeRef.chunkCoord.addX(-1)
    let chunk = zLevel.chunks.get(chunkCoord);
    if (chunk) {
      let pointNodeCoord = selfPointNodeRef.pointNodeCoord.withX(ChunkGenConstants.CHUNK_HALF_DIM)
      let nbor = chunk.pointNodes.get(pointNodeCoord);
      if (nbor) {
        neighbors.left = new PointNodeRef({
          z: selfPointNodeRef.z,
          chunkCoord,
          pointNodeCoord,
          pointNodeId: nbor.id
        })
      }
    }
  } else {
    let pointNodeCoord = selfPointNodeRef.pointNodeCoord.addX(-1);
    let nbor = myChunk.pointNodes.get(pointNodeCoord);
    if (nbor) {
      neighbors.left = new PointNodeRef({
        z: selfPointNodeRef.z,
        chunkCoord: selfPointNodeRef.chunkCoord,
        pointNodeCoord,
        pointNodeId: nbor.id
      })
    }
  }
  // +y is down
  if (selfPointNodeRef.pointNodeCoord.y === ChunkGenConstants.CHUNK_HALF_DIM) {
    let chunkCoord = selfPointNodeRef.chunkCoord.addY(1)
    let chunk = zLevel.chunks.get(chunkCoord);
    if (chunk) {
      let pointNodeCoord = selfPointNodeRef.pointNodeCoord.withY(-ChunkGenConstants.CHUNK_HALF_DIM)
      let nbor = chunk.pointNodes.get(pointNodeCoord);
      if (nbor) {
        neighbors.down = new PointNodeRef({
          z: selfPointNodeRef.z,
          chunkCoord,
          pointNodeCoord,
          pointNodeId: nbor.id
        })
      }
    }
  } else {
    let pointNodeCoord = selfPointNodeRef.pointNodeCoord.addY(1);
    let nbor = myChunk.pointNodes.get(pointNodeCoord);
    if (nbor) {
      neighbors.down = new PointNodeRef({
        z: selfPointNodeRef.z,
        chunkCoord: selfPointNodeRef.chunkCoord,
        pointNodeCoord,
        pointNodeId: nbor.id
      })
    }
  }
  // -y is up
  if (selfPointNodeRef.pointNodeCoord.y === -ChunkGenConstants.CHUNK_HALF_DIM) {
    let chunkCoord = selfPointNodeRef.chunkCoord.addY(-1)
    let chunk = zLevel.chunks.get(chunkCoord);
    if (chunk) {
      let pointNodeCoord = selfPointNodeRef.pointNodeCoord.withY(ChunkGenConstants.CHUNK_HALF_DIM)
      let nbor = chunk.pointNodes.get(pointNodeCoord);
      if (nbor) {
        neighbors.up = new PointNodeRef({
          z: selfPointNodeRef.z,
          chunkCoord,
          pointNodeCoord,
          pointNodeId: nbor.id
        })
      }
    }
  } else {
    let pointNodeCoord = selfPointNodeRef.pointNodeCoord.addY(-1);
    let nbor = myChunk.pointNodes.get(pointNodeCoord);
    if (nbor) {
      neighbors.up = new PointNodeRef({
        z: selfPointNodeRef.z,
        chunkCoord: selfPointNodeRef.chunkCoord,
        pointNodeCoord,
        pointNodeId: nbor.id
      })
    }
  }

  return neighbors;
}

export function canAllocate(
  selfPointNodeRef: PointNodeRef,
  worldGen: WorldGenState,
  allocatedPointNodeSet: HashSet<PointNodeRef>,
  availableSp: number
): "yes" | "already allocated" | "not enough sp" | "not connected" {
  if (allocatedPointNodeSet.contains(selfPointNodeRef)) {
    return "already allocated";
  }
  if (availableSp < 1) {
    return "not enough sp";
  }
  // check if any of our neighbors are allocated
  const neighbors = getNeighbors(selfPointNodeRef, worldGen);
  
  for (let nbor of neighbors) {
    if (allocatedPointNodeSet.contains(nbor)) {
      return "yes";
    }
  }

  return "not connected";
}