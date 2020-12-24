import { HashSet, KeyedHashMap } from "../lib/util/data_structures/hash"
import { Vector2 } from "../lib/util/geometry/vector2"

/**
 * Data owned by the master "App" component, to be made available as props to ALL subcomponents (both pixi and react); react uses context providers to make this easier
 * 1. world generation data, stuff that was computed off of the random seed and is stored so we can do logic off of it,
 *   but can be deleted/recomputed any time.
 *   May or may not be persisted to disk - unimportant apart from the random seed.
 * 2. data about player activity in the game e.g. which nodes were allocated, what quest stage they are on
 *   Must be persisted to disk - this is essentially the player's "save file"
 * 3. data about player activity that only influences the UI, e.g. which node was selected, but affects UI across
 *   very far away pixi/react components.
 *   Should be persisted to disk - will help the player "remember their place" in the game, but not a big deal if lost.
 * 4. data about the window display - should never be persisted to disk.
 * 
 * Does NOT include UI data which is only relevant to a small part of the component hierarchy - e.g. how many seconds since last tap.
 * That data should belong in state owned by subcomponents.
 */
export type GameState = {
  worldGen: WorldGenState,
  playerSave: PlayerSaveState,
  playerUI: PlayerUIState,
}

export type WorldGenState = {
  seed: number,
  zLevels: {[z: number]: ZLevelGen}
}

export type ZLevelGen = {
  id: number,
  chunks: KeyedHashMap<Vector2, ChunkGen>
}

export type ChunkGen = {
  id: number,
  pointNodes: KeyedHashMap<Vector2, PointNodeGen>
}

export class ChunkGenConstants {
  public static CHUNK_DIM = 9; // each chunk is a DIM x DIM grid of nodes, centered on a single node
  public static CHUNK_HALF_DIM = (ChunkGenConstants.CHUNK_DIM - 1) / 2;
  public static DROP_NODES_CHANCE = 0.3; // before generating edges, how many of the nodes to throw out
}

export type PointNodeGen = {
  id: number;

  // more data to be generated here - size, color, etc.
  resourceType: ResourceType | null;
  resourceModifier: ResourceModifier;
  resourceAmount: number;
}

export enum ResourceType {
  Mana0 = "Mana0",
  Mana1 = "Mana1",
  Mana2 = "Mana2",
  Nothing = "Nothing"
}

export enum ResourceModifier {
  Flat = "Flat",
  Increased0 = "% increased",
  AfterIncreased0 = "added after % increased",
  Increased1 = "% increased multiplier",
  AfterIncreased1 = "added after % increased multiplier"
}

export type PlayerSaveState = {
  availableSp: number,
  // activeQuest: any | undefined,
  // batchesSinceQuestStart: number,
  // TODO(bowei): save the seed in here as well?

  // selectedPointNodeHistory: PointNodeRef[],
  allocatedPointNodeSet: HashSet<PointNodeRef>,
  // history[-1] == most recent, histoery[0] == oldest
  allocatedPointNodeHistory: PointNodeRef[],
}

export type PlayerUIState = {
  selectedPointNode: PointNodeRef | undefined,
  activeTab: number,
}

export class PointNodeRef {
  public z: number;
  public chunkCoord: Vector2;
  public pointNodeCoord: Vector2;
  public pointNodeId: number;

  constructor(args: { z: number, chunkCoord: Vector2, pointNodeCoord: Vector2, pointNodeId: number }) {
    this.z = args.z;
    this.chunkCoord = args.chunkCoord;
    this.pointNodeCoord = args.pointNodeCoord;
    this.pointNodeId = args.pointNodeId;
  }

  public hash(): string {
    return this.pointNodeId.toString();
  }
}

export class ChunkRef {
  public z: number;
  public chunkCoord: Vector2;
  public chunkId: number;

  constructor(args: { z: number, chunkCoord: Vector2, chunkId: number }) {
    this.z = args.z;
    this.chunkCoord = args.chunkCoord;
    this.chunkId = args.chunkId;
  }

  public hash(): string {
    return this.chunkId.toString();
  }
}

/**
 * current window settings -- allows for dynamic resizing and also rotation on mobile web
 */
export type WindowState = {
  orientation: "original" | "rotated", // rotated === we are forcing landscape-in-portrait
  innerWidth: number,
  innerHeight: number,
}