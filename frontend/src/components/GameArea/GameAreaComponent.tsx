import './GameAreaComponent.css';

import classnames from 'classnames';
import React, { useCallback, useEffect, useRef } from 'react';
import { KeyedHashMap } from '../../lib/util/data_structures/hash';
import { Vector2 } from '../../lib/util/geometry/vector2';
import COLORS, { colorToCss } from '../../pixi/colors';

/**
 *
 *
 */
export const GameAreaComponent = React.memo(GameArea);

export enum NodeAllocatedStatus {
  TAKEN = 'TAKEN',
  HIDDEN = 'HIDDEN',
  AVAILABLE = 'AVAILABLE',
  UNREACHABLE = 'UNREACHABLE',
}

export enum LockStatus {
  CLOSED = 'CLOSED',
  TICKING = 'TICKING',
  OPEN = 'OPEN',
}

export type NodeData = {
  shortText: string;
  lockData?: {
    shortTextTarget: string;
    shortTextTimer: string;
    lockStatus: LockStatus;
  };
  toolTipText: string;
  status: NodeAllocatedStatus;
  id: string;
};
type UpdateStatusCb = (args: {
  virtualDims: Vector2;
  newStatus: NodeAllocatedStatus;
}) => void;

function GameArea(props: {
  hidden: boolean;
  appSize: Vector2;
  // virtualSize: Vector2; // in pixels
  virtualGridDims: Vector2; // in grid units. width x height, width is guaranteed to be half-integer value
  // this object reference is guaranteed to be stable unless jump cb is called

  jumpOffset?: Vector2; // if non-null, jump callback was recently requested, and this is the recommended jump offset in grid dims
  virtualGridStatusMap: KeyedHashMap<Vector2, NodeData>;
  // specify virtual coordinates of the node and the new status to cause an update.
  updateNodeStatusCb: UpdateStatusCb;
  onJump: (args: { direction: Vector2 }) => void;
}) {
  useEffect(() => {
    // jumps to a new scroll position based on the newly received Vector2 instance jumpOffset
    const jumpOffset = props.jumpOffset;
    console.log({ receivedJumpOffset: jumpOffset });
    if (!jumpOffset) return;
    const ref = container.current;
    if (!ref) return;
    ref.scrollTo(
      ref.scrollLeft - jumpOffset.x * gridWidth,
      ref.scrollTop - jumpOffset.y * gridHeight
    );
  }, [props.jumpOffset]);
  // Approximations for sqrt(3)/2 == ratio of an equilateral triangle's height to its width:
  // 6/7, 13/15, 26/30, 45/52, 58/67, 84/97, 181/209
  // for divisibility -- recommend 26/30, 52/60, 104/120, 168/194, 180/208, 232/268, 336/388
  const gridWidth = 268;
  const gridHeight = 232;

  const hexCenterRadius = 32;
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
    backgroundColor: colorToCss(COLORS.nodePink),
    // borderColor: colorToCss(COLORS.nodeBorder),
  };

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
      // const scrollRoom = virtualAreaSize.subtract(props.appSize);
      // const scrollMod = scrollRoom.divide(virtualGrids);
      // handle scroll
      let direction = { x: 0, y: 0 };
      const target = e.target! as Element;
      let newScrollTop = target.scrollTop;
      let newScrollLeft = target.scrollLeft;
      if (target.scrollTop < gridHeight) {
        newScrollTop += gridHeight * 2;
        direction.y -= 1;
      }
      if (
        target.scrollTop >
        (props.virtualGridDims.y - 1) * gridHeight - props.appSize.y
      ) {
        newScrollTop -= gridHeight * 2;
        direction.y += 1;
      }
      if (target.scrollLeft < gridWidth * 1.5) {
        newScrollLeft += gridWidth * 2;
        direction.x -= 1;
      }
      if (
        target.scrollLeft >
        (props.virtualGridDims.x - 2) * gridWidth - props.appSize.x
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
        console.log('jump!');
        // target.scrollTo(newScrollLeft, newScrollTop);
        props.onJump({ direction: new Vector2(direction.x, direction.y) });
      }
    },
    [props.appSize.x, props.appSize.y]
  );

  const container = useRef<HTMLDivElement>(null);
  const previousContainer = useRef<HTMLDivElement>(null) as any;
  useEffect(() => {
    if (
      container.current != null &&
      container.current !== previousContainer.current
    ) {
      container.current.scrollTop = (props.virtualGridDims.y * gridHeight) / 3;
      container.current.scrollLeft =
        ((props.virtualGridDims.x + 0.5) * gridWidth) / 3;
    }
    previousContainer.current = container.current;
  }, [container.current]);

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
          console.log(e);
        }}
        onClick={(e: React.MouseEvent) => {
          console.log(e);
        }}
      >
        {Array(props.virtualGridDims.y)
          .fill(0)
          .map((_, y) => (
            <Row key={y} rowIdx={y} hexHalfBlockStyle={hexHalfBlockStyle}>
              {Array(props.virtualGridDims.x)
                .fill(0)
                .map((_, x) => {
                  const node = props.virtualGridStatusMap.get(
                    new Vector2(x, y)
                  )!;
                  return (
                    <Node
                      key={node?.id}
                      node={node}
                      status={node.status}
                      text={node.shortText}
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
  text,
}: {
  idx: number;
  hexCenterLockBlockStyle: any;

  rowIdx: number;
  children?: React.ReactNode;
  hexCenterStyle: any;
  hexCenterLockStyle: any;
  hexBlockStyle: any;
  onClick: React.MouseEventHandler;
  text?: string;
  status: NodeAllocatedStatus;
}) {
  const leftLock = { ...hexCenterLockBlockStyle };
  const rightLock = { ...hexCenterLockBlockStyle };

  const isLocked = idx === 12 && rowIdx === 4;
  const fillColor =
    status === NodeAllocatedStatus.TAKEN
      ? colorToCss(COLORS.grayBlack)
      : colorToCss(COLORS.nodePink);
  const borderColor =
    status === NodeAllocatedStatus.TAKEN ||
    status === NodeAllocatedStatus.UNREACHABLE
      ? colorToCss(COLORS.borderBlack)
      : colorToCss(COLORS.borderWhite);

  return (
    <div
      onClick={onClick}
      id={`hex-block-${rowIdx}-${idx}`}
      className="hex-block"
      style={hexBlockStyle}
      key={idx}
    >
      <div
        id={`hex-center-${rowIdx}-${idx}`}
        className="hex-center"
        style={{
          ...hexCenterStyle,
          backgroundColor: fillColor,
          borderColor: borderColor,
        }}
        hidden={(status === NodeAllocatedStatus.HIDDEN)}
      >
        <div
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
          <div
            style={{
              // font is 12px x 16px but there's like 2px of "typography space/kern" at the right and top. this fills it in symmetrically on the left and bottom.
              paddingLeft: '2px',
              paddingBottom: '2px',
              maxWidth: '48px',
              overflow: 'hidden',
              cursor: 'default',
            }}
          >
            {text}
          </div>
        </div>
        <div
          className="hover-only"
          style={{
            borderStyle: 'solid',
            marginTop: '-16px',
            marginLeft: '48px',
            minWidth: 'fit-content',
            padding: '3px',
            background: 'rgba(255,255,255,0.3)',
          }}
        >
          {children}
        </div>
      </div>
      {isLocked ? (
        <div
          id={`hex-lock-${rowIdx}-${idx}`}
          style={{
            // zIndex: 3,
            ...hexCenterLockStyle,
          }}
        >
          <div
            className="hex-center-lock-left"
            style={{ ...leftLock, borderColor }}
          />
          <div
            className="hex-center-lock-right"
            style={{ ...rightLock, borderColor }}
          />
        </div>
      ) : null}
    </div>
  );
}

const Node = React.memo(NodeComponent);
function NodeComponent({
  idx,
  rowIdx,
  children,
  hexBlockStyle,
  hexCenterStyle,
  hexCenterLockStyle,
  hexCenterLockBlockStyle,
  node,
  status,
  text,
  onUpdateStatus,
}: {
  node?: NodeData;
  status: NodeAllocatedStatus;
  idx: number;
  hexCenterLockBlockStyle: any;
  onUpdateStatus: UpdateStatusCb;

  rowIdx: number;
  children?: React.ReactNode;
  hexCenterStyle: any;
  hexCenterLockStyle: any;
  hexBlockStyle: any;
  text?: string;
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
      key={idx}
      hexBlockStyle={hexBlockStyle}
      idx={idx}
      rowIdx={rowIdx}
      hexCenterStyle={hexCenterStyle}
      hexCenterLockStyle={hexCenterLockStyle}
      hexCenterLockBlockStyle={hexCenterLockBlockStyle}
      text={text}
      status={status}
    >
      {status}
    </Cell>
  );
}
