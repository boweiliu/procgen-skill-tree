import './GameAreaCell.css';
import './GameArea.css';

import classnames from 'classnames';
import React, { useCallback } from 'react';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { NodeReactData } from './computeVirtualNodeDataMap';
import { UpdateStatusCb } from './GameAreaGrid';
import { NodeAllocatedStatus } from '../../data/GameState';

/**
 * Smart wrapper for the Cell (rectangular component of a hex grid).
 *
 * Handles sending the click event upstream to cause a status update.
 * @param idx x-coord of this cell in its row of hex cells
 * @param rowIdx y-coord of this row of hex cells
 * @param onUpdateStatus callback for updating the status of this cell
 * @param nodeData react fragments to help render this cell
 * @param isCursored whether or not to display a flashing cursor for this cell
 */
export const GameAreaCell = React.memo(GameAreaCellComponent);
function GameAreaCellComponent({
  idx,
  rowIdx,
  onUpdateStatus,
  nodeData,
  isCursored,
  onUpdateCursored,
}: {
  idx: number;
  onUpdateStatus: UpdateStatusCb;
  rowIdx: number;
  nodeData: NodeReactData;
  isCursored: boolean;
  onUpdateCursored: (v: Vector2 | undefined) => void;
}) {
  // console.log('GameAreaCell rerendered');

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      // console.log(`clicked`);
      // console.log({ idx, rowIdx, status: nodeData.status });
      onUpdateStatus({
        virtualDims: new Vector2(idx, rowIdx),
        newStatus: NodeAllocatedStatus.TAKEN,
      });
    },
    [onUpdateStatus, nodeData.status, idx, rowIdx]
  );

  const handleClickQuestionMark = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onUpdateCursored(isCursored ? undefined : new Vector2(idx, rowIdx));
    },
    [isCursored, onUpdateCursored]
  );

  return (
    <Cell
      onClickCenter={handleClick}
      nodeData={nodeData}
      onClickQuestionMark={handleClickQuestionMark}
      isCursored={isCursored}
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
  onClickCenter,
  onClickQuestionMark,
  nodeData,
  isCursored,
}: {
  onClickCenter: React.MouseEventHandler;
  onClickQuestionMark: React.MouseEventHandler;
  nodeData: NodeReactData;
  isCursored: boolean;
}) {
  const status = nodeData.status;
  const isLocked = !!nodeData.lockData;

  return (
    <div className="hex-block hex-full-block">
      <div
        className={classnames(
          'hex-center',
          status === NodeAllocatedStatus.TAKEN
            ? 'node-allocated'
            : 'node-unallocated',
          status === NodeAllocatedStatus.TAKEN ||
            status === NodeAllocatedStatus.UNREACHABLE
            ? 'border-unimportant'
            : 'border-important'
        )}
        onClick={onClickCenter}
        hidden={status === NodeAllocatedStatus.HIDDEN}
      >
        <div className="hex-center-text-wrapper">
          <div className="tiny-text">{nodeData.shortText}</div>
        </div>
      </div>
      {isLocked ? (
        <div
          className="hex-center-lock"
          hidden={status === NodeAllocatedStatus.HIDDEN}
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
      <div className="empty-positioned">
        <div className="hover-only-2 absolute-positioned">
          <div
            className="question"
            hidden={status === NodeAllocatedStatus.HIDDEN}
            onClick={onClickQuestionMark}
          >
            ?
          </div>
        </div>
      </div>
      <div className="empty-positioned node-tooltip-wrapper">
        <div className="hover-only absolute-positioned node-tooltip">
          {nodeData.toolTipText}
        </div>
      </div>
      <div className="empty-positioned selection-cursor-wrapper">
        <div
          className="absolute-positioned selection-cursor"
          hidden={!isCursored}
        ></div>
      </div>
    </div>
  );
}
