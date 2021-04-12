import * as Pixi from 'pixi.js';
import bunny from '../bunny.png';

export default function createBunnyExample(args: {
  parent: Pixi.Container;
  x: number;
  y: number;
  ticker: Pixi.Ticker;
}) {
  // Taken from  https://pixijs.io/examples/#/demos-basic/container.js
  const container = new Pixi.Container();

  // Create a new texture
  const texture = Pixi.Texture.from(bunny);

  window.alert('doing bunny stuff');

  // Create a 5x5 grid of bunnies
  for (let i = 0; i < 25; i++) {
    const bunny = new Pixi.Sprite(texture);
    bunny.anchor.set(0.5);
    bunny.x = (i % 5) * 40;
    bunny.y = Math.floor(i / 5) * 40;
    container.addChild(bunny);
    bunny.interactive = true;
    // bunny.addListener('pointerdown', () => {
    //   window.alert('clicked bunny #' + i);
    // });
  }

  // console.log({ width: container.width, height: container.height });
  // draw a boundary
  const border = new Pixi.Graphics();
  border.lineStyle(2, 0x000000);
  border.beginFill(0, 0);
  let bounds = container.getBounds();
  border.drawRect(bounds.x, bounds.y, bounds.width, bounds.height);
  container.addChild(border);

  // Move container to the center
  container.x = args.x;
  container.y = args.y;

  // Center bunny sprite in local container coordinates
  // container.pivot.x = container.width / 2;
  // container.pivot.y = container.height / 2;
  let localBounds = container.getLocalBounds();
  container.pivot.x = localBounds.x + localBounds.width / 2;
  container.pivot.y = localBounds.y + localBounds.height / 2;
  // console.log({ width: bounds.width, height: bounds.height });
  // console.log({ width: container.width, height: container.height });

  // Listen for animate update
  args.ticker.add((delta) => {
    // rotate the container!
    // use delta to create frame-independent transform
    container.rotation -= 0.01 * delta;
  });

  // Register it to the parent
  args.parent.addChild(container);

  // chaining?
  return args.parent;
}
