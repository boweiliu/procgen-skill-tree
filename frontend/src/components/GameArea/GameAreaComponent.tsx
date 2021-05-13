import './GameAreaComponent.css';

import classnames from 'classnames';
import React, { useCallback, useEffect, useRef } from 'react';
import { KeyedHashMap } from '../../lib/util/data_structures/hash';
import { Vector2 } from '../../lib/util/geometry/vector2';
import COLORS, { colorToCss } from '../../pixi/colors';
import { IntentName, PlayerIntentState } from '../../data/GameState';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { NodeReactData } from './computeVirtualNodeDataMap';
// import { hexGridPx } from './GameAreaStateManager';

export const GameAreaComponent = React.memo(GameArea);

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

type UpdateStatusCb = (args: {
  virtualDims: Vector2;
  newStatus: NodeAllocatedStatus;
}) => void;

const hexCenterRadius = 32;

const hexGridPx = new Vector2(268, 232);
const gridWidth = hexGridPx.x;
const gridHeight = hexGridPx.y;

function GameArea(props: {
  hidden: boolean;
  appSize: Vector2;
  intent: PlayerIntentState;
  // virtualSize: Vector2; // in pixels
  virtualGridDims: Vector2; // in grid units. width x height, width is guaranteed to be half-integer value
  // this object reference is guaranteed to be stable unless jump cb is called

  jumpOffset?: Vector2; // if non-null, jump callback was recently requested, and this is the recommended jump offset in grid dims
  virtualDimsToLocation: (v: Vector2) => Vector3;
  virtualGridStatusMap: KeyedHashMap<Vector2, NodeReactData>;
  // specify virtual coordinates of the node and the new status to cause an update.
  updateNodeStatusCb: UpdateStatusCb;
  onJump: (args: { direction: Vector2 }) => void;
}) {
  useEffect(() => {
    // jumps to a new scroll position based on the newly received Vector2 instance jumpOffset
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

  const hexBlockStyle = { width: gridWidth + 'px', height: gridHeight + 'px' };
  const hexHalfBlockStyle = {
    width: gridWidth / 2 + 'px',
    height: gridHeight + 'px',
  };
  const hexCenterStyle = {
    width: hexCenterRadius * 2 + 'px',
    height: hexCenterRadius * 2 + 'px',
    // backgroundColor: colorToCss(COLORS.nodePink),
    // borderColor: colorToCss(COLORS.nodeBorder),
  };
  const hexCenterLockStyle = {
    marginLeft: `-${hexCenterRadius * 2}px`,
    width: hexCenterRadius * 2 + 'px',
    height: hexCenterRadius * 5 + 'px',
    // backgroundColor: colorToCss(COLORS.nodePink),
    // borderColor: colorToCss(COLORS.nodeBorder),
  };
  const hexCenterLockBlockStyle = {
    // width: hexCenterRadius - 12 + 'px',
    width: hexCenterRadius * 2 + 'px',
    height: hexCenterRadius + 'px',
    marginTop: hexCenterRadius + 'px',
    // backgroundColor: colorToCss(COLORS.nodePink),
    // borderColor: colorToCss(COLORS.nodeBorder),
  };

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
      // console.log("NOW IN handlescroll");
      // const scrollRoom = virtualAreaSize.subtract(props.appSize);
      // const scrollMod = scrollRoom.divide(virtualGrids);
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

  const container = useRef<HTMLDivElement>(null);
  const previousContainer = useRef<HTMLDivElement>(null) as any;
  useEffect(() => {
    // Set initial position in the center
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
    let lastTime: number | null = null;
    const SCROLL_INTERVAL_MS = 10;
    const VELOCITY = 0.5;
    const action = () => {
      const ref = container.current;
      if (!ref) return;
      let direction = Vector2.Zero;
      if (props.intent.activeIntent[IntentName.PAN_EAST]) {
        direction = direction.addX(1);
      }
      if (props.intent.activeIntent[IntentName.PAN_WEST]) {
        direction = direction.addX(-1);
      }
      if (props.intent.activeIntent[IntentName.PAN_NORTH]) {
        direction = direction.addY(1);
      }
      if (props.intent.activeIntent[IntentName.PAN_SOUTH]) {
        direction = direction.addY(-1);
      }
      // if (!direction.equals(Vector2.Zero)) {
      //   // window.alert(" got direction " +  direction.toString() + props.intent.toString());
      //   console.log(" got direction ", new Date(), direction, props.intent);
      // }
      if (lastTime === null) {
        direction = direction.multiply(SCROLL_INTERVAL_MS); // assume 1 tick
        lastTime = +new Date();
      } else {
        const elapsed = +new Date() - lastTime;
        if (elapsed > 40) {
          // This REGULARLY fires with a reported delay of 150-200ms, even when scrolling with mouse
          // for some reason (react optimization??) mouse scrolling is much smoother than keyboard
          console.log('WAS SLOW - ' + elapsed.toString());
        }
        direction = direction.multiply(elapsed);
        lastTime = +new Date();
      }
      direction = direction.multiply(VELOCITY);
      // direction = direction.multiply(10);
      ref.scrollTo(
        ref.scrollLeft + direction.x,
        ref.scrollTop - direction.y // scroll is measured from the top left
      );
    };
    const interval = setInterval(action, SCROLL_INTERVAL_MS);
    action();
    return () => clearInterval(interval);
  }, [props.intent.activeIntent, props.intent.newIntent, container.current]);

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
      className="game-area"
      hidden={props.hidden}
      style={{
        width: props.appSize.x,
        height: props.appSize.y,
        backgroundColor: colorToCss(COLORS.backgroundBlue),
      }}
      onScroll={handleScroll}
    >
      <div
        className="virtual-game-area"
        style={
          {
            // width: virtualAreaSize.x,
            // height: virtualAreaSize.y,
          }
        }
        onPointerOver={(e: React.PointerEvent) => {
          // console.log(e);
        }}
        onClick={(e: React.MouseEvent) => {
          // console.log(e);
        }}
      >
        {Array(props.virtualGridDims.y)
          .fill(0)
          .map((_, y) => (
            <Row
              key={props.virtualDimsToLocation(new Vector2(0, y)).y.toString()}
              rowIdx={y}
              hexHalfBlockStyle={hexHalfBlockStyle}
            >
              {Array(props.virtualGridDims.x)
                .fill(0)
                .map((_, x) => {
                  const nodeData = props.virtualGridStatusMap.get(
                    new Vector2(x, y)
                  )!;
                  return (
                    <Node
                      nodeData={nodeData}
                      key={nodeData?.id ?? `loading${x}`}
                      status={nodeData.status}
                      hexBlockStyle={hexBlockStyle}
                      idx={x}
                      rowIdx={y}
                      hexCenterStyle={hexCenterStyle}
                      hexCenterLockStyle={hexCenterLockStyle}
                      hexCenterLockBlockStyle={hexCenterLockBlockStyle}
                      onUpdateStatus={props.updateNodeStatusCb}
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
  hexHalfBlockStyle,
  children,
}: {
  rowIdx: number;
  hexHalfBlockStyle: any;
  children?: React.ReactNode;
}) {
  /* https://stackoverflow.com/questions/1015809/how-to-get-floating-divs-inside-fixed-width-div-to-continue-horizontally */
  const odd = !!(rowIdx % 2);

  return (
    <div className="hex-block-row">
      {odd && <div className="hex-block" style={hexHalfBlockStyle} />}
      {children}
      {!odd && <div className="hex-block" style={hexHalfBlockStyle} />}
    </div>
  );
}

/**
 * Renderes a single rectangular component of a hex grid.
 * Contains a central node, hover-over tooltips attached to the node, and optionally 2 rectangular text boxes
 * that represent the locked state.
 */
const Cell = React.memo(CellComponent);
function CellComponent({
  idx,
  rowIdx,
  children,
  hexBlockStyle,
  hexCenterStyle,
  hexCenterLockStyle,
  hexCenterLockBlockStyle,
  onClick,
  status,
  nodeData,
}: {
  idx: number;
  hexCenterLockBlockStyle: any;

  rowIdx: number;
  children?: React.ReactNode;
  hexCenterStyle: any;
  hexCenterLockStyle: any;
  hexBlockStyle: any;
  onClick: React.MouseEventHandler;
  status: NodeAllocatedStatus;
  nodeData: NodeReactData;
}) {
  const leftLock = { ...hexCenterLockBlockStyle };
  const rightLock = { ...hexCenterLockBlockStyle };

  const isLocked = !!nodeData.lockData;
  const fillColor =
    status === NodeAllocatedStatus.TAKEN
      ? colorToCss(COLORS.grayBlack)
      : colorToCss(COLORS.nodePink);
  const borderColor =
    status === NodeAllocatedStatus.TAKEN ||
    status === NodeAllocatedStatus.UNREACHABLE
      ? colorToCss(COLORS.borderBlack)
      : colorToCss(COLORS.borderWhite);
  const lockBorderColor = isLocked
    ? colorToCss(COLORS.borderBlack)
    : borderColor;

  return (
    <div
      id={`hex-block-${rowIdx}-${idx}`}
      className="hex-block"
      style={hexBlockStyle}
    >
      <div
        id={`hex-center-${rowIdx}-${idx}`}
        onClick={onClick}
        className="hex-center"
        style={{
          ...hexCenterStyle,
          backgroundColor: fillColor,
          borderColor: borderColor,
        }}
        hidden={status === NodeAllocatedStatus.HIDDEN}
      >
        <div
          className="hex-center-text-wrapper"
          style={{
            display: 'flex',
            width: hexCenterStyle.width,
            height: hexCenterStyle.height,
            alignItems: 'center',
            justifyContent: 'center',
            // otherwise the border width screws up centering here
            marginTop: '-2px',
            marginLeft: '-2px',
          }}
        >
          <div className="tiny-text">{nodeData.shortText}</div>
        </div>
      </div>
      {isLocked ? (
        <div
          id={`hex-lock-${rowIdx}-${idx}`}
          hidden={status === NodeAllocatedStatus.HIDDEN}
          style={{
            ...hexCenterLockStyle,
          }}
        >
          <div
            className="hex-center-lock-left"
            style={{
              ...leftLock,
              backgroundColor: colorToCss(COLORS.nodePink),
              borderColor: lockBorderColor,
            }}
          >
            <div className="tiny-text">
              {nodeData.lockData?.shortTextTarget}
            </div>
          </div>
          <div
            className="hex-center-lock-right"
            style={{
              ...rightLock,
              backgroundColor: colorToCss(COLORS.nodePink),
              borderColor: lockBorderColor,
            }}
          >
            <div className="tiny-text">{nodeData.lockData?.shortTextTimer}</div>
          </div>
        </div>
      ) : null}
      <div className="empty-positioned">
        <div
          className="hover-only-2"
          style={{
            position: 'absolute',
          }}
        >
          <div className="question">?</div>
        </div>
      </div>
      <div className="empty-positioned">
        <div className="hover-only node-tooltip">{nodeData.toolTipText}</div>
      </div>
    </div>
  );
}

const Node = React.memo(NodeComponent);
function NodeComponent({
  idx,
  rowIdx,
  hexBlockStyle,
  hexCenterStyle,
  hexCenterLockStyle,
  hexCenterLockBlockStyle,
  status,
  onUpdateStatus,
  nodeData,
}: {
  status: NodeAllocatedStatus;
  idx: number;
  hexCenterLockBlockStyle: any;
  onUpdateStatus: UpdateStatusCb;

  rowIdx: number;
  children?: React.ReactNode;
  hexCenterStyle: any;
  hexCenterLockStyle: any;
  hexBlockStyle: any;
  nodeData: NodeReactData;
}) {
  const handleClick = useCallback(
    (e) => {
      e.preventDefault();
      console.log(`clicked`);
      console.log({ idx, rowIdx, status });
      onUpdateStatus({
        virtualDims: new Vector2(idx, rowIdx),
        newStatus: NodeAllocatedStatus.TAKEN,
      });
    },
    [onUpdateStatus, status, idx, rowIdx]
  );
  return (
    <Cell
      onClick={handleClick}
      hexBlockStyle={hexBlockStyle}
      idx={idx}
      rowIdx={rowIdx}
      hexCenterStyle={hexCenterStyle}
      hexCenterLockStyle={hexCenterLockStyle}
      hexCenterLockBlockStyle={hexCenterLockBlockStyle}
      status={status}
      nodeData={nodeData}
    ></Cell>
  );
}
