declare module "Library" {
  export interface ModeList {
    Normal: never;
  }

  export type Mode = keyof ModeList;

  type HashSet<T> = import("./data_structures/hash").HashSet<T>;
  type Entity = import("./entity").Entity;
  type KeyboardState = import("./keyboard").KeyboardState;
  type CollisionGrid = import("./collision_grid").CollisionGrid;
  type Camera = import("./camera").Camera;

  export interface IGameState<MyModeList extends ModeList = ModeList> {
    camera: Camera;
    keys: KeyboardState;
    lastCollisionGrid: CollisionGrid;
    entities: HashSet<Entity<MyModeList>>;
    spriteToEntity: { [key: number]: Entity<MyModeList> };
    renderer: Renderer;
    tick: number;
    toBeDestroyed: Entity<MyModeList>[];
    stage: Entity<MyModeList>;
    mode: keyof MyModeList;
  }
}