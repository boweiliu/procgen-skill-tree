import React from 'react';
import {
  LockStatus,
  NodeAllocatedStatus,
  NodeReachableStatus,
  NodeTakenStatus,
  NodeVisibleStatus,
} from '../../data/GameState';
import { LockData } from '../../data/PlayerSaveState';
import { NodeContents } from '../../game/worldGen/nodeContents/NodeContentsFactory';
import {
  AttributeSymbolMap,
  ModifierSymbolMap,
  nodeContentsConditionToString,
  nodeContentsLineToString,
} from '../../game/worldGen/nodeContents/NodeContentsRendering';
import { HashMap, KeyedHashMap } from '../../lib/util/data_structures/hash';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { LazyHashMap } from '../../lib/util/lazy';
import { GameGridSubState } from './GameAreaGrid';

export type NodeReactData = {
  // 3-4 character description that goes on the main board
  shortText: React.ReactElement;
  // 3-4 line description that gets displayed on hover
  toolTipText: React.ReactElement;
  // Extended description that shows up in sidebar
  fullText: React.ReactElement;
  lockData?: {
    shortTextTarget: string;
    shortTextTimer: string;
    lockStatus: LockStatus;
  };
  status: NodeAllocatedStatus;
  nodeLocation: Vector3;
  id: string;
};

// Text to display both in the tooltip and sidebar for node description.
// Currently we only have a description for the starting node.
export const STARTING_NODE_DESCRIPTION = 'The starting node.';

/**
 * Computes a hash map of vector2 virtual hex grid coordinates to
 * text & tooltip info about the node at those coordinates.
 */
export function computeVirtualNodeDataMap(args: {
  allocationStatusMap: KeyedHashMap<Vector3, NodeTakenStatus>;
  nodeContentsMap: LazyHashMap<Vector3, NodeContents>;
  lockMap: LazyHashMap<Vector3, LockData | undefined>;
  fogOfWarStatusMap: HashMap<Vector3, NodeVisibleStatus> | undefined;
  reachableStatusMap: HashMap<Vector3, NodeReachableStatus> | undefined;
  virtualGridDims: Vector2;
  virtualCoordsToLocation: (v: Vector2) => Vector3;
}): KeyedHashMap<Vector2, NodeReactData> {
  const {
    allocationStatusMap,
    nodeContentsMap,
    lockMap,
    fogOfWarStatusMap,
    reachableStatusMap,
    virtualGridDims,
    virtualCoordsToLocation,
  } = args;
  const startTime = +new Date();
  const map = new KeyedHashMap<Vector2, NodeReactData>();
  for (let row = 0; row < virtualGridDims.x; row++) {
    for (let col = 0; col < virtualGridDims.y; col++) {
      const virtualVec = new Vector2(row, col);
      const location = virtualCoordsToLocation(virtualVec);

      const fogOfWarStatus = fogOfWarStatusMap?.get(location);
      const reachableStatus = reachableStatusMap?.get(location);
      const takenStatus = allocationStatusMap.get(location);
      const nodeStatus = takenStatus?.taken
        ? NodeAllocatedStatus.TAKEN
        : reachableStatus?.reachable
        ? NodeAllocatedStatus.AVAILABLE
        : fogOfWarStatus?.visible
        ? NodeAllocatedStatus.UNREACHABLE
        : NodeAllocatedStatus.HIDDEN;
      const id = location.hash();
      const lockData = lockMap.get(location);
      const nodeContents = nodeContentsMap.get(location);
      let shortText1 = '';
      if (nodeContents.lines[0]) {
        shortText1 += ModifierSymbolMap[nodeContents.lines[0].modifier];
        shortText1 += AttributeSymbolMap[nodeContents.lines[0].attribute];
      } else {
        // the origin node is empty
        shortText1 = '';
      }
      if (
        nodeContents.lines[1] &&
        nodeContents.lines[0].attribute !== nodeContents.lines[1].attribute
      ) {
        // add another symbol if it's a mixed node
        // TODO(bowei): make sure that node contents generation cannot mix modifiers!!
        shortText1 += AttributeSymbolMap[nodeContents.lines[1].attribute];
      }
      let shortText2 = '';
      if (nodeContents.condition) {
        // SPENDing
        shortText2 = '-' + AttributeSymbolMap[nodeContents.condition.attribute];
      }

      const nodeData: NodeReactData = {
        nodeLocation: location,
        shortText: shortText2 ? (
          <>
            {shortText1}
            <br />
            {shortText2}
          </>
        ) : (
          <>{shortText1}</>
        ),
        toolTipText: (
          <>
            <div>{nodeStatus.toString()}</div>
            {location.equals(Vector3.Zero) ? (
              <>
                {' '}
                <br /> <div>{STARTING_NODE_DESCRIPTION}</div>
              </>
            ) : (
              <> </>
            )}
            {nodeContents.lines[0] ? <br /> : <></>}
            <div>
              {nodeContents.lines[0] &&
                nodeContentsLineToString(nodeContents.lines[0])}
            </div>
            <div>
              {nodeContents.lines[1] &&
                nodeContentsLineToString(nodeContents.lines[1])}
            </div>
            <div>
              {nodeContents.condition &&
                nodeContentsConditionToString(nodeContents.condition)}
            </div>
          </>
        ),
        fullText: <> </>,
        status: nodeStatus,
        lockData,
        id,
      };
      map.put(virtualVec, nodeData);
    }
  }
  // console.log({ map });
  const elapsed = +new Date() - startTime;
  if (elapsed > 100) {
    window.alert('compute took ' + elapsed.toString());
  }
  return map;
}

