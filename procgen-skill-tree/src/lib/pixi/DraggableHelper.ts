import { InteractionData } from "pixi.js";


export class DraggableHelper {
  private sourceContainer!: PIXI.Container
  private targetContainer!: PIXI.Container
  private targetStartingX!: number;
  private targetStartingY!: number;
  private mouseStartingX!: number;
  private mouseStartingY!: number;
  private data!: InteractionData // TODO(bowei): what is this
  private isDragging: boolean = false;
  // private dragRatio: number = 1;

  constructor(args: {
    source: PIXI.Container,
    target: PIXI.Container,
  }) {
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
    const startingPosition = this.data.getLocalPosition(this.sourceContainer)
    this.mouseStartingX = startingPosition.x;
    this.mouseStartingY = startingPosition.y;

    console.log(this);
    this.isDragging = true;
  }

  private onDragEnd = () => {
    this.isDragging = false;
  }

  private onDragMove = () => {
    if (this.isDragging) {
      // wtf??
      const localPosition = this.data.getLocalPosition(this.sourceContainer);
      this.targetContainer.x = this.targetStartingX + (localPosition.x - this.mouseStartingX);
      this.targetContainer.y = this.targetStartingY + (localPosition.y - this.mouseStartingY);
    }
  }
}

export function registerDraggable(args: {
    source: PIXI.Container,
    target: PIXI.Container,
    ratio?: number
}) : DraggableHelper {
  return new DraggableHelper(args);
}