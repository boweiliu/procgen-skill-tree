import { Entity } from "../library/entity";
import { Text } from "pixi.js";
import { C } from "./constants";

export class Hud extends Entity {
  text: Text;

  constructor() {
    super({
      name: "Hud",
    });

    this.text = new Text("Z: Interact", C.TEXT_STYLE);
    this.text.x = 8;
    this.text.y = 8;
    this.addChild(this.text);
  }
}
