import { Entity } from "../library/entity";
import { Assets } from "./assets";
import { IGameState } from "Library";
import { Vector2 } from "../library/geometry/vector2";
import { Rect } from "../library/geometry/rect";
import { C } from "./constants";
import { Interactor, GetInteractors } from "./interactor";
import { Util } from "../library/util";

export class Player extends Entity {
  graphic: Entity;
  speed = 5;

  constructor() {
    super({
      name: "Player",
    });

    this.graphic = new Entity({ name: "PlayerGraphic" });
    this.graphic.texture = Assets.getResource("player");

    this.addChild(this.graphic);
  }

  move(state: IGameState) {
    this.velocity = Vector2.Zero;

    if (state.keys.down.Right) {
      this.velocity = this.velocity.addX(this.speed);
    }

    if (state.keys.down.Left) {
      this.velocity = this.velocity.subtractX(this.speed);
    }

    if (state.keys.down.Up) {
      this.velocity = this.velocity.subtractY(this.speed);
    }

    if (state.keys.down.Down) {
      this.velocity = this.velocity.addY(this.speed);
    }
  }

  lastTarget: Interactor & Entity | null = null;

  checkForInteractors(state: IGameState): void {
    const interactors = GetInteractors(state);
    const closest = Util.MinByAndValue(interactors, i => i.distance(this));

    if (this.lastTarget) {
      this.lastTarget.scale = Vector2.One;
    }

    if (closest === null) return;

    const { obj, value } = closest;

    if (value < C.InteractionDistance) {
      this.lastTarget = obj;
      this.lastTarget.scale = new Vector2(1.2, 1.2);

      if (state.keys.justDown.Z) {
        this.lastTarget.interact(state);
      }
    }
  }

  update(state: IGameState) {
    this.move(state);
    this.checkForInteractors(state);
  }

  collisionBounds() {
    return new Rect({ x: 0, y: 0, width: C.TileWidth, height: C.TileHeight });
  }
}