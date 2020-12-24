import { rm } from "fs";
import { WorldGenState, ChunkGen, PointNodeGen, ChunkGenConstants, ZLevelGen, ResourceType, ResourceModifier } from "../data/GameState";
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

  public create(args: { seed: number, z: number, startingChunks?: number }): ZLevelGen {
    const id = squirrel3(args.seed + args.z);
    const chunks: KeyedHashMap<Vector2, ChunkGen> = new KeyedHashMap();

    const max = args.startingChunks || 3;
    // TODO(bowei): generate more chunks??
    for (let i = -max; i <= max; i++) {
      for (let j = -max; j <= max; j++){
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
  public pointNodeGenFactory: PointNodeGenFactory

  constructor(config: ChunkGenConfig) {
    this.config = config;
    this.pointNodeGenFactory = new PointNodeGenFactory({});
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
        // 4 way symmetry plz
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
          pointNodes.put(loc, this.pointNodeGenFactory.create({ seed: id, location: loc }));
        }
      }
    }

    return { id, pointNodes };
  }
}

type PointNodeGenConfig = {};

export class PointNodeGenFactory {
  public config: PointNodeGenConfig;

  constructor(config: PointNodeGenConfig) {
    this.config = config;
  }

  public create(args: { seed: number, location: Vector2 }): PointNodeGen {
    const id = squirrel3(args.seed + squirrel3(args.seed + args.location.x) + args.location.y);

    let randomFloat = squirrel3(id + 1) / INTMAX32;
    let resourceType: ResourceType;
    if (randomFloat < 0.0) {
      resourceType = ResourceType.Nothing;
    } else if (randomFloat < 0.20) {
      resourceType = ResourceType.Mana0;
    } else if (randomFloat < 0.35) {
      resourceType = ResourceType.Mana1;
    } else if (randomFloat < 0.60) {
      resourceType = ResourceType.Mana2;
    } else {
      resourceType = ResourceType.Nothing;
    }

    randomFloat = squirrel3(id + 2) / INTMAX32;
    let resourceModifier: ResourceModifier;
    if (randomFloat < 0.70) {
      resourceModifier = ResourceModifier.Flat;
    } else if (randomFloat < 0.73) {
      resourceModifier = ResourceModifier.AfterIncreased0;
    } else if (randomFloat < 0.75) {
      resourceModifier = ResourceModifier.AfterIncreased1;
    } else if (randomFloat < 0.95) {
      resourceModifier = ResourceModifier.Increased0;
    } else {
      resourceModifier = ResourceModifier.Increased1;
    }

    let resourceAmount = 0;
    if (resourceModifier === ResourceModifier.Flat ||
      resourceModifier === ResourceModifier.AfterIncreased0 ||
      resourceModifier === ResourceModifier.AfterIncreased1) {
      randomFloat = Math.floor(squirrel3(id + 3) / INTMAX32 * 4); // base is 20 ish?
      randomFloat += Math.floor(squirrel3(id + 4) / INTMAX32 * 4); // base is 20 ish?
      randomFloat += Math.floor(squirrel3(id + 5) / INTMAX32 * 4); // base is 20 ish?
      resourceAmount = randomFloat * 20 + 60;
    } else {
      randomFloat = Math.floor(squirrel3(id + 3) / INTMAX32 * 2); // base is 20 ish?
      randomFloat += Math.floor(squirrel3(id + 4) / INTMAX32 * 2); // base is 20 ish?
      randomFloat += Math.floor(squirrel3(id + 5) / INTMAX32 * 2); // base is 20 ish?
      randomFloat += Math.floor(squirrel3(id + 6) / INTMAX32 * 3); // base is 20 ish?
      resourceAmount = randomFloat + 3;
    }

    return {
      id,
      resourceAmount,
      resourceModifier,
      resourceType
    };
  }
}