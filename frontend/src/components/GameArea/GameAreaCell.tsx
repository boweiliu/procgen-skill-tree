import './GameAreaCell.css';

import classnames from 'classnames';
import React, { useCallback, useEffect, useRef } from 'react';
import { KeyedHashMap } from '../../lib/util/data_structures/hash';
import { Vector2 } from '../../lib/util/geometry/vector2';
import COLORS, { colorToCss } from '../../pixi/colors';
import { IntentName, PlayerIntentState } from '../../data/GameState';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { NodeReactData } from './computeVirtualNodeDataMap';
import { hexGridPx } from './GameAreaStateManager';
import { UpdateStatusCb, NodeAllocatedStatus } from './GameAreaComponent';

/**
 * Smart wrapper for the Cell (rectangular component of a hex grid).
 *
 * Handles sending the click event upstream to cause a status update.
 */
export const GameAreaCell = React.memo(GameAreaCellComponent);
function GameAreaCellComponent({
  idx,
  rowIdx,
  status,
  onUpdateStatus,
  nodeData,
}: {
  status: NodeAllocatedStatus;
  idx: number;
  onUpdateStatus: UpdateStatusCb;
  rowIdx: number;
  children?: React.ReactNode;
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
    <Cell onClick={handleClick} status={status} nodeData={nodeData}></Cell>
  );
}

/**
 * Renderes a single rectangular component of a hex grid.
 * Contains a central node, hover-over tooltips attached to the node, and optionally 2 rectangular text boxes
 * that represent the locked state.
 */
const Cell = React.memo(CellComponent);
function CellComponent({
  onClick,
  status,
  nodeData,
}: {
  onClick: React.MouseEventHandler;
  status: NodeAllocatedStatus;
  nodeData: NodeReactData;
}) {
  const isLocked = !!nodeData.lockData;

  return (
    <div className="hex-block hex-full-block">
      <div
        onClick={onClick}
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
        <div className="hover-only absolute-positioned">
          <div className="question">?</div>
        </div>
      </div>
      <div className="empty-positioned">
        <div className="hover-only node-tooltip">{nodeData.toolTipText}</div>
      </div>
    </div>
  );
}
