import { Texture, Rectangle, BaseTexture } from "pixi.js";

export class Spritesheet extends Texture {
  private _tileWidth: number;
  private _tileHeight: number;

  constructor(texture: BaseTexture, tileWidth: number, tileHeight: number) {
    super(texture);

    this._tileWidth = tileWidth;
    this._tileHeight = tileHeight;

    this.setTile(0, 0);
  }

  public setTile(tilesheetX: number, tilesheetY: number): void {
    this.frame = new Rectangle(
      tilesheetX * this._tileWidth,
      tilesheetY * this._tileHeight,
      this._tileWidth,
      this._tileHeight
    );

    this.updateUvs();
  }
}