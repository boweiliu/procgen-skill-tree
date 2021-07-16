import './GameAreaGrid.css';
import './GameArea.css';

import React, { useMemo } from 'react';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import {
  computeNodeReactData,
  NodeReactData,
} from './computeVirtualNodeDataMap';
import { GameAreaCell } from './GameAreaCell';
import { NodeTakenStatus } from '../../data/NodeStatus';
import { LazyHashMap } from '../../lib/util/lazy';
import { extractDeps } from '../../lib/util/misc';
import { AllocateNodeResult } from '../../game/actions/AllocateNode';
import { GameState } from '../../data/GameState';
import { HashSet } from '../../lib/util/data_structures/hash';
import { bfsAllPaths } from '../../game/lib/HexGrid';
import { getValidLocks } from '../../game/GameStateFactory';

/**
 * The subset of the game state that is relevant to game area components.
 */
export function extractGameGridSubState(g: GameGridSubState) {
  return _extract(g as GameState);
}

function _extract(gameState: GameState) {
  return {
    playerUI: {
      cursoredNodeLocation: gameState.playerUI.cursoredNodeLocation,
      hoverPathTarget: gameState.playerUI.hoverPathTarget,
    },
    playerSave: {
      allocationStatusMap: gameState.playerSave.allocationStatusMap,
      bookmarkedStatusMap: gameState.playerSave.bookmarkedStatusMap,
      currentEra: gameState.playerSave.currentEra,
    },
    worldGen: {
      nodeContentsMap: gameState.worldGen.nodeContentsMap,
      lockMap: gameState.worldGen.lockMap,
    },
    intent: {
      activeIntent: {
        TEMP_SHOW_PATHS: gameState.intent.activeIntent.TEMP_SHOW_PATHS,
      },
    },
    computed: {
      fogOfWarStatusMap: gameState.computed.fogOfWarStatusMap,
      reachableStatusMap: gameState.computed.reachableStatusMap,
      lockStatusMap: gameState.computed.lockStatusMap,
      accessibleStatusMap: gameState.computed.accessibleStatusMap,
    },
  };
}
export type GameGridSubState = ReturnType<typeof _extract>;
export const depsGameGridSubState = extractDeps(extractGameGridSubState);

export const GameAreaGrid = React.memo(Component);
/**
 * Dumb-ish component that manages the game board where the skill tree is located
 * , as well as the "virtual"
 * game space which is larger than the currently visible scrollable area the player can see.
 *
 * @param virtualGridDims the integer dimensions of the virtual scrollable space, measured in grid units. integer vector.
 * @param virtualCoordsToLocation utility stateless function to convert from ui virtual grid coords (ints) to 3d node location in game state (ints)
 * @param virtualNodeDataMap table of ui grid corods to object containing react fragments for contents of that node
 * @param updateNodeStatusCb callback for when a node is allocated and the node status needs to change. need to provide the virtual grid coords of the node to be allocated, and the new status.
 * @param cursoredVirtualNode 2d virtual dims of the node which is currently cursored (flashing and may show up in sidebar), or undefined if there is none
 * @param setCursoredVirtualNode callback which takes virtual 2d coords and causes that node to now be cursored, or undefined to clear cursor
 */
function Component(props: {
  gameState: GameGridSubState;
  virtualGridDims: Vector2;
  virtualCoordsToLocation: (v: Vector2) => Vector3;
  updateNodeStatusByLocationCb: (args: {
    nodeLocation: Vector3;
    newStatus: NodeTakenStatus;
    action: 'allocate' | 'deallocate';
  }) => AllocateNodeResult;
  cursoredVirtualNode: Vector2 | null;
  setCursoredLocation: (v: Vector3 | null) => void;
  debug?: any;
  setHoverPathTarget: (v: Vector3 | null) => void;
}) {
  const {
    gameState,
    virtualGridDims,
    virtualCoordsToLocation,
    updateNodeStatusByLocationCb,
    cursoredVirtualNode,
    setCursoredLocation,
    debug,
    setHoverPathTarget,
  } = props;
  const startTime = +new Date();

  debug?.rerenderGameAreaGrid();
  // const debugOffsetX = (debug?.getOffsetX?.() || 0) % 8;
  const flipCursored = debug?.isFlipCursored?.() || false;
  // console.log('Game area grid rerender');

  const nodeReactDataMap = useMemo(() => {
    return new LazyHashMap<Vector3, NodeReactData>((location: Vector3) =>
      computeNodeReactData({ location, gameState })
    );
  }, [gameState]);

  const nodesInHoverPathMap = useMemo(() => {
    if (!gameState.intent.activeIntent.TEMP_SHOW_PATHS) {
      return new HashSet<Vector3>();
    }

    // prefer using the hovered path target, otherwise use selected node
    let target = gameState.playerUI.hoverPathTarget;
    if (!target) {
      target = gameState.playerUI.cursoredNodeLocation;
      if (!target) {
        return new HashSet<Vector3>();
      }
    }

    // compute shortest path from node hover/selection to allocated sector (DFS)
    return bfsAllPaths({
      source: target, // BFS backwards for more efficiency
      destinations: new HashSet<Vector3>(
        gameState.playerSave.allocationStatusMap
          .entries()
          .filter(([v, status]) => {
            return status.taken === true;
          })
          .map((it) => it[0])
      ),
      // make sure we make use of lock state
      validLocks: getValidLocks(gameState),
    });
  }, [gameState]);

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
  const result = (
    <>
      {Array(virtualGridDims.y)
        .fill(0)
        .map((_, y) => (
          <Row
            key={virtualCoordsToLocation(new Vector2(0, y)).y.toString()} // important to force react to hang on to the old row
            // key={y} // stupid, for debug
            rowIdx={y}
          >
            {
              Array(virtualGridDims.x)
                .fill(0)
                .map((_, x) => {
                  const virtualCoords = new Vector2(x, y);
                  const location = virtualCoordsToLocation(virtualCoords);
                  const nodeData = nodeReactDataMap.get(location);
                  const isNodeInHoverPath = nodesInHoverPathMap.get(location);
                  let isCursored =
                    !!cursoredVirtualNode &&
                    cursoredVirtualNode.equals(virtualCoords);
                  // if (flipCursored) {
                  //   isCursored = !isCursored;
                  // }
                  const key = nodeData.id || `loading${x}`;
                  // console.log(`key should be ${key} from ${nodeData.toString()}`);
                  return (
                    <GameAreaCell
                      // key={nodeData.id}
                      key={key}
                      id={key}
                      currentEra={gameState.playerSave.currentEra}
                      // key={x.toString() + "," + y.toString()} // stupid debug??
                      // key={x} // debug??
                      nodeData={nodeData}
                      onUpdateStatus={updateNodeStatusByLocationCb}
                      isCursored={isCursored}
                      debugIsCursored={flipCursored ? !isCursored : isCursored}
                      onUpdateCursored={setCursoredLocation}
                      isNodeInHoverPath={isNodeInHoverPath}
                      setHoverPathTarget={setHoverPathTarget}
                    />
                  );
                })
              // .slice(debugOffsetX, virtualGridDims.x - 8 + debugOffsetX)
            }
          </Row>
        ))}
    </>
  );
  const now = +new Date();
  const elapsed = now - startTime;
  console.log(`Game area grid elapsed ${elapsed}ms at ${now}`);
  return result;
}

const Row = React.memo(RowComponent);
function RowComponent({
  rowIdx,
  children,
}: {
  rowIdx: number;
  children?: React.ReactNode;
}) {
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
