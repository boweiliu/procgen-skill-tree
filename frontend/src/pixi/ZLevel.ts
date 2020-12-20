import * as Pixi from "pixi.js";
import { Vector2 } from "../lib/util/geometry/vector2";
import { squirrel3 } from "../lib/util/random";
import { Chunk, RenderedChunk } from "./Chunk";


export class ZLevel {
  private id: number;
  public z: number;
  public chunks: Chunk[] = []

  constructor(seed: number, zIndex: number) {
    this.z = zIndex;
    this.id = squirrel3(seed + this.z);

    // pregenerate stuff
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        this.chunks.push(new Chunk(this.id, new Vector2(i, j)));
      }
    }
  }
}


export class RenderedZLevel {
  public zLevel!: ZLevel;

  public container: Pixi.Container;

  constructor(zLevel: ZLevel, onNodeFocus: Function) {
    this.zLevel = zLevel;
    this.container = new Pixi.Container();
    // this.actionStage.addChild(chunksContainer);
    // this.container.x = this.app.screen.width/2;
    // this.container.y = this.app.screen.height/2;
    // this.onResize.push(() => {
    //   chunksContainer.x = this.app.screen.width/2;
    //   chunksContainer.y = this.app.screen.height/2;
    // })

    for (let chunk of this.zLevel.chunks) {
      this.container.addChild(
        new RenderedChunk(chunk, onNodeFocus).container
      )
    }
  }
}