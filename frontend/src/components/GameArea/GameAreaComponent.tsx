import './GameAreaComponent.css';
import './GameArea.css';

import React, { useCallback, useEffect, useRef } from 'react';
import { KeyedHashMap } from '../../lib/util/data_structures/hash';
import { Vector2 } from '../../lib/util/geometry/vector2';
import COLORS, { colorToCss } from '../../pixi/colors';
import { IntentName, PlayerIntentState } from '../../data/GameState';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { NodeReactData } from './computeVirtualNodeDataMap';
import { hexGridPx, hexCenterRadius } from './GameAreaStateManager';
import { GameAreaCell } from './GameAreaCell';

/**
 * TODO(bowei): move these enums out of here into game state
 */
export enum NodeAllocatedStatus {
  // DEPRECATED
  TAKEN = 'TAKEN',

  // NOT DEPRECATED
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  AVAILABLE = 'AVAILABLE', // availability status regardless of locks, only taking into account connectivity
  UNREACHABLE = 'UNREACHABLE',
}

export enum LockStatus {
  CLOSED = 'CLOSED',
  TICKING = 'TICKING',
  OPEN = 'OPEN',
}

export type UpdateStatusCb = (args: {
  virtualDims: Vector2;
  newStatus: NodeAllocatedStatus;
}) => void;

export const GameAreaComponent = React.memo(GameArea);
/**
 * Dumb-ish component that manages the game board where the skill tree is located, as well as the "virtual"
 * game space which is larger than the currently visible scrollable area the player can see.
 *
 * @param hidden whether this component is visible or not.
 * @param appSize the size of the area used to play the game
 * @param intent keyboard controls mapped to "intents" i.e. game functions
 * @param virtualGridDims the integer dimensions of the virtual scrollable space, measured in grid units.
 * @param jumpOffset integers. if non-null, jump callbackwas recently requested. otherwise it is guaranteed to be identical object reference as the last time this component was rendered.
 * @param virtualDimsToLocation utility stateless function to convert from ui virtual grid dims (ints) to 3d node location in game state (ints)
 * @param virtualGridStatusMap table of ui grid location to object containing react fragments for contents of that node
 * @param updateNodeStatusCb callback for when a node is allocated and the node status needs to change.
 * @param onJump callback for when this component wants to communicate that a jump should be triggered. the jump offset is then supposed to come down as props in the next render cycle.
 * @param cursoredVirtualNode 2d virtual dims of the node which is currently cursored (flashing and may show up in sidebar), or undefined if there is none
 * @param setCursoredVirtualNode callback which takes virtual 2d coords and causes that node to now be cursored.
 * @param keyboardScrollDirection if nonzero, player is trying to scroll using keyboard controls
 */
