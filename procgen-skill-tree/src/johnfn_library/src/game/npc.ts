import { Entity } from "../library/entity";
import { Assets } from "./assets";
import { IGameState } from "Library";
import { Interactor } from "./interactor";
import { Dialog } from "./dialog";

export class Npc extends Entity implements Interactor {
  graphic: Entity;
  speed = 10;
  isInteractor = true as const;

  constructor() {
    super({
      name: "Npc",
      collidable: true,
    });

    this.graphic = new Entity({ name: "NpcGraphic" });
    this.graphic.texture = Assets.getResource("npc");

    this.addChild(this.graphic);
  }

  update(state: IGameState) {
  }

  interact(state: IGameState) {
    Dialog.BeginDialog(state, [[this, "Hello, I am dumb."]])
  }
}