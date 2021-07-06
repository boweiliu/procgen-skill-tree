import { LockData } from '../../data/PlayerSaveState';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { INTMAX32, squirrel3 } from '../../lib/util/random';

type LockFactoryConfig = {};

// locks occur at this frequency
// a good non-debug value is 0.47. 0.5 is the site percolation threshold for triangular lattice
const LOCK_FREQUENCY = 0.47;
const LOCK_FREQUENCY_STARTER_AREA = 0.2;
const LOCK_STARTER_AREA_RADIUS = 7;

export class LockFactory {
  public config: LockFactoryConfig;

  constructor(config: LockFactoryConfig) {
    this.config = config;
  }

  public create(args: {
    seed: number;
    location: Vector3;
  }): LockData | undefined {
    const id = squirrel3(
      args.seed +
        args.location.x +
        args.location.y +
        squirrel3(args.seed + args.location.x + args.location.z)
    );
    const p = id / INTMAX32;

    let lockData: LockData = {
      shortTextTarget: '🔒',
      shortTextTimer: '',
    };
    if (args.location.equals(Vector3.Zero)) {
      return undefined;
    }
    // special case for starting area -- should have lower lock frequency
    if (
      taxicabDistance(args.location.toVector2()) <= LOCK_STARTER_AREA_RADIUS
    ) {
      if (p < LOCK_FREQUENCY_STARTER_AREA) {
        return lockData;
      } else {
        return undefined;
      }
    } else {
      if (p < LOCK_FREQUENCY) {
        return lockData;
      } else {
        return undefined;
      }
    }
  }
}

export function taxicabDistance(v: Vector2, w: Vector2 = Vector2.Zero): number {
  if (!w.equals(Vector2.Zero)) {
    return taxicabDistance(v.subtract(w));
  }
  let a = v.x;
  let b = v.y;
  let c = 0;

  // find the most negative coordinate and add it to all of them to coerce them positive
  let min = Math.min(a, b, c);
  a -= min;
  b -= min;
  c -= min;

  // now they're all nonnegative and one of them is zero, so WLOG we can work in the first 120-degree trident.
  return Math.max(a, b, c);
}

// not square rooted
export function l2Norm(v: Vector2, w: Vector2 = Vector2.Zero): number {
  if (!w.equals(Vector2.Zero)) {
    return taxicabDistance(v.subtract(w));
  }

  // computed by doing \| a + b \omega \|^2 = ( a + b \omega ) * ( a + b \omega^2 )
  return v.x * v.x + v.y * v.y - v.x * v.y;
}
