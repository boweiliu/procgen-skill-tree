import './GameAreaCell.css';
import './GameArea.css';

import classnames from 'classnames';
import React, { useCallback, useState } from 'react';
import { NodeReactData } from './computeVirtualNodeDataMap';
import { NodeAllocatedStatus, NodeTakenStatus } from '../../data/NodeStatus';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { AllocateNodeResult } from '../../game/actions/AllocateNode';
import { EraType } from '../../data/PlayerSaveState';

/**
 * Smart wrapper for the Cell (rectangular component of a hex grid).
 *
 * Handles sending the click event upstream to cause a status update.
 * @param idx x-coord of this cell in its row of hex cells
 * @param rowIdx y-coord of this row of hex cells
 * @param onUpdateStatus callback for updating the status of this cell
 * @param nodeData react fragments to help render this cell
 * @param isCursored whether or not to display a flashing cursor for this cell
 * @param onUpdateCursored callback, should be called with the cell virtual position to select that cell, or undefined to unselect the currently selected cell
 */
export const GameAreaCell = React.memo(GameAreaCellComponent);
function GameAreaCellComponent({
  id,
  currentEra,
  onUpdateStatus,
  nodeData,
  isCursored,
  onUpdateCursored,
  debugIsCursored,
  isNodeInHoverPath,
  setHoverPathTarget,
}: {
  id: string;
  currentEra: EraType;
  onUpdateStatus: (args: {
    nodeLocation: Vector3;
    newStatus: NodeTakenStatus;
    action: 'allocate' | 'deallocate' | 'allocate-path';
  }) => AllocateNodeResult;
  nodeData: NodeReactData;
  isCursored: boolean;
  onUpdateCursored: (v: Vector3 | null) => void;
  debugIsCursored: boolean;
  isNodeInHoverPath: boolean;
  setHoverPathTarget: (v: Vector3 | null) => void;
}) {
  // const startTime = +new Date();
  // console.log(`GameAreaCell key ${id} rerendered at ${startTime}`);
  const { nodeLocation } = nodeData;

  const handleClick = useCallback(
    (
      e: React.MouseEvent,
      action?: 'allocate' | 'deallocate' | 'allocate-path'
    ) => {
      // TODO(bowei): debounce this so double-clicks dont double trigger this
      // if (e.shiftKey) {
      //   console.log('click with shift', { e });
      // }

      e.stopPropagation();
      e.preventDefault();

      if (action === 'deallocate' || e.button === 2) {
        const updateStatusResult = onUpdateStatus({
          nodeLocation,
          newStatus: { taken: true },
          action: 'deallocate',
        });
        if (!updateStatusResult) {
          onUpdateCursored(isCursored ? null : nodeLocation);
        }
      } else {
        // let action = e.shiftKey ? 'allocate-path' : 'allocate';
        // console.log(`clicked`);
        // console.log({ idx, rowIdx, status: nodeData.status });
        const updateStatusResult = onUpdateStatus({
          nodeLocation,
          newStatus: { taken: true },
          action: e.shiftKey ? 'allocate-path' : 'allocate',
        });
        if (!updateStatusResult) {
          onUpdateCursored(isCursored ? null : nodeLocation);
        }
      }
    },
    [onUpdateStatus, nodeLocation, isCursored, onUpdateCursored]
  );

  const handleClickQuestionMark = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      // TODO(bowei): use nodeData.id here instead of (idx, rowIdx), so that onUpdateStatus callback doesn't ever have to be recreated in the parent statemanager
      onUpdateCursored(isCursored ? null : nodeLocation);
    },
    [isCursored, onUpdateCursored, nodeLocation]
  );

  const setNodeHoverPathTarget = useCallback(
    (nowIsHovered: boolean) => {
      if (nowIsHovered) {
        setHoverPathTarget(nodeLocation);
      } else {
        setHoverPathTarget(null);
      }
    },
    [setHoverPathTarget, nodeLocation]
  );

  return (
    <Cell
      key={id}
      currentEra={currentEra}
      id={id}
      onClickCenter={handleClick}
      nodeData={nodeData}
      onClickQuestionMark={handleClickQuestionMark}
      isCursored={isCursored}
      isNodeInHoverPath={isNodeInHoverPath}
      setNodeHoverPathTarget={setNodeHoverPathTarget}
      // debugIsCursored={debugIsCursored}
    ></Cell>
  );
}

/**
 * Renderes a single rectangular component of a hex grid.
 * Contains a central node, hover-over tooltips attached to the node, and optionally 2 rectangular text boxes
 * that represent the locked state.
 *
 * @param onClickCenter callback to fire when the node itself (as opposed to the region around it) is clicked.
 * @param onClickQuestionMark callback to fire when the question mark tooltip icon is clicked.
 */
