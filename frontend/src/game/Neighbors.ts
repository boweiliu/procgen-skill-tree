import { HashSet } from '../lib/util/data_structures/hash';
import { enumKeys } from '../lib/util/misc';
import {
  ChunkGenConstants,
  PointNodeRef,
  ResourceType,
  WorldGenState,
} from '../data/GameState';
import { Vector2 } from '../lib/util/geometry/vector2';

enum Direction {
  NORTHWEST = 'NORTHWEST',
  SOUTHWEST = 'SOUTHWEST',
  NORTHEAST = 'NORTHEAST',
  SOUTHEAST = 'SOUTHEAST',
  EAST = 'EAST',
  WEST = 'WEST',
  UP = 'UP',
  DOWN = 'DOWN',
}

type NeighborsMap = { [k in Direction]?: PointNodeRef | undefined };

export function getNeighbors(
  selfPointNodeRef: PointNodeRef,
  worldGen: WorldGenState
): PointNodeRef[] {
  let neighborsMap = getNeighborsMap(selfPointNodeRef, worldGen);
  let neighbors: PointNodeRef[] = [];
  for (let direction of enumKeys(Direction)) {
    let it = neighborsMap[direction];
    if (it) {
      neighbors.push(it);
    }
  }
  return neighbors;
}

// TODO(bowei): support vertical neighbors
export function getNeighborsMap(
  selfPointNodeRef: PointNodeRef,
  worldGen: WorldGenState
): NeighborsMap {
  let neighbors: NeighborsMap = {};

  let zLevel = worldGen.zLevels[selfPointNodeRef.z]!;
  let myChunk = zLevel.chunks.get(selfPointNodeRef.chunkCoord)!;
  // first, the right neighbor:
  if (selfPointNodeRef.pointNodeCoord.x === ChunkGenConstants.CHUNK_HALF_DIM) {
    let chunkCoord = selfPointNodeRef.chunkCoord.addX(1);
    let chunk = zLevel.chunks.get(chunkCoord);
    if (chunk) {
      let pointNodeCoord = selfPointNodeRef.pointNodeCoord.withX(
        -ChunkGenConstants.CHUNK_HALF_DIM
      );
      let nbor = chunk.pointNodes.get(pointNodeCoord);
      if (nbor) {
        neighbors.EAST = new PointNodeRef({
          z: selfPointNodeRef.z,
          chunkCoord,
          pointNodeCoord,
          pointNodeId: nbor.id,
        });
      }
    }
  } else {
    let pointNodeCoord = selfPointNodeRef.pointNodeCoord.addX(1);
    let nbor = myChunk.pointNodes.get(pointNodeCoord);
    if (nbor) {
      neighbors.EAST = new PointNodeRef({
        z: selfPointNodeRef.z,
        chunkCoord: selfPointNodeRef.chunkCoord,
        pointNodeCoord,
        pointNodeId: nbor.id,
      });
    }
  }
  // left neighbor
  if (selfPointNodeRef.pointNodeCoord.x === -ChunkGenConstants.CHUNK_HALF_DIM) {
    let chunkCoord = selfPointNodeRef.chunkCoord.addX(-1);
    let chunk = zLevel.chunks.get(chunkCoord);
    if (chunk) {
      let pointNodeCoord = selfPointNodeRef.pointNodeCoord.withX(
        ChunkGenConstants.CHUNK_HALF_DIM
      );
      let nbor = chunk.pointNodes.get(pointNodeCoord);
      if (nbor) {
        neighbors.WEST = new PointNodeRef({
          z: selfPointNodeRef.z,
          chunkCoord,
          pointNodeCoord,
          pointNodeId: nbor.id,
        });
      }
    }
  } else {
    let pointNodeCoord = selfPointNodeRef.pointNodeCoord.addX(-1);
    let nbor = myChunk.pointNodes.get(pointNodeCoord);
    if (nbor) {
      neighbors.WEST = new PointNodeRef({
        z: selfPointNodeRef.z,
        chunkCoord: selfPointNodeRef.chunkCoord,
        pointNodeCoord,
        pointNodeId: nbor.id,
      });
    }
  }
  // +y is down
  if (selfPointNodeRef.pointNodeCoord.y === ChunkGenConstants.CHUNK_HALF_DIM) {
    let chunkCoord = selfPointNodeRef.chunkCoord.addY(1);
    let chunk = zLevel.chunks.get(chunkCoord);
    if (chunk) {
      let pointNodeCoord = selfPointNodeRef.pointNodeCoord.withY(
        -ChunkGenConstants.CHUNK_HALF_DIM
      );
      let nbor = chunk.pointNodes.get(pointNodeCoord);
      if (nbor) {
        neighbors.SOUTH = new PointNodeRef({
          z: selfPointNodeRef.z,
          chunkCoord,
          pointNodeCoord,
          pointNodeId: nbor.id,
        });
      }
    }
  } else {
    let pointNodeCoord = selfPointNodeRef.pointNodeCoord.addY(1);
    let nbor = myChunk.pointNodes.get(pointNodeCoord);
    if (nbor) {
      neighbors.SOUTH = new PointNodeRef({
        z: selfPointNodeRef.z,
        chunkCoord: selfPointNodeRef.chunkCoord,
        pointNodeCoord,
        pointNodeId: nbor.id,
      });
    }
  }
  // -y is up
  if (selfPointNodeRef.pointNodeCoord.y === -ChunkGenConstants.CHUNK_HALF_DIM) {
    let chunkCoord = selfPointNodeRef.chunkCoord.addY(-1);
    let chunk = zLevel.chunks.get(chunkCoord);
    if (chunk) {
      let pointNodeCoord = selfPointNodeRef.pointNodeCoord.withY(
        ChunkGenConstants.CHUNK_HALF_DIM
      );
      let nbor = chunk.pointNodes.get(pointNodeCoord);
      if (nbor) {
        neighbors.NORTH = new PointNodeRef({
          z: selfPointNodeRef.z,
          chunkCoord,
          pointNodeCoord,
          pointNodeId: nbor.id,
        });
      }
    }
  } else {
    let pointNodeCoord = selfPointNodeRef.pointNodeCoord.addY(-1);
    let nbor = myChunk.pointNodes.get(pointNodeCoord);
    if (nbor) {
      neighbors.NORTH = new PointNodeRef({
        z: selfPointNodeRef.z,
        chunkCoord: selfPointNodeRef.chunkCoord,
        pointNodeCoord,
        pointNodeId: nbor.id,
      });
    }
  }

  // progress zlevels
  // up is only available if we are the center of our chunk
  if (selfPointNodeRef.pointNodeCoord.equals(Vector2.Zero)) {
    let upZLevel = worldGen.zLevels[selfPointNodeRef.z + 1];
    if (upZLevel) {
      // use our chunkcoord and divide by CHUNK_DIM
      let chunkCoord = selfPointNodeRef.chunkCoord;
      let upChunkCoordX = Math.round(
        chunkCoord.x / ChunkGenConstants.CHUNK_DIM
      );
      let upNodeX = chunkCoord.x - ChunkGenConstants.CHUNK_DIM * upChunkCoordX; // should be between - CHUNK_HALF_DIM and CHUNK_HALF_DIM
      let upChunkCoordY = Math.round(
        chunkCoord.y / ChunkGenConstants.CHUNK_DIM
      );
      let upNodeY = chunkCoord.y - ChunkGenConstants.CHUNK_DIM * upChunkCoordX; // should be between - CHUNK_HALF_DIM and CHUNK_HALF_DIM
      let upChunkCoord = new Vector2(upChunkCoordX, upChunkCoordY);
      let upChunk = upZLevel.chunks.get(upChunkCoord);
      if (upChunk) {
        let upNode = new Vector2(upNodeX, upNodeY);
        let nbor = upChunk.pointNodes.get(upNode);
        if (nbor) {
          neighbors.UP = new PointNodeRef({
            z: selfPointNodeRef.z + 1,
            chunkCoord: upChunkCoord,
            pointNodeCoord: upNode,
            pointNodeId: nbor.id,
          });
        }
      }
    }
  }
  // down
  let downZLevel = worldGen.zLevels[selfPointNodeRef.z - 1];
  if (downZLevel) {
    let chunkCoord = selfPointNodeRef.chunkCoord
      .multiply(9)
      .add(selfPointNodeRef.pointNodeCoord);
    let downChunk = downZLevel.chunks.get(chunkCoord);
    if (downChunk) {
      let nbor = downChunk.pointNodes.get(Vector2.Zero);
      if (nbor) {
        neighbors.DOWN = new PointNodeRef({
          z: selfPointNodeRef.z - 1,
          chunkCoord,
          pointNodeCoord: Vector2.Zero,
          pointNodeId: nbor.id,
        });
      }
    }
  }

  return neighbors;
}

export function canAllocate(
  selfPointNodeRef: PointNodeRef,
  worldGen: WorldGenState,
  allocatedPointNodeSet: HashSet<PointNodeRef>,
  hasActiveQuest: boolean
): 'yes' | 'already allocated' | 'no active quest' | 'not connected' {
  if (allocatedPointNodeSet.contains(selfPointNodeRef)) {
    return 'already allocated';
  }
  // if (hasActiveQuest === false) {
  //   return "no active quest"
  // }

  // check if any of our neighbors are allocated
  const neighbors = getNeighbors(selfPointNodeRef, worldGen);

  let connected = false;
  for (let nbor of neighbors) {
    if (allocatedPointNodeSet.contains(nbor)) {
      connected = true;
    }
  }
  if (connected) {
    return 'yes';
  }

  return 'not connected';
}
