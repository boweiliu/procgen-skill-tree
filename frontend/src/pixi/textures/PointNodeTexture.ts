import * as Pixi from "pixi.js";
import { RenderedChunkConstants } from "../components/ChunkComponent";

export function generatePointNodeTexture(renderer: Pixi.Renderer) {
    let g = new Pixi.Graphics();
    g.beginFill(0xffffff);
    g.drawRoundedRect(
      - RenderedChunkConstants.NODE_SIZE_PX / 2,
      - RenderedChunkConstants.NODE_SIZE_PX / 2,
      RenderedChunkConstants.NODE_SIZE_PX,
      RenderedChunkConstants.NODE_SIZE_PX,
      RenderedChunkConstants.NODE_ROUNDED_PX
    );
    // g.x = 200;
    // g.y = 200;
    // this.app.stage.addChild(g);
    let texture = renderer.generateTexture(g, Pixi.SCALE_MODES.NEAREST, 1);
    // const sprite = new Pixi.Sprite(texture);
    // sprite.x = 300;
    // sprite.y = 300;
    // this.app.stage.addChild(sprite);
  return texture;
}