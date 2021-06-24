import { LockStatus } from '../../data/NodeStatus';
import { LockData } from '../../data/PlayerSaveState';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { INTMAX32, squirrel3 } from '../../lib/util/random';

type LockFactoryConfig = {};

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
      lockStatus: LockStatus.TICKING,
    };
    if (args.location.equals(Vector3.Zero)) {
      return undefined;
    }
    // TODO(bowei): unhardcode
    // locks occur at this frequency
    // a good non-debug value is 0.47. 0.5 is the site percolation threshold for triangular lattice
    if (p < 0.47) {
      return lockData;
    }

    return undefined;
  }
}
