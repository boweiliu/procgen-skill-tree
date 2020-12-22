import * as Pixi from "pixi.js";

export class Reticle {
  public container: Pixi.Graphics;
  constructor(args: {
  }) {
    this.container = new Pixi.Graphics();
    this.container.lineStyle(2, 0x999999);
    this.container.drawCircle(0, 0, 6);
    // this.container.x = this.app.screen.width / 2;
    // this.container.y = this.app.screen.height / 2;
    this.container.interactive = true;

    // this.onResize.push(() => {
    //   this.container.x = this.app.screen.width / 2;
    //   this.container.y = this.app.screen.height / 2;
    // })
  }

  public rerender(props: {
    width: number,
    height: number
  }) {
    this.container.x = props.width;
    this.container.y = props.height;
  }
}