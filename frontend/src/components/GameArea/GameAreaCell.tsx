import './GameAreaCell.css';
import './GameArea.css';

import classnames from 'classnames';
import React, { useCallback, useState } from 'react';
import { NodeReactData } from './computeVirtualNodeDataMap';
import { NodeAllocatedStatus } from '../../data/NodeStatus';
import { Vector3 } from '../../lib/util/geometry/vector3';

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
  onUpdateStatus,
  nodeData,
  isCursored,
  onUpdateCursored,
  debugIsCursored,
}: {
  id: string;
  onUpdateStatus: (args: {
    nodeLocation: Vector3;
    newStatus: NodeAllocatedStatus;
  }) => void;
  nodeData: NodeReactData;
  isCursored: boolean;
  onUpdateCursored: (v: Vector3 | null) => void;
  debugIsCursored: boolean;
}) {
  // const startTime = +new Date();
  // console.log(`GameAreaCell key ${id} rerendered at ${startTime}`);
  const { nodeLocation } = nodeData;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // TODO(bowei): debounce this so double-clicks dont double trigger this

      e.stopPropagation();
      e.preventDefault();
      // console.log(`clicked`);
      // console.log({ idx, rowIdx, status: nodeData.status });
      if (nodeData.status === NodeAllocatedStatus.AVAILABLE) {
        onUpdateStatus({
          nodeLocation,
          newStatus: NodeAllocatedStatus.TAKEN,
        });
      } else {
        onUpdateCursored(isCursored ? null : nodeLocation);
      }
    },
    [onUpdateStatus, nodeLocation, nodeData, isCursored, onUpdateCursored]
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

  return (
    <Cell
      key={id}
      id={id}
      onClickCenter={handleClick}
      nodeData={nodeData}
      onClickQuestionMark={handleClickQuestionMark}
      isCursored={isCursored}
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
  onClickCenter,
  onClickQuestionMark,
  nodeData,
  isCursored,
  debugIsCursored,
}: {
  id: string;
  onClickCenter: React.MouseEventHandler;
  onClickQuestionMark: React.MouseEventHandler;
  nodeData: NodeReactData;
  isCursored: boolean;
  debugIsCursored?: boolean;
}) {
  // const startTime = +new Date();
  // console.log(`GameAreaCellComponent key: ${id} rerendered at ${startTime}`);

  const status = nodeData.status;
  const isLocked = !!nodeData.lockData;

  const [hovered, setHovered] = useState(false);

  const onHover = (e: React.PointerEvent) => {
    console.log(`got pointer enter on ${id}`);
    setHovered(true);
  };
  const onUnhover = (e: React.PointerEvent) => {
    console.log(`got pointer leave on ${id}`);
    setHovered(false);
  };

  return (
    <div className="hex-block hex-full-block" key={id} id={id}>
      <div
        className={classnames(
          'hex-center',
          status === NodeAllocatedStatus.TAKEN
            ? 'node-allocated'
            : 'node-unallocated',
          status === NodeAllocatedStatus.TAKEN ||
            status === NodeAllocatedStatus.UNREACHABLE
            ? 'border-unimportant'
            : 'border-important',
          status === NodeAllocatedStatus.AVAILABLE ? 'node-available' : ''
        )}
        onClick={onClickCenter}
          onDoubleClick={() => { console.log("double clicked")}}
        onPointerEnter={onHover}
        onPointerLeave={onUnhover}
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
          onClick={onClickCenter}
          onDoubleClick={() => { console.log("double clicked")}}
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
          hidden={!hovered}
        >
          {nodeData.toolTipText}
        </div>
      </div>
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
  ></div>
      </div>
    </div>
  );
}