export function computeNodeReactData(args: {
  gameState: GameGridSubState;
  location: Vector3;
}): NodeReactData {
  const { location } = args;
  const {
    fogOfWarStatusMap,
    reachableStatusMap,
    lockStatusMap,
  } = args.gameState.computed;
  const { allocationStatusMap } = args.gameState.playerSave;
  const { lockMap, nodeContentsMap } = args.gameState.worldGen;

  const fogOfWarStatus = fogOfWarStatusMap?.get(location);
  const reachableStatus = reachableStatusMap?.get(location);
  const takenStatus = allocationStatusMap.get(location);
  const nodeStatus = takenStatus?.taken
    ? NodeAllocatedStatus.TAKEN
    : reachableStatus?.reachable
    ? NodeAllocatedStatus.AVAILABLE
    : fogOfWarStatus?.visible
    ? NodeAllocatedStatus.UNREACHABLE
    : NodeAllocatedStatus.HIDDEN;
  const id = location.hash();
  const lockData = lockMap.get(location);
  const nodeContents = nodeContentsMap.get(location);
  let shortText1 = '';
  if (nodeContents.lines[0]) {
    shortText1 += ModifierSymbolMap[nodeContents.lines[0].modifier];
    shortText1 += AttributeSymbolMap[nodeContents.lines[0].attribute];
  } else {
    // the origin node is empty
    shortText1 = '';
  }
  if (
    nodeContents.lines[1] &&
    nodeContents.lines[0].attribute !== nodeContents.lines[1].attribute
  ) {
    // add another symbol if it's a mixed node
    // TODO(bowei): make sure that node contents generation cannot mix modifiers!!
    shortText1 += AttributeSymbolMap[nodeContents.lines[1].attribute];
  }
  let shortText2 = '';
  if (nodeContents.condition) {
    // SPENDing
    shortText2 = '-' + AttributeSymbolMap[nodeContents.condition.attribute];
  }

  const nodeData: NodeReactData = {
    nodeLocation: location,
    shortText: shortText2 ? (
      <>
        {shortText1}
        <br />
        {shortText2}
      </>
    ) : (
      <>{shortText1}</>
    ),
    toolTipText: (
      <>
        <div>{nodeStatus.toString()}</div>
        {location.equals(Vector3.Zero) ? (
          <>
            {' '}
            <br /> <div>{STARTING_NODE_DESCRIPTION}</div>
          </>
        ) : (
          <> </>
        )}
        {nodeContents.lines[0] ? <br /> : <></>}
        <div>
          {nodeContents.lines[0] &&
            nodeContentsLineToString(nodeContents.lines[0])}
        </div>
        <div>
          {nodeContents.lines[1] &&
            nodeContentsLineToString(nodeContents.lines[1])}
        </div>
        <div>
          {nodeContents.condition &&
            nodeContentsConditionToString(nodeContents.condition)}
        </div>
      </>
    ),
    fullText: <> </>,
    status: nodeStatus,
    lockData,
    id,
  };
  return nodeData;
}

export function computeNodeReactDataMap(args: {
  gameState: GameGridSubState;
}): LazyHashMap<Vector3, NodeReactData> {
  const map = new LazyHashMap<Vector3, NodeReactData>((location: Vector3) => {
    return computeNodeReactData({ location, gameState: args.gameState });
  });

  return map;
}
