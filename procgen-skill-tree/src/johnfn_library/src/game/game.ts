import { BaseGame } from "../library/base_game";
import { AssetsToLoad, Assets } from "./assets";
import { Player } from "./player";
import { DebugFlags } from "./debug";
import { C } from "./constants";
import { TiledTilemap } from "../library/tilemap/tilemap";
import { Rect } from "../library/geometry/rect";
import { NineSlicePlane } from "pixi.js";
import { Npc } from "./npc";
import { GameMap } from "./game_map";
import { Dialog } from "./dialog";
import { Hud } from "./hud";
import { IGameState, ModeList } from "Library";

interface MyGameState extends IGameState {
  player: Player;
  hud: Hud;
  map: GameMap;
}

export interface MyModeList extends ModeList {
  Dialog: never;
  Menu: never;
}

export class Game extends BaseGame<typeof AssetsToLoad, MyModeList, MyGameState> {
  constructor() {
    super({
      canvasWidth: C.CanvasWidth,
      canvasHeight: C.CanvasHeight,
      tileWidth: C.TileWidth,
      tileHeight: C.TileHeight,
      scale: 1,
      assets: Assets,
      debugFlags: DebugFlags,
      state: {
        tick: 0,
        map: undefined as any,
        player: undefined as any,
        hud: undefined as any,
      },
    });
    
    this.mountToReact(DebugFlags);
  }

  initialize() {
    let x: Npc;

    this.stage.addChild(this.state.player = new Player());
    this.stage.addChild(x = new Npc());

    x.x = 200;
    x.y = 100;

    this.state.player.x = 300;
    this.state.player.y = 100;

    this.stage.addChild(this.state.map = new GameMap(this.state));
    this.fixedCameraStage.addChild(this.state.hud = new Hud());
  }
}
