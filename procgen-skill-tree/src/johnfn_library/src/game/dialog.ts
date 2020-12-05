import { Text, Sprite, Texture, TextMetrics } from "pixi.js";
import { Entity } from "../library/entity";
import { C } from "./constants";
import { IGameState } from "Library";
import { Game, MyModeList } from "./game";
import { Mode } from "Library";

export class Dialog extends Entity<MyModeList> {
  currentText = ""
  dialog: [Entity, string][];
  text: Text;
  box: Entity;
  activeModes: (keyof MyModeList)[] = ["Dialog"];

  constructor(initialDialog: [Entity, string][]) {
    super({
      name: "Dialog",
    });

    this.dialog = initialDialog.slice();
    initialDialog[0][0].addChild(this);

    this.box = new Entity({
      name: "Dialog box",
    });
    this.box.texture = Texture.from('module_dialog.png');
    this.addChild(this.box);

    this.text = new Text("", C.TEXT_STYLE);
    this.addChild(this.text);
    this.text.x = 8;
    this.text.y = 8;

    this.y = -C.TileHeight;

    this.renderString("");
  }

  renderString(string: string) {
    this.text.text = string;
    let textMetrics = TextMetrics.measureText(string, C.TEXT_STYLE);
    this.box.width = textMetrics.width + 8 + 8;
    this.box.height = textMetrics.height + 8 + 8;
  }

  public static BeginDialog(state: IGameState<MyModeList>, string: [Entity, string][]): void {
    const dialog = new Dialog(string);

    state.mode = "Dialog";
  }

  update(state: IGameState): void {
    if (state.keys.justDown.Z) {
      if (this.currentText.length === this.dialog[0][1].length) {
        this.dialog.shift();

        if (this.dialog.length === 0) {
          this.destroy(state);
          state.mode = "Normal";
        } else {
          this.currentText = "";
          this.renderString(this.currentText);
          this.dialog[0][0].sprite.addChild(this.sprite);
        }
      } else {
        this.currentText = this.dialog[0][1];
        this.renderString(this.currentText);
      }
    }

    if (state.tick % 2 !== 0) {
      return;
    }

    if (
      (this.dialog.length > 0 && this.currentText.length === this.dialog[0][1].length) ||
      this.dialog.length === 0
    ) {
      return;
    }

    this.currentText += this.dialog[0][1][this.currentText.length];
    this.renderString(this.currentText);
  }
}