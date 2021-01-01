import * as Pixi from "pixi.js";
import { RenderedChunkConstants } from "./ChunkComponent";
import { UpdaterGeneratorType2 } from "../../lib/util/updaterGenerator";
import { GameState, PointNodeGen, PointNodeRef, ResourceModifier, ResourceType } from "../../data/GameState";
import { Vector2 } from "../../lib/util/geometry/vector2";
import { PixiPointFrom } from "../../lib/pixi/pixify";
import { multiplyColor } from "../../lib/util/misc";
import { TooltippableAreaComponent } from "./TooltippableAreaComponent";
import { engageLifecycle, LifecycleHandlerBase } from "./LifecycleHandler";
import { selectOrReselectNode } from "../../game/OnSelectOrReselectNode";
import { RootComponentState } from "./RootComponent";

type Props = {
  delta: number,
  args: {
    pointNodeTexture: Pixi.Texture,
    markForceUpdate: (childInstance: any) => void,
  },
  selfPointNodeRef: PointNodeRef,
  updaters: UpdaterGeneratorType2<GameState>,
  tooltipUpdaters: UpdaterGeneratorType2<RootComponentState>['tooltip'],
  position: Vector2,
  pointNodeGen: PointNodeGen,
  isSelected: boolean,
  isAllocated: boolean
};

type State = {
  numClicks: number // debug
  descriptionText: string;
}

class PointNodeComponent extends LifecycleHandlerBase<Props, State> {
  public container: Pixi.Container;
  public state: State;

  public sprite: Pixi.Sprite
  public halfwayCenterSprite: Pixi.Sprite;
  public centerSprite: Pixi.Sprite;
  public hitArea: Pixi.IHitArea;

  public tooltippableArea?: TooltippableAreaComponent

  constructor(props: Props) {
    super(props);
    this.state = {
      numClicks: 0,
      descriptionText: '',
    };
    this.updateSelf(props); // initialize the description text properly
    this.container = new Pixi.Container();

    this.container.sortableChildren = true;
    this.sprite = new Pixi.Sprite(props.args.pointNodeTexture);
    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;
    this.sprite.zIndex = -1;
    this.container.addChild(this.sprite);

    this.centerSprite = new Pixi.Sprite(props.args.pointNodeTexture);
    this.centerSprite.anchor.x = 0.5;
    this.centerSprite.anchor.y = 0.5;
    this.centerSprite.scale = PixiPointFrom(new Vector2(0.5, 0.5));
    this.centerSprite.zIndex = 1;
    this.centerSprite.alpha = 0; // TESTING
    // this.container.addChild(this.centerSprite);

    this.halfwayCenterSprite = new Pixi.Sprite(props.args.pointNodeTexture);
    this.halfwayCenterSprite.anchor.x = 0.5;
    this.halfwayCenterSprite.anchor.y = 0.5;
    this.halfwayCenterSprite.scale = PixiPointFrom(new Vector2(0.75, 0.75));
    this.halfwayCenterSprite.zIndex = 0;
    // disable this sprite for now - causes a fairly significant fps hit, until we get around to holding less nodes on the page at once
    this.halfwayCenterSprite.alpha = 0;
    // this.container.addChild(this.halfwayCenterSprite);

    this.container.interactive = true;
    // NOTE(bowei): ive tested, the following 2 settings don't significantly affect FPS
    this.container.buttonMode = true;
    this.hitArea = new Pixi.Rectangle(
      - RenderedChunkConstants.NODE_HITAREA_PX / 2,
      - RenderedChunkConstants.NODE_HITAREA_PX / 2,
      RenderedChunkConstants.NODE_HITAREA_PX,
      RenderedChunkConstants.NODE_HITAREA_PX,
    );
    // note: hitarea breaks child onhover: https://github.com/pixijs/pixi.js/issues/5837
    this.container.hitArea = this.hitArea;

    // const tooltippableAreaPropsFactory = (p: Props, s: State) => {
    //   let nodeDescription: string = "Nothing (empty node)";
    //   if (p.pointNodeGen.resourceType !== ResourceType.Nothing) {
    //     nodeDescription = `${p.pointNodeGen.resourceAmount} ${p.pointNodeGen.resourceModifier} ${p.pointNodeGen.resourceType}`;
    //   }
    //   return {
    //     args: {
    //       markForceUpdate: this.markForceUpdate,
    //     },
    //     text: nodeDescription,
    //     hitArea: this.hitArea, // TODO(bowei): move into state???
    //   }
    // }
    // this.tooltippableArea = new TooltippableAreaComponent(tooltippableAreaPropsFactory(props, this.state));
    // this.container.addChild(this.tooltippableArea.container);
    // this.addChild({
    //   childClass: TooltippableAreaComponent,
    //   instance: this.tooltippableArea,
    //   propsFactory: tooltippableAreaPropsFactory,
    // });
  }

  protected updateSelf(props: Props) {
    let nodeDescription: string = "Nothing (empty node)";
    if (props.pointNodeGen.resourceType !== ResourceType.Nothing) {
      nodeDescription = `${props.pointNodeGen.resourceAmount} ${props.pointNodeGen.resourceModifier} ${props.pointNodeGen.resourceType}`;
    }
    this.state.descriptionText = nodeDescription;
  }