const Cell = React.memo(CellComponent);
function CellComponent({
  id,
  currentEra,
  onClickCenter,
  onClickQuestionMark,
  nodeData,
  isCursored,
  debugIsCursored,
  setNodeHoverPathTarget,
  isNodeInHoverPath,
}: {
  id: string;
  currentEra: EraType;
  onClickCenter: (
    e: React.MouseEvent,
    action?: 'allocate' | 'deallocate' | 'allocate-path'
  ) => void;
  onClickQuestionMark: React.MouseEventHandler;
  nodeData: NodeReactData;
  isCursored: boolean;
  debugIsCursored?: boolean;
  setNodeHoverPathTarget: (isHovered: boolean) => void;
  isNodeInHoverPath: boolean;
}) {
  // const startTime = +new Date();
  // console.log(`GameAreaCellComponent key: ${id} rerendered at ${startTime}`);

  const status = nodeData.status;
  const isLocked = !!nodeData.lockData;
  const accessibleButHidden =
    currentEra.type === 'A' &&
    nodeData.statuses.accessibleStatus.accessible &&
    nodeData.statuses.fogOfWarStatus === 'hinted';
  const completelyHidden =
    status === NodeAllocatedStatus.HIDDEN && !accessibleButHidden;

  const [hovered, setHovered] = useState<'no' | 'yes' | 'pending'>('no');

  const onHover = (e: React.PointerEvent) => {
    // console.log(`got pointer enter on ${id}`);

    // delayed set hover path state; since the computation slows down scrolling
    setHovered('pending');
    const timer = setTimeout(() => {
      setHovered((prev) => {
        if (prev === 'pending') {
          // TODO(bowei): remove the delay if shift is pressed down or we know we're not scrolling actively
          setNodeHoverPathTarget(true);
          return 'yes';
        } else {
          return prev;
        }
      });
    }, 100);

    // setNodeHoverPathTarget(true);

    return () => clearTimeout(timer);
  };
  const onUnhover = (e: React.PointerEvent) => {
    // console.log(`got pointer leave on ${id}`);
    setHovered('no');

    setNodeHoverPathTarget(false);
  };

  const onRightClick = useCallback(
    (e: React.MouseEvent) => onClickCenter(e, 'deallocate'),
    [onClickCenter]
  );

  return (
    <div className="hex-block hex-full-block" key={id} id={id}>
      <div
        className={classnames(
          'hex-center',
          status === NodeAllocatedStatus.TAKEN_OR_MARKED
            ? 'node-allocated'
            : 'node-unallocated',
          status === NodeAllocatedStatus.AVAILABLE && currentEra.type === 'B'
            ? ['border-important', 'node-available']
            : 'border-unimportant',
          isNodeInHoverPath
            ? ['border-hoverpathed', 'node-available']
            : 'border-unimportant',
          nodeData.statuses.bookmarkedStatus.bookmarked ? 'marked-square' : '',
          accessibleButHidden
            ? 'hex-center-size-small'
            : 'hex-center-size-medium'
        )}
        onClick={onClickCenter}
        onContextMenu={onRightClick}
        onDoubleClick={() => {
          console.log('double clicked');
        }}
        onPointerEnter={onHover}
        onPointerLeave={onUnhover}
        hidden={completelyHidden}
      >
        <div
          className={classnames(
            'hex-center-text-wrapper',
            accessibleButHidden
              ? 'hex-center-size-small'
              : 'hex-center-size-medium'
          )}
        >
          <div className="tiny-text" hidden={accessibleButHidden}>
            {nodeData.shortText}
          </div>
        </div>
      </div>
      {isLocked ? (
        <div
          className="hex-center-lock"
          hidden={status === NodeAllocatedStatus.HIDDEN}
          onClick={onClickCenter}
          onContextMenu={onRightClick}
          onDoubleClick={() => {
            console.log('double clicked');
          }}
          onPointerEnter={onHover}
          onPointerLeave={onUnhover}
        >
          <div className="hex-center-lock-left">
            <div className="tiny-text">
              {nodeData.lockData?.shortTextTarget}
            </div>
          </div>
          <div className="hex-center-lock-right">
            <div className="tiny-text">{nodeData.lockData?.shortTextTimer}</div>
          </div>
        </div>
      ) : null}
      <div className="empty-positioned node-tooltip-wrapper">
        <div
          // className="hover-only absolute-positioned node-tooltip" // temp disabling this, the css is causing perf issues
          className="absolute-positioned node-tooltip"
          hidden={hovered !== 'yes'}
        >
          {nodeData.toolTipText}
        </div>
      </div>
      <div className="empty-positioned">
        <div className="hover-only-2 absolute-positioned">
          <div
            className="question"
            hidden={completelyHidden}
            onClick={onClickQuestionMark}
          >
            ?
          </div>
        </div>
      </div>
      <div className="empty-positioned selection-cursor-wrapper">
        <div
          className="absolute-positioned selection-cursor"
          // hidden={!debugIsCursored}
          hidden={!isCursored}
        ></div>
      </div>
    </div>
  );
}
