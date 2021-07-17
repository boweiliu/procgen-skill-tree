import { HashMap, HashSet } from '../../lib/util/data_structures/hash';
import { Vector3 } from '../../lib/util/geometry/vector3';

export enum Direction {
  NORTHWEST = 'NORTHWEST',
  SOUTHWEST = 'SOUTHWEST',
  NORTHEAST = 'NORTHEAST',
  SOUTHEAST = 'SOUTHEAST',
  EAST = 'EAST',
  WEST = 'WEST',
  UP = 'UP',
  DOWN = 'DOWN',
}

/**
 * Moving 1 unit of grid on a z level corresponds to moving this many units of grid in the same direction on the z level below.
 */
// const PER_Z_SCALE_FACTOR = 6;

/**
 *   2   3
 * 4 - O - 1
 *   6   5
 * x-axis is along 0 -> 1
 * y-axis is along 0 -> 2
 * z-axis is vertical
 *
 * @param base 0
 */
export function getCoordNeighbors(
  base: Vector3
): { [d in Direction]?: Vector3 } {
  let neighbors: { [d in Direction]?: Vector3 } = {} as any;

  neighbors.EAST = base.addX(1);
  neighbors.WEST = base.addX(-1);
  neighbors.NORTHWEST = base.addY(1);
  neighbors.SOUTHEAST = base.addY(-1);
  neighbors.NORTHEAST = base.add(1, 1, 0);
  neighbors.SOUTHWEST = base.add(-1, -1, 0);

  // TODO(bowei): reenable up/down neighbors later
  // neighbors.DOWN = base
  //   .multiply(new Vector3(PER_Z_SCALE_FACTOR, PER_Z_SCALE_FACTOR, 1))
  //   .addZ(-1);

  // if (base.x % PER_Z_SCALE_FACTOR === 0 && base.y % PER_Z_SCALE_FACTOR === 0) {
  //   neighbors.UP = base
  //     .divide(new Vector3(PER_Z_SCALE_FACTOR, PER_Z_SCALE_FACTOR, 1))
  //     .addZ(1);
  // }

  return neighbors;
}

export type IReadonlySet<K> = {
  contains: (k: K) => boolean;
};

/**
 * BFS.
 * @param base
 * @param maxDistance
 * @param minDistance
 * @param disallowedSet we are not allowed to BFS through these
 * @returns all vector3 coords that are <= maxDistance and >= minDistance where we cannot pass through the disallowed set, but we can arrive at them.
 */
export function getWithinDistance(
  baseOrBases: Vector3 | Vector3[],
  maxDistance: number = Infinity,
  minDistance?: number,
  disallowedSet?: IReadonlySet<Vector3>
): Vector3[] {
  let bases: Vector3[];
  if (Array.isArray(baseOrBases)) {
    bases = baseOrBases;
  } else {
    bases = [baseOrBases];
  }

  let touched: HashSet<Vector3> = new HashSet();
  let disallowedButTouched: HashSet<Vector3> = new HashSet();
  bases.forEach((it) => touched.put(it));
  const byDist: Vector3[][] = [bases];

  for (let d = 1; d <= maxDistance; d++) {
    if (byDist[d - 1].length === 0) {
      break;
    }

    byDist.push([]);

    for (let vec of byDist[d - 1]) {
      const considering = Object.values(getCoordNeighbors(vec));
      for (const n of considering) {
        if (!n) continue;
        if (touched.get(n)) continue;
        touched.put(n);

        if (disallowedSet?.contains(n)) {
          disallowedButTouched.put(n);
        } else {
          byDist[d].push(n);
        }
      }
    }
  }

  let result: Vector3[] = [];
  for (
    let dd = minDistance || 0;
    dd <= maxDistance && dd <= byDist.length;
    dd++
  ) {
    if (byDist[dd] && byDist[dd].length > 0) {
      result = result.concat(byDist[dd]);
    }
  }
  result = result.concat(disallowedButTouched.values());
  return result;
}

/**
 * runs BFS from source to destinations, returning the union of all ties for shortest paths
 * @param source the node to start BFS from
 * @param destinations the set of nodes we are trying to reach
 * @param validLocks the set of nodes we are not allowed to go through
 * @returns array of 2 objects. the first is the union of all nodes contained in the shortest paths
 * (includes the source node and all valid destination nodes.), or empty set, if no path was found.
 * the second is the shortest path distance: 0 if the source == destination, -1 if no path was found.
 */
export function bfsAllPaths(args: {
  source: Vector3;
  destinations: HashSet<Vector3>;
  validLocks: IReadonlySet<Vector3>;
}): [HashSet<Vector3>, number] {
  const { source, destinations, validLocks } = args;

  // let source = target;
  // let destinations = new HashSet<Vector3>(
  //   gameState.playerSave.allocationStatusMap
  //     .entries()
  //     .filter(([v, status]) => {
  //       return status.taken === true;
  //     })
  //     .map((it) => it[0])
  // );
  let shortestPathDist = Infinity;
  const result = new HashSet<Vector3>();

  if (destinations.contains(source)) {
    result.put(source);
    return [result, 0];
  }

  let touched = new HashMap<Vector3, [number, HashSet<Vector3>]>();
  touched.put(source, [0, new HashSet()]);
  let queue = [source];
  while (queue.length) {
    // let currentPath = queue.shift()!;
    // let currentNode = currentPath[currentPath.length - 1];
    let currentNode = queue.shift()!;
    let [currentDist] = touched.get(currentNode)!; // state: we have already examined currentNode and now need to process its neighbors
    // if (touched.contains(currentNode)) { continue; }

    if (currentDist >= shortestPathDist) {
      // we found everything; now just need to extract data

      // first iterate through destinations that are in the touched set
      let considering = destinations
        .values()
        .filter((it) => touched.contains(it));
      while (considering.length) {
        considering.forEach((it) => result.put(it));
        let newConsidering = new HashSet<Vector3>();
        considering.forEach((it) =>
          touched
            .get(it)?.[1]
            .values()
            .forEach((predecessor) => newConsidering.put(predecessor))
        );
        considering = newConsidering.values();
      }

      return [result, shortestPathDist];
    }

    const nbors = Object.values(getCoordNeighbors(currentNode));
    for (let nbor of nbors) {
      const maybeGotThereAlready = touched.get(nbor);
      if (maybeGotThereAlready) {
        // we got there already. still need to determine if we got there just as quickly through this route, and if so, record predecessors
        if (maybeGotThereAlready[0] === currentDist + 1) {
          // we are tied; append to the predecessors
          maybeGotThereAlready[1].put(currentNode);
        }
        continue;
      }

      touched.put(nbor, [currentDist + 1, new HashSet([currentNode])]);

      if (validLocks.contains(nbor)) {
        continue;
      }

      // const newPath = [...currentPath, nbor];
      if (destinations.contains(nbor)) {
        // we have found a shortest path, now to find the rest
        // shortestPathDist = newPath.length;
        shortestPathDist = currentDist + 1;
        // record it
        // newPath.forEach(it => result.put(it));
        // return result;
      }

      queue.push(nbor);
    }
    // touched.put(currentNode);
  }
  console.log('did not find a valid path!');
  return [result, -1];
}
