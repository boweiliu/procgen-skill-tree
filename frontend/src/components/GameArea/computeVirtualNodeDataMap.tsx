import React, { useCallback, useMemo, useState } from 'react';
import { LockData } from '../../data/PlayerSaveState';
import { NodeContents } from '../../game/worldGen/nodeContents/NodeContentsFactory';
import {
  AttributeSymbolMap,
  nodeContentsConditionToString,
  nodeContentsLineToString,
} from '../../game/worldGen/nodeContents/NodeContentsRendering';
import { HashMap, KeyedHashMap } from '../../lib/util/data_structures/hash';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { LazyHashMap } from '../../lib/util/lazy';
import { NodeAllocatedStatus } from './GameAreaComponent';
import { NodeReactData } from './GameAreaStateManager';

export function computeVirtualNodeDataMap(args: {
  allocationStatusMap: KeyedHashMap<Vector3, NodeAllocatedStatus>;
  nodeContentsMap: LazyHashMap<Vector3, NodeContents>;
  lockMap: LazyHashMap<Vector3, LockData | undefined>;
  fogOfWarStatusMap: HashMap<Vector3, NodeAllocatedStatus> | undefined;
  virtualGridDims: Vector2;
  virtualDimsToLocation: (v: Vector2) => Vector3;
}): KeyedHashMap<Vector2, NodeReactData> {
  const {
    allocationStatusMap,
    nodeContentsMap,
    lockMap,
    fogOfWarStatusMap,
    virtualGridDims,
    virtualDimsToLocation,
  } = args;
  const startTime = +new Date();
  const map = new KeyedHashMap<Vector2, NodeReactData>();
  for (let row = 0; row < virtualGridDims.x; row++) {
    for (let col = 0; col < virtualGridDims.y; col++) {
      const virtualVec = new Vector2(row, col);
      const location = virtualDimsToLocation(virtualVec);
      const maybeStatus = fogOfWarStatusMap?.get(location);
      const takenStatus = allocationStatusMap.get(location);
      const nodeStatus =
        takenStatus === NodeAllocatedStatus.TAKEN
          ? NodeAllocatedStatus.TAKEN
          : maybeStatus || NodeAllocatedStatus.HIDDEN;
      const id = location.hash();
      const lockData = lockMap.get(location);
      const nodeContents = nodeContentsMap.get(location);
      let shortText1 = '+';
      if (nodeContents.lines[0]) {
        // the origin node is empty
        shortText1 += AttributeSymbolMap[nodeContents.lines[0].attribute];
      } else {
        shortText1 = '';
      }
      if (
        nodeContents.lines[1] &&
        nodeContents.lines[0].attribute !== nodeContents.lines[1].attribute
      ) {
        // add another symbol if it's a mixed node
        shortText1 += AttributeSymbolMap[nodeContents.lines[1].attribute];
      }
      let shortText2 = '';
      if (nodeContents.condition) {
        shortText2 = '-' + AttributeSymbolMap[nodeContents.condition.attribute];
      }

      const nodeData: NodeReactData = {
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