function GameArea(props: {
  hidden: boolean;
  appSize: Vector2;
  // intent: PlayerIntentState;
  // virtualSize: Vector2; // in pixels
  virtualGridDims: Vector2; // in grid units. width x height, width is guaranteed to be half-integer value
  // this object reference is guaranteed to be stable unless jump cb is called

  jumpOffset?: Vector2; // if non-null, jump callback was recently requested, and this is the recommended jump offset in grid dims
  virtualDimsToLocation: (v: Vector2) => Vector3;
  virtualGridStatusMap: KeyedHashMap<Vector2, NodeReactData>;
  // specify virtual coordinates of the node and the new status to cause an update.
  updateNodeStatusCb: UpdateStatusCb;
  onJump: (args: { direction: Vector2 }) => void;
  cursoredVirtualNode: Vector2 | undefined;
  setCursoredVirtualNode: (v: Vector2 | undefined) => void;
  keyboardScrollDirection: Vector2;
}) {
  const container = useRef<HTMLDivElement>(null);
  const previousContainer = useRef<HTMLDivElement>(null) as any;
  const gridWidth = hexGridPx.x;
  const gridHeight = hexGridPx.y;

  // Set css variables from react
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--grid-width',
      ` ${hexGridPx.x}px`
    );
    document.documentElement.style.setProperty(
      '--grid-height',
      ` ${hexGridPx.y}px`
    );
  }, [hexGridPx]);
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--hex-center-radius',
      ` ${hexCenterRadius}px`
    );
  }, [hexCenterRadius]);
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--background-black',
      colorToCss(COLORS.backgroundBlue)
    );
    document.documentElement.style.setProperty(
      '--deemphasized-black',
      colorToCss(COLORS.grayBlack)
    );
    document.documentElement.style.setProperty(
      '--active-purple',
      colorToCss(COLORS.nodePink)
    );
    document.documentElement.style.setProperty(
      '--border-unimportant-black',
      colorToCss(COLORS.borderBlack)
    );
    document.documentElement.style.setProperty(
      '--border-important-white',
      colorToCss(COLORS.borderWhite)
    );
  }, [COLORS]);
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--app-size-width',
      ` ${props.appSize.x}px`
    );
    document.documentElement.style.setProperty(
      '--app-size-height',
      ` ${props.appSize.y}px`
    );
  }, [props.appSize]);

  // Receives a Vector2 instance jumpOffset,
  // and uses offset to jump to a new scroll position
  useEffect(() => {
    const jumpOffset = props.jumpOffset;
    console.log({ receivedJumpOffset: jumpOffset }, +new Date());
    if (!jumpOffset) return;
    const ref = container.current;
    if (!ref) return;
    ref.scrollTo(
      ref.scrollLeft - jumpOffset.x * gridWidth,
      ref.scrollTop - jumpOffset.y * gridHeight
    );
  }, [props.jumpOffset]);

  /**
   * Detect if the user has scrolled to the edge of the screen, and if so trigger a scroll jump
   */
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
      // console.log("NOW IN handlescroll");
      // handle scroll
      let direction = { x: 0, y: 0 };
      const target = e.target! as Element;
      let newScrollTop = target.scrollTop; // only used as boolean to see if it changed
      let newScrollLeft = target.scrollLeft;
      if (target.scrollTop < gridHeight * 0.4) {
        // between 0.1 and 0.4 of leeway is recommended. increasing it more helps with lag but also incurs more virtual area cost.
        newScrollTop += gridHeight * 2;
        direction.y -= 1;
      }
      if (
        target.scrollTop >
        (props.virtualGridDims.y - 0.4) * gridHeight - props.appSize.y
      ) {
        newScrollTop -= gridHeight * 2;
        direction.y += 1;
      }
      if (target.scrollLeft < gridWidth * 0.9) {
        // between 0.6 and 0.9 of leeway is recommended. increasing it more helps with lag but also incurs more virtual area cost.
        newScrollLeft += gridWidth * 2;
        direction.x -= 1;
      }
      if (
        target.scrollLeft >
        (props.virtualGridDims.x - 0.9) * gridWidth - props.appSize.x
      ) {
        newScrollLeft -= gridWidth * 2;
        direction.x += 1;
      }
      // console.log(target);
      // console.log(target.scrollTop);
      // console.log(target.scrollLeft);

      if (
        target.scrollTop !== newScrollTop ||
        target.scrollLeft !== newScrollLeft
      ) {
        console.log('jump!', +new Date());
        // target.scrollTo(newScrollLeft, newScrollTop);
        props.onJump({ direction: new Vector2(direction.x, direction.y) });
      }
    },
    [props.appSize.x, props.appSize.y]
  );

  // Set initial position in the center, exactly once!
  useEffect(() => {
    if (
      container.current != null &&
      container.current !== previousContainer.current
    ) {
      container.current.scrollTop =
        (props.virtualGridDims.y * gridHeight - props.appSize.y) / 2;
      container.current.scrollLeft =
        ((props.virtualGridDims.x + 0.5) * gridWidth - props.appSize.x) / 2;
    }
    previousContainer.current = container.current;
  }, [container.current, props.appSize]);

  console.log('Game area component rerender');

  // control scroll with keyboard
  useEffect(() => {
    if (!props.keyboardScrollDirection.equals(Vector2.Zero)) {
      console.log('nonzero keyboard scroll direction update received');

      let lastTime: number | null = null;
      const SCROLL_INTERVAL_MS = 10;
      const VELOCITY = 0.5;
      const action = () => {
        const ref = container.current;
        if (!ref) return;
        let direction = Vector2.Zero;
        if (lastTime === null) {
          direction = props.keyboardScrollDirection.multiply(
            SCROLL_INTERVAL_MS
          ); // assume 1 tick
          lastTime = +new Date();
        } else {
          const elapsed = +new Date() - lastTime;
          if (elapsed > 40) {
            console.log('WAS SLOW - ' + elapsed.toString());
          }
          direction = props.keyboardScrollDirection.multiply(elapsed);
          lastTime = +new Date();
        }
        direction = direction.multiply(VELOCITY);
        ref.scrollTo(
          ref.scrollLeft + direction.x,
          ref.scrollTop - direction.y // scroll is measured from the top left
        );
      };
      const interval = setInterval(action, SCROLL_INTERVAL_MS);
      action();
      return () => clearInterval(interval);
    }
  }, [props.keyboardScrollDirection, container.current]);

  /**
   * See pointer/mouse, over/enter/out/leave, event propagation documentation
   * https://www.w3schools.com/jquery/tryit.asp?filename=tryjquery_event_mouseenter_mouseover#:~:text=mouseenter%20and%20mouseover.-,The%20mouseover%20event%20triggers%20when%20the%20mouse%20pointer%20enters%20the,moved%20over%20the%20div%20element.
   * https://stackoverflow.com/questions/4697758/prevent-onmouseout-when-hovering-child-element-of-the-parent-absolute-div-withou
   * https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
   * https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Examples#example_5_event_propagation
   * https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation
   * https://developer.mozilla.org/en-US/docs/Web/API/Event/target
   * https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget
   * https://stackoverflow.com/questions/55546973/react-onmouseenter-event-triggering-on-child-element
   * https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
   */
  return (
    <div
      ref={container}
      className="game-area hidden-scrollbars"
      hidden={props.hidden}
      onScroll={handleScroll}
    >
      <div className="virtual-game-area">
        {Array(props.virtualGridDims.y)
          .fill(0)
          .map((_, y) => (
            <Row
              key={props.virtualDimsToLocation(new Vector2(0, y)).y.toString()}
              rowIdx={y}
            >
              {Array(props.virtualGridDims.x)
                .fill(0)
                .map((_, x) => {
                  const virtualCoords = new Vector2(x, y);
                  const nodeData = props.virtualGridStatusMap.get(
                    virtualCoords
                  )!;
                  return (
                    <GameAreaCell
                      nodeData={nodeData}
                      key={nodeData?.id ?? `loading${x}`}
                      idx={x}
                      rowIdx={y}
                      onUpdateStatus={props.updateNodeStatusCb}
                      isCursored={
                        !!props.cursoredVirtualNode &&
                        props.cursoredVirtualNode.equals(virtualCoords)
                      }
                      onUpdateCursored={props.setCursoredVirtualNode}
                    />
                  );
                })}
            </Row>
          ))}
      </div>
    </div>
  );
}

const Row = React.memo(RowComponent);

function RowComponent({
  rowIdx,
  children,
}: {
  rowIdx: number;
  children?: React.ReactNode;
}) {
  /* https://stackoverflow.com/questions/1015809/how-to-get-floating-divs-inside-fixed-width-div-to-continue-horizontally */
  const odd = !!(rowIdx % 2);

  return (
    <div className="hex-block-row">
      {odd && <div className="hex-block hex-half-block" />}
      {children}
      {!odd && <div className="hex-block hex-half-block" />}
    </div>
  );
}
