import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { updateRestTypeNode } from 'typescript';
import { GameState, appSizeFromWindowSize } from '../../data/GameState';
import { getCoordNeighbors, getWithinDistance } from '../../game/HexGrid';
import { HashMap, KeyedHashMap } from '../../lib/util/data_structures/hash';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import COLORS, { colorToCss } from '../../pixi/colors';
import {
  GameAreaComponent,
  NodeAllocatedStatus,
  NodeData,
} from './GameAreaComponent';

export const GameAreaStateManager = React.memo(Component);

/**
 * Approximations for sqrt(3)/2 == ratio of an equilateral triangle's height to its width:
 * 6/7, 13/15, 26/30, 45/52, 58/67, 84/97, 181/209
 * for divisibility -- recommend 26/30, 52/60, 104/120, 168/194, 180/208, 232/268, 336/388
 */
export const hexGridPx = new Vector2(268, 232);

/**
 * How much bigger the "virtual" (i.e. scrollable) game area is than the visible window.
 * Bigger == more elements rendered which are outside the viewport == worse performance,
 * but need to 'jump' the scroll viewport less often.
 * Recommended default is 3.0
 */
export const virtualAreaScaleMultiplier = 3.0;

function Component(props: {
  gameState: GameState;
  updaters: UpdaterGeneratorType2<GameState, GameState>;
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
  const virtualGridDims = useMemo(
    () =>
      new Vector2(
        Math.floor(
          (appSize.x * virtualAreaScaleMultiplier) / hexGridPx.x - 0.5
        ),
        Math.floor((appSize.y * virtualAreaScaleMultiplier) / hexGridPx.y)
      ),
    [appSize, virtualAreaScaleMultiplier, hexGridPx]
  );
  // useEffect(() => console.log({ virtualGridDims }), [virtualGridDims]);

  const virtualDimsToLocation = useCallback(
    (virtualDims: Vector2): Vector3 => {
      const virtualCenter = virtualGridDims.divide(2).floor();
      const offsetFromVirtualCenter = virtualDims.subtract(virtualCenter);
      let relativeLocation = new Vector2(0, 0);
      // TODO(bowei):
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
  // ,
  //   [gameState.playerUI.virtualGridLocation, virtualGridDims]
  // );

  const locationToVirtualDims = useCallback(
    (location: Vector3): Vector2 | undefined => {
      return undefined;
    },
    [gameState.playerUI.virtualGridLocation, virtualGridDims]
  );

  const virtualGridStatusMap: KeyedHashMap<Vector2, NodeData> = useMemo(() => {
    const map = new KeyedHashMap<Vector2, NodeData>();
    for (let row = 0; row < virtualGridDims.x; row++) {
      for (let col = 0; col < virtualGridDims.y; col++) {
        const virtualVec = new Vector2(row, col);
        const location = virtualDimsToLocation(virtualVec);
        const maybeStatus = gameState.playerSave.allocationStatusMap.get(
          location
        );
        const nodeStatus = maybeStatus || NodeAllocatedStatus.HIDDEN;
        const id = location.hash();
        const nodeData: NodeData = {
          shortText: id,
          toolTipText: nodeStatus.toString(),
          status: nodeStatus,
          id,
        };
        map.put(virtualVec, nodeData);
      }
    }
    // console.log({ map });
    return map;
  }, [
    gameState.playerSave.allocationStatusMap,
    virtualGridDims,
    virtualDimsToLocation,
  ]);

  const handleJump = useCallback(
    (args: { direction: Vector2 }) => {
      // direction: if we hit bottom right of screen, direction == (1,1)
      console.log({ direction: args.direction });
      let jumpAmounts = virtualGridDims.multiply(0.45).floor();
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
        gameState.playerSave.allocationStatusMap.get(nodeLocation) ||
        NodeAllocatedStatus.HIDDEN;
      if (
        newStatus === NodeAllocatedStatus.TAKEN &&
        prevStatus !== NodeAllocatedStatus.AVAILABLE
      ) {
        console.log('cant do that', prevStatus);
        return;
      }
      return props.updaters.playerSave.allocationStatusMap.enqueueUpdate(
        (prevMap, prevGameState) => {
          prevMap.put(nodeLocation, newStatus);
          if (newStatus === NodeAllocatedStatus.TAKEN) {
            getWithinDistance(nodeLocation, 1).forEach((n) => {
              if (prevMap.get(n) === NodeAllocatedStatus.UNREACHABLE) {
                prevMap.put(n, NodeAllocatedStatus.AVAILABLE);
              }
            });
            getWithinDistance(nodeLocation, 3).forEach((n) => {
              if (
                (prevMap.get(n) || NodeAllocatedStatus.HIDDEN) ===
                NodeAllocatedStatus.HIDDEN
              ) {
                // NOTE(bowei): fuck, this doesnt cause a update to be propagated... i guess it's fine though
                prevGameState.worldGen.lockMap.precompute(n);
                prevMap.put(n, NodeAllocatedStatus.UNREACHABLE);
              }
            });
          }
          // console.log({ it });
          return prevMap.clone();
        }
      );
    },
    [
      props.updaters,
      virtualDimsToLocation,
      gameState.playerSave.allocationStatusMap,
    ]
  );

  return (
    <>
      <GameAreaComponent
        hidden={!gameState.playerUI.isPixiHidden}
        appSize={appSize}
        virtualGridDims={virtualGridDims}
        jumpOffset={jumpOffset}
        virtualGridStatusMap={virtualGridStatusMap}
        updateNodeStatusCb={handleUpdateNodeStatus}
        onJump={handleJump}
      />
      {props.children}
    </>
  );
}
