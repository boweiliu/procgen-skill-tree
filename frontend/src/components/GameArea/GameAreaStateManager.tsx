import React, { useCallback, useMemo, useState } from 'react';
import { GameState, appSizeFromWindowSize } from '../../data/GameState';
import { AllocateNodeAction } from '../../game/actions/AllocateNode';
import {
  AttributeSymbolMap,
  nodeContentsLineToString,
  nodeContentsConditionToString,
} from '../../game/worldGen/nodeContents/NodeContentsRendering';
import { KeyedHashMap } from '../../lib/util/data_structures/hash';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import {
  computeVirtualNodeDataMap,
  NodeReactData,
} from './computeVirtualNodeDataMap';
import {
  GameAreaComponent,
  LockStatus,
  NodeAllocatedStatus,
} from './GameAreaComponent';

/**
 * Approximations for sqrt(3)/2 == ratio of an equilateral triangle's height to its width:
 * 6/7, 13/15, 26/30, 45/52, 58/67, 84/97, 181/209
 * for divisibility -- recommend 26/30, 52/60, 104/120, 168/194, 180/208, 232/268, 336/388
 */
export const hexGridPx = new Vector2(268, 232);

export const hexCenterRadius = 48; // Radius of the circles representing allocatable nodes, in px

/**
 * How much bigger the "virtual" (i.e. scrollable) game area is than the visible window.
 * Bigger == more elements rendered which are outside the viewport == worse performance,
 * but need to 'jump' the scroll viewport less often.
 * Recommended default is 3.0
 */
export const virtualAreaScaleMultiplier = 3.0;

export const GameAreaStateManager = React.memo(Component);
function Component(props: {
  gameState: GameState;
  updaters: UpdaterGeneratorType2<GameState, GameState>;
  actions: { allocateNode: AllocateNodeAction };
  children?: React.ReactNode;
}) {
  const { gameState, children } = props;

  const appSize = useMemo(() => {
    return appSizeFromWindowSize(
      new Vector2(
        gameState.windowState.innerWidth,
        gameState.windowState.innerHeight
      )
    );
  }, [gameState.windowState.innerWidth, gameState.windowState.innerHeight]);

  const [jumpOffset, setJumpOffset] = useState(new Vector2(0, 0));

  const virtualGridDims = useMemo(() => {
    return new Vector2(
      // needs to be at least 3.8 x 4.8 so we have room for jumps
      Math.max(
        4,
        Math.floor((appSize.x * virtualAreaScaleMultiplier) / hexGridPx.x - 0.5)
      ),
      Math.max(
        5,
        Math.floor((appSize.y * virtualAreaScaleMultiplier) / hexGridPx.y)
      )
    );
  }, [appSize, virtualAreaScaleMultiplier, hexGridPx]);

  const virtualDimsToLocation = useCallback(
    (virtualDims: Vector2): Vector3 => {
      const virtualCenter = virtualGridDims.divide(2).floor();
      const offsetFromVirtualCenter = virtualDims.subtract(virtualCenter);
      let relativeLocation = new Vector2(0, 0);

      if (offsetFromVirtualCenter.y % 2 === 0) {
        // calculate the effect of y
        relativeLocation = new Vector2(-1, -2).multiply(
          offsetFromVirtualCenter.y / 2
        );
      } else if (virtualCenter.y % 2 == 0) {
        // half block is not in the center row
        /**
         * 0: O - O - O
         * 1:   O - O - O
         * 2: O - O - O <- virtualCenter.y
         * 3:   O - O - O <- offsetFromVirtualCenter.y == 1
         */
        relativeLocation = new Vector2(0, -1).add(
          new Vector2(-1, -2).multiply((offsetFromVirtualCenter.y - 1) / 2)
        );
      } else {
        // half block is in the center row
        /**
         * 0: O - O - O
         * 1:   O - O - O <- virtualCenter.y
         * 2: O - O - O <- offsetFromVirtualCenter.y == 1
         * 3:   O - O - O
         */
        relativeLocation = new Vector2(-1, -1).add(
          new Vector2(-1, -2).multiply((offsetFromVirtualCenter.y - 1) / 2)
        );
      }
      // now add in the x offset
      relativeLocation = relativeLocation.addX(offsetFromVirtualCenter.x);
      return gameState.playerUI.virtualGridLocation.add(
        Vector3.FromVector2(relativeLocation, 0)
      );
    },
    [gameState.playerUI.virtualGridLocation, virtualGridDims]
  );

  const virtualGridStatusMap = useMemo(
    () =>
      computeVirtualNodeDataMap({
        allocationStatusMap: gameState.playerSave.allocationStatusMap,
        nodeContentsMap: gameState.worldGen.nodeContentsMap,
        lockMap: gameState.worldGen.lockMap,
        fogOfWarStatusMap: gameState.computed.fogOfWarStatusMap,
        virtualGridDims,
        virtualDimsToLocation,
      }),
    [
      gameState.playerSave.allocationStatusMap,
      gameState.worldGen.nodeContentsMap,
      gameState.worldGen.lockMap,
      virtualGridDims,
      virtualDimsToLocation,
    ]
  );

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
    [virtualGridDims]
  );

  const handleUpdateNodeStatus = useCallback(
    (args: { virtualDims: Vector2; newStatus: NodeAllocatedStatus }) => {
      // console.log({ got: 'here' });
      const { virtualDims, newStatus } = args;
      const nodeLocation: Vector3 = virtualDimsToLocation(virtualDims);
      const prevStatus =
        gameState.computed.fogOfWarStatusMap?.get(nodeLocation) ||
        NodeAllocatedStatus.HIDDEN;
      if (newStatus === NodeAllocatedStatus.TAKEN) {
        if (prevStatus !== NodeAllocatedStatus.AVAILABLE) {
          console.log('cant do that', prevStatus);
          return;
        }
        const maybeLock = gameState.worldGen.lockMap.get(nodeLocation);
        if (!!maybeLock) {
          console.log('is locked', maybeLock);
          return;
        }
      }

      props.actions.allocateNode.enqueueAction({
        nodeLocation,
        newStatus: NodeAllocatedStatus.TAKEN,
      });
    },
    [
      props.updaters,
      virtualDimsToLocation,
      gameState.playerSave.allocationStatusMap,
      gameState.computed.fogOfWarStatusMap,
      gameState.computed.lockStatusMap,
      gameState.worldGen.lockMap,
    ]
  );

  return (
    <>
      <GameAreaComponent
        hidden={!gameState.playerUI.isPixiHidden}
        appSize={appSize}
        intent={gameState.intent}
        virtualGridDims={virtualGridDims}
        jumpOffset={jumpOffset}
        virtualGridStatusMap={virtualGridStatusMap}
        virtualDimsToLocation={virtualDimsToLocation}
        updateNodeStatusCb={handleUpdateNodeStatus}
        onJump={handleJump}
      />
      {props.children}
    </>
  );
}
