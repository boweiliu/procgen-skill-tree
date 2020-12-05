import { Renderer } from "pixi.js";
import { KeyboardState } from "./keyboard";
import { Entity } from "./entity";
import { HashSet } from "./data_structures/hash";
import { IGameState, ModeList } from "Library";
import { Mode } from "Library";
import { CollisionGrid } from "./collision_grid";
import { Camera } from "./camera";

export class BaseGameState<MyModeList extends ModeList = ModeList> implements Partial<IGameState<MyModeList>> {
  camera           !: Camera;
  keys: KeyboardState;
  renderer         !: Renderer;
  entities = new HashSet<Entity<any>>();
  toBeDestroyed: Entity<any>[] = [];
  stage            !: Entity<any>;
  spriteToEntity: { [key: number]: Entity<any> } = {};
  mode: Mode = "Normal";
  lastCollisionGrid!: CollisionGrid;

  constructor() {
    this.keys = new KeyboardState();
  }
}
