import { LockData } from '../../data/PlayerSaveState';
import { WorldGenState } from '../../data/WorldGenState';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { LazyHashMap } from '../../lib/util/lazy';
import { LockFactory } from './LockFactory';
import {
  NodeContentsFactory,
  NodeContents,
} from './nodeContents/NodeContentsFactory';

export type WorldGenStateConfig = {};

export class WorldGenStateFactory {
  public config: WorldGenStateConfig;

  constructor(config: WorldGenStateConfig) {
    this.config = config;
  }

  public create(args: { seed: number }): WorldGenState {
    const mySeed = args.seed;

    const lockFactory = new LockFactory({});
    const lockDataMap = new LazyHashMap<Vector3, LockData | undefined>((k) =>
      lockFactory.create({ seed: mySeed, location: k })
    );
    const nodeContentsFactory = new NodeContentsFactory({});
    const nodeContentsMap = new LazyHashMap<Vector3, NodeContents>((k) =>
      nodeContentsFactory.create({ seed: mySeed, location: k })
    );
    return {
      seed: mySeed,
      lockMap: lockDataMap,
      nodeContentsMap,
    };
  }
}
