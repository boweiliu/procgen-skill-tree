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

const storageKey = 'WorldGenState';

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

  public tryLoad(args: { seed: number }): WorldGenState {
    const loaded = this.load();
    if (loaded) {
      return this.create(loaded);
    } else {
      return this.create(args);
    }
  }

  public store(s: WorldGenState) {
    const data = this.serialize(s);
    window.localStorage.setItem(storageKey, data);
  }

  load(): { seed: number } | null {
    const data = window.localStorage.getItem(storageKey);
    const loaded = (data && this.deserialize(data)) || null;
    return loaded;
  }

  deserialize(obj: string): { seed: number } | null {
    return this.deserializeFromObject(JSON.parse(obj));
  }

  deserializeFromObject(obj: any): { seed: number } | null {
    if (!obj || !obj.hasOwnProperty('seed')) {
      return null;
    }
    return { ...obj };
  }

  serialize(s: WorldGenState) {
    return JSON.stringify(this.serializeToObject(s));
  }

  serializeToObject(s: WorldGenState): object {
    return { seed: s.seed };
  }

  public clear() {
    window.localStorage.setItem(storageKey, '');
  }
}