  protected renderSelf(props: Props) {
    this.container.position = PixiPointFrom(props.position);
    let tint: number;
    let centerTint: number;
    if (props.isSelected) {
      tint = 0xBBBBFF;
      centerTint = 0xBBBBFF;
    } else {
      tint = 0xFFFFFF;
      centerTint = 0xFFFFFF;
    }
    if (props.isAllocated) {
      tint = 0x444444;
    } else {
    }
    let baseColor: number = 0;
    if (props.pointNodeGen.resourceType === ResourceType.Nothing) {
      baseColor = 0x99bbff; // blue that mixes in with bg
    } else if (props.pointNodeGen.resourceType === ResourceType.Mana0) {
      if (props.pointNodeGen.resourceModifier === ResourceModifier.Flat) {
        baseColor = 0xeeaaaa; // pink
      } else if (props.pointNodeGen.resourceModifier === ResourceModifier.Increased0) {
        baseColor = 0xcc88ee; // lavender?
      }
    }
    // switch (props.pointNodeGen.resourceType) {
    //   case ResourceType.Nothing:
    //     baseColor = 0x99bbff; // blue that mixes in with bg
    //     break;
    //   case ResourceType.Mana0:
    //     baseColor = 0xeeaaaa; // red
    //     break;
    //   case ResourceType.Mana1:
    //     baseColor = 0xbb7733; // brown?
    //     break;
    //   case ResourceType.Mana2:
    //     baseColor = 0x44aa44; // green
    //     break;
    // }

    this.sprite.tint = multiplyColor(baseColor, tint);
    this.centerSprite.tint = multiplyColor(baseColor, centerTint);

    // NOTE(bowei): careful, we dont want to set the scale of our tooltip to be bigger
    if (props.selfPointNodeRef.pointNodeCoord.equals(Vector2.Zero)) {
      this.container.scale = PixiPointFrom(new Vector2(1.25, 1.25));
    }
  }

  protected shouldUpdate(staleProps: Props, staleState: State, props: Props, state: State): boolean {
    for (let key of (Object.keys(staleProps) as (keyof Props)[])) {
      if (key === 'delta' || key === 'args' || key === 'updaters') { continue; }
      if (staleProps[key] !== props[key]) {
        return true;
      }
      if (key === 'position') {
        if (!staleProps[key].equals(props[key])) {
          console.log(`chunk shouldUpdate differed in ${key}, returning true`);
          return true;
        } else {
          continue;
        }
      }
      if (key === 'selfPointNodeRef') {
        if (staleProps[key]?.hash() !== props[key]?.hash()) {
          console.log(`chunk shouldUpdate differed in ${key}, returning true`);
          return true;
        } else {
          continue;
        }
      }
    }
    return false;
  }

  protected didMount() {
    const { updaters } = this._staleProps; // we assume this will never change

//     this.container.addListener('pointerover', (event: Pixi.InteractionEvent) => {
//       this.state.pointerover = event;
//     })
//     this.container.addListener('pointerout', () => {
//       this.state.pointerover = undefined;
//     })
// 

    this.container.addListener("pointerdown", (event: Pixi.InteractionEvent) => {
      this._staleProps.args.markForceUpdate(this);
      this.state.numClicks++;
      selectOrReselectNode(updaters, this._staleProps.selfPointNodeRef);
      // event.stopPropagation();
    });

    this.container.addListener('pointerover', (event: Pixi.InteractionEvent) => {
      // this._staleProps.args.markForceUpdate(this);

      // const position = new Vector2(this.container.worldTransform.tx, this.container.worldTransform.ty);

      this._staleProps.tooltipUpdaters.enqueueUpdate((prev) => {
        const next = { ...prev, visible: true, text: this.state.descriptionText };
        // console.log({ next });
        return next;
      })
    });

    this.container.addListener('pointerout', (event: Pixi.InteractionEvent) => {
      // this._staleProps.args.markForceUpdate(this);

      this._staleProps.tooltipUpdaters.enqueueUpdate((prev) => {
        const next = { ...prev, visible: false, text: '' };
        return next;
      })
    });

    this.container.addListener('pointermove', (event: Pixi.InteractionEvent) => {
      // this._staleProps.args.markForceUpdate(this);

      // source: https://www.iwm-tuebingen.de/iwmbrowser/lib/pixi/tooltip.js
      const localPosition = event.data.getLocalPosition(this.container);
      const position = new Vector2(this.container.worldTransform.tx, this.container.worldTransform.ty);

      this._staleProps.tooltipUpdaters.position.enqueueUpdate((prev) => {
        return position.add(localPosition);
      });
    })
  }

  public toString(): string {
    return "PointNodeCompoent " + this._staleProps.selfPointNodeRef.toString();
  }
}

const wrapped = engageLifecycle(PointNodeComponent);
// eslint-disable-next-line
type wrapped = PointNodeComponent;
export { wrapped as PointNodeComponent };
export type { Props as PointNodeComponentProps };