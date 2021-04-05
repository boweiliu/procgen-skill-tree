import { InteractionData } from 'pixi.js';

/**
 * CONSIDER importing: https://www.npmjs.com/package/pixi-viewport https://davidfig.github.io/pixi-viewport/
 * NOTE: on mobile multitouch, runs into issues when:
 * 1. hold 1 finger down and move it around (works)
 * 2. put down another finger (note that the newest finger controls the drag)
 * 3. release the second finger
 * 4. the first finger (which is the only "down" finger) no longer controls drag!!! bad!!!
 */
export class DraggableHelper {
  private sourceContainer!: PIXI.Container;
  private targetContainer!: PIXI.Container;
  private targetStartingX!: number;
  private targetStartingY!: number;
  private mouseStartingX!: number;
  private mouseStartingY!: number;
  private data!: InteractionData; // TODO(bowei): what is this
  private isDragging: boolean = false;
  // private dragRatio: number = 1;

  constructor(args: { source: PIXI.Container; target: PIXI.Container }) {
    let { source, target } = args;
    source.interactive = true;

    // this.dragRatio = ratio;
    this.sourceContainer = source;
    this.targetContainer = target;

    source.addListener('pointerdown', this.onDragStart);

    source.addListener('pointerup', this.onDragEnd);
    source.addListener('pointerupoutside', this.onDragEnd);

    source.addListener('pointermove', this.onDragMove);
  }

  private onDragStart = (event: PIXI.InteractionEvent) => {
    this.data = event.data;
    this.targetStartingX = this.targetContainer.x;
    this.targetStartingY = this.targetContainer.y;
    const startingPosition = this.data.getLocalPosition(this.sourceContainer);
    this.mouseStartingX = startingPosition.x;
    this.mouseStartingY = startingPosition.y;

    this.isDragging = true;
  };

  private onDragEnd = () => {
    this.isDragging = false;
  };

  private onDragMove = () => {
    if (this.isDragging) {
      // wtf??
      const localPosition = this.data.getLocalPosition(this.sourceContainer);
      this.targetContainer.x =
        this.targetStartingX + (localPosition.x - this.mouseStartingX);
      this.targetContainer.y =
        this.targetStartingY + (localPosition.y - this.mouseStartingY);
    }
  };
}

export function registerDraggable(args: {
  source: PIXI.Container;
  target: PIXI.Container;
  ratio?: number;
}): DraggableHelper {
  return new DraggableHelper(args);
}
