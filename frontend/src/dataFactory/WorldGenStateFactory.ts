import { WorldGenState, ChunkGen, PointNodeGen, ChunkGenConstants, ZLevelGen } from "../data/GameState";
import { HashSet, KeyedHashMap } from "../lib/util/data_structures/hash";
import { Vector2 } from "../lib/util/geometry/vector2";
import { INTMAX32, squirrel3 } from "../lib/util/random";

export type WorldGenStateConfig = any;

export class WorldGenStateFactory {
  public config: WorldGenStateConfig;

  constructor(config: WorldGenStateConfig) {
    this.config = config;
  }

  public create(): WorldGenState {
    throw Error();
  }
}

export type ZLevelGenConfig = any;

export class ZLevelGenFactory {
  public config: ZLevelGenConfig;
  public chunkGenFactory: ChunkGenFactory;

  constructor(config: ZLevelGenConfig) {
    this.config = config;
    this.chunkGenFactory = new ChunkGenFactory({});
  }

  public create(args: { seed: number, z: number }): ZLevelGen {
    const id = squirrel3(args.seed + args.z);
    const chunks: KeyedHashMap<Vector2, ChunkGen> = new KeyedHashMap();

    // TODO(bowei): generate more chunks??
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++){
        let location = new Vector2(i, j);
        chunks.put(location, this.chunkGenFactory.create({ seed: id, location }));
      }
    }

    return { id, chunks };
  }
}

export type ChunkGenConfig = any;

export class ChunkGenFactory {
  public config: ChunkGenConfig;

  constructor(config: ChunkGenConfig) {
    this.config = config;
  }

  public create(args: { seed: number, location: Vector2 }): ChunkGen {
    const id = squirrel3(args.seed + squirrel3(args.seed + args.location.x) + args.location.y);
    const pointNodes: KeyedHashMap<Vector2, PointNodeGen> = new KeyedHashMap();

    let droppedNodes: HashSet<Vector2> = new HashSet();
    for (let i = -ChunkGenConstants.CHUNK_HALF_DIM; i <= ChunkGenConstants.CHUNK_HALF_DIM; i++) {
      for (let j = -ChunkGenConstants.CHUNK_HALF_DIM; j <= ChunkGenConstants.CHUNK_HALF_DIM; j++) {
        if (i === 0 && j === 0) {
          continue;
        }
        if (squirrel3(id + i * ChunkGenConstants.CHUNK_DIM + j) / INTMAX32 < ChunkGenConstants.DROP_NODES_CHANCE / 4) {
          droppedNodes.put(new Vector2(i, j));
          droppedNodes.put(new Vector2(j, -i));
          droppedNodes.put(new Vector2(-i, -j));
          droppedNodes.put(new Vector2(-j, i));
        }
      }
    }

    for (let i = -ChunkGenConstants.CHUNK_HALF_DIM; i <= ChunkGenConstants.CHUNK_HALF_DIM; i++) {
      for (let j = -ChunkGenConstants.CHUNK_HALF_DIM; j <= ChunkGenConstants.CHUNK_HALF_DIM; j++) {
        let loc = new Vector2(i, j);
        if (!droppedNodes.get(loc)) {
          pointNodes.put(loc, { id: squirrel3(id + i * ChunkGenConstants.CHUNK_DIM + j)});
        }
      }
    }

    return { id, pointNodes };
  }
}