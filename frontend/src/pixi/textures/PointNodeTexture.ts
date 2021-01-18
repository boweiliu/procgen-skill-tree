import * as Pixi from "pixi.js";
import COLORS from "../colors";
import { RenderedChunkConstants } from "../components/ChunkComponent";

export type PointNodeTextureSet = ({ cropFraction: number, texture: Pixi.Texture })[];

export function generatePointNodeTexture(renderer: Pixi.Renderer): PointNodeTextureSet {
  // generate sprite textures for 0 to 100% vertical cropped in increments of 1/8
  let textureSet: PointNodeTextureSet = [];
  for (let i = 0; i <= 8; i++) {
    const cropFraction = i / 8;
    let g = new Pixi.Graphics();
    g.beginFill(COLORS.white);
    g.drawRoundedRect(
      - RenderedChunkConstants.NODE_SIZE_PX / 2,
      - RenderedChunkConstants.NODE_SIZE_PX / 2,
      RenderedChunkConstants.NODE_SIZE_PX,
      RenderedChunkConstants.NODE_SIZE_PX,
      RenderedChunkConstants.NODE_ROUNDED_PX
    );
    let mask = new Pixi.Graphics();
    mask.beginFill(COLORS.black);
    mask.drawRect(
      - RenderedChunkConstants.NODE_SIZE_PX / 2,
      - RenderedChunkConstants.NODE_SIZE_PX / 2,
      RenderedChunkConstants.NODE_SIZE_PX,
      RenderedChunkConstants.NODE_SIZE_PX * cropFraction
    );
    g.mask = mask;
    // g.x = 200;
    // g.y = 200;
    // this.app.stage.addChild(g);
    // let texture = renderer.generateTexture(g, Pixi.SCALE_MODES.NEAREST, 1);
    let texture = renderer.generateTexture(g, Pixi.SCALE_MODES.LINEAR, 1);
    // const sprite = new Pixi.Sprite(texture);
    // sprite.x = 300;
    // sprite.y = 300;
    // this.app.stage.addChild(sprite);
    textureSet.push({
      cropFraction, texture
    });
  }
  return textureSet;
}