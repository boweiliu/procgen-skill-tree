import './GameAreaGrid.css';
import './GameArea.css';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyedHashMap } from '../../lib/util/data_structures/hash';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { NodeReactData } from './computeVirtualNodeDataMap';
import { hexGridPx } from './GameAreaStateManager';
import { GameAreaCell } from './GameAreaCell';
import { GameState, NodeAllocatedStatus } from '../../data/GameState';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';

export type UpdateStatusCb = (args: {
  virtualCoords: Vector2;
  newStatus: NodeAllocatedStatus;
}) => void;

export const GameAreaGrid = React.memo(Component);
/**
 * Dumb-ish component that manages the game board where the skill tree is located, as well as the "virtual"
 * game space which is larger than the currently visible scrollable area the player can see.
 *
 * @param hidden whether this component is visible or not.
 * @param appSize the size of the area used to play the game
 * @param intent keyboard controls mapped to "intents" i.e. game functions
 * @param virtualGridDims the integer dimensions of the virtual scrollable space, measured in grid units.
 * @param jumpOffset integers. if non-null, jump callbackwas recently requested. otherwise it is guaranteed to be identical object reference as the last time this component was rendered.
 * @param virtualCoordsToLocation utility stateless function to convert from ui virtual grid dims (ints) to 3d node location in game state (ints)
 * @param virtualNodeDataMap table of ui grid location to object containing react fragments for contents of that node
 * @param updateNodeStatusCb callback for when a node is allocated and the node status needs to change.
 * @param onJump callback for when this component wants to communicate that a jump should be triggered. the jump offset is then supposed to come down as props in the next render cycle.
 * @param cursoredVirtualNode 2d virtual dims of the node which is currently cursored (flashing and may show up in sidebar), or undefined if there is none
 * @param setCursoredVirtualNode callback which takes virtual 2d coords and causes that node to now be cursored.
 * @param keyboardScrollDirection if nonzero, player is trying to scroll using keyboard controls
 */
function Component(props: {
  hidden: boolean;
  appSize: Vector2;
  updaters: UpdaterGeneratorType2<GameState, GameState>;
  // intent: PlayerIntentState;
  // virtualSize: Vector2; // in pixels
  virtualGridDims: Vector2; // in grid units. width x height, width is guaranteed to be half-integer value
  // this object reference is guaranteed to be stable unless jump cb is called

  // jumpOffset?: Vector2; // if non-null, jump callback was recently requested, and this is the recommended jump offset in grid dims
  virtualCoordsToLocation: (v: Vector2) => Vector3;
  virtualNodeDataMap: KeyedHashMap<Vector2, NodeReactData>;
  // specify virtual coordinates of the node and the new status to cause an update.
  updateNodeStatusCb: UpdateStatusCb;
  // onJump: (args: { direction: Vector2 }) => void;
  cursoredVirtualNode: Vector2 | undefined;
  setCursoredVirtualNode: (v: Vector2 | undefined) => void;
  keyboardScrollDirection: Vector2;
}) {
  // console.log('Game area component rerender');

  const container = useRef<HTMLDivElement>(null);
  const previousContainer = useRef<HTMLDivElement>(null) as any;
  const gridWidth = hexGridPx.x;
  const gridHeight = hexGridPx.y;
  const [jumpOffset, setJumpOffset] = useState(new Vector2(0, 0));
  const { virtualGridDims } = props;

  // Receives a Vector2 instance jumpOffset,
  // and uses offset to jump to a new scroll position
  useEffect(() => {
    // const jumpOffset = props.jumpOffset;
    // console.log({ receivedJumpOffset: jumpOffset }, +new Date());
    if (!jumpOffset) return;
    const ref = container.current;
    if (!ref) return;
    ref.scrollTo(
      ref.scrollLeft - jumpOffset.x * gridWidth,
      ref.scrollTop - jumpOffset.y * gridHeight
    );
  }, [jumpOffset]);

  const handleJump = useCallback(
    (args: { direction: Vector2 }) => {
      // direction: if we hit bottom right of screen, direction == (1,1)
      // console.log({ direction: args.direction });
      let jumpAmounts = virtualGridDims.multiply(0.35).floor();
      jumpAmounts = jumpAmounts.withY(Math.floor(jumpAmounts.y / 2) * 2);
      jumpAmounts = jumpAmounts
        .clampX(1, virtualGridDims.x - 1)
        .clampY(2, Math.floor((virtualGridDims.y - 1) / 2) * 2);
      const jumpOffset = jumpAmounts.multiply(args.direction);
      console.log({ jumpOffset });
      props.updaters.playerUI.virtualGridLocation.enqueueUpdate((it) => {
        return it
          .addX(jumpOffset.x)
          .add(new Vector3(-1, -2, 0).multiply(jumpOffset.y / 2));
      });
      setJumpOffset(jumpOffset.multiply(1));
    },
    [virtualGridDims, props.updaters]
  );

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
        // console.log('jump!', +new Date());
        // target.scrollTo(newScrollLeft, newScrollTop);
        handleJump({ direction: new Vector2(direction.x, direction.y) });
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

  // control scroll with keyboard
  useEffect(() => {
    if (!props.keyboardScrollDirection.equals(Vector2.Zero)) {
      // console.log('nonzero keyboard scroll direction update received');

      let lastTime: number | null = null;
      const SCROLL_INTERVAL_MS = 8;
      const VELOCITY = 0.75;
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
      // className="game-area hidden-scrollbars"
      className="game-area"
      hidden={props.hidden}
      onScroll={handleScroll}
    >
      <div className="virtual-game-area">
        <>
          {Array(props.virtualGridDims.y)
            .fill(0)
            .map((_, y) => (
              <Row
                key={props
                  .virtualCoordsToLocation(new Vector2(0, y))
                  .y.toString()}
                rowIdx={y}
              >
                {Array(props.virtualGridDims.x)
                  .fill(0)
                  .map((_, x) => {
                    const virtualCoords = new Vector2(x, y);
                    const nodeData = props.virtualNodeDataMap.get(
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
        </>
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

  // If the row number is odd, prepend a half-block to the row contents of hex blocks
  // Else, if the row number is even, append a half-block
  return (
    <div className="hex-block-row">
      {odd && <div className="hex-block hex-half-block" />}
      {children}
      {!odd && <div className="hex-block hex-half-block" />}
    </div>
  );
}
