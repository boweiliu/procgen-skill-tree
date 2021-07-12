import { HashSet } from '../../lib/util/data_structures/hash';
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
