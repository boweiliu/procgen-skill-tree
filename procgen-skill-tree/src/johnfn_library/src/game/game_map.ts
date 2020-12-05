import { Entity } from "../library/entity";
import { IGameState } from "Library";
import { RectGroup } from "../library/geometry/rect_group";
import { TiledTilemap } from "../library/tilemap/tilemap";
import { Assets } from "./assets";
import { Rect } from "../library/geometry/rect";

export class GameMap extends Entity {
  map: TiledTilemap;

  constructor(state: IGameState) {
    super({
      collidable: true,
      name: "GameMap",
    });

    this.map = new TiledTilemap({
      json: Assets.getResource("map"),
      assets: Assets,
      renderer: state.renderer,
      pathToTilemap: "",
      customObjects: [],
    });

    const layers = this.map.loadLayersInRectCached(new Rect({
      x: 0,
      y: 0,
      width: 640,
      height: 640,
    }));

    for (const layer of layers) {
      this.addChild(layer.entity);
    }
  }

  collisionBounds(): RectGroup {
    const rects = this.map._data.getCollidersInRegionForLayer(
      new Rect({ x: 0, y: 0, width: 1000, height: 1000 }),
      "Tile Layer 1",
    );

    return rects;
  }
}