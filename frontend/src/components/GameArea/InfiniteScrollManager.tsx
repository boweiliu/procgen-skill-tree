import './GameAreaGrid.css';
import './GameArea.css';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import { GameState } from '../../data/GameState';

const SCROLL_INTERVAL_MS = 8; // polling interval - how often to check keyboard scroll state. recommended 60 FPS == 16ms or faster.
const SCROLL_VELOCITY = 0.75; // pixels per ms. independent of interval_ms tick rate

type Props = {
  hidden: boolean;
  appSize: Vector2;
  hexGridPx: Vector2; // the size of a single grid unit, in px
  virtualGridDims: Vector2; // in grid units. width x height, guaranteed to be integers
  children?: any;
  debug?: any;

  updaters: UpdaterGeneratorType2<GameState, GameState>; // TODO(bowei): remove this
  keyboardScrollDirection: Vector2;
};

export const InfiniteScrollManager = React.memo(Component);
/**
 * Manages the scroll state.
 * @param hidden true to disappear this entire component and all its children.
 * @param appSize size of the scrollable viewport
 * @param hexGridPx size of a single grid unit, in px. needs to be a good ratio if we want an actual hex grid
 * @param virtualGridDims integer vector for # of grid cells in each dimension
 * @param children any react subcomponents. Note that updating children causes this component to update as well - react memo is sensitive to it
 * @param debug TODO(bowei): contains triggers (extracted out of gameState.playerUI) for debugging the scroll jump and the virtual position rerender, SEPARATELY
 * @param keyboardScrollDirection unit-ish vector indicating player using keyboard controls to scroll (we disabled native browser keyboard scrolling)
 */
function Component(props: Props) {
  const {
    hexGridPx,
    virtualGridDims,
    appSize,
    updaters,
    keyboardScrollDirection,
    debug,
  } = props;
  // console.log('infinite scroll manager rerender');

  const container = useRef<HTMLDivElement>(null);
  const previousContainer = useRef<HTMLDivElement>(null) as any;

  const [jumpOffset, setJumpOffset] = useState(new Vector2(0, 0));

  // Set initial position in the center, exactly once!
  useEffect(() => {
    if (
      container.current != null &&
      container.current !== previousContainer.current
    ) {
      // TODO(bowei): figure out where the actual center is, so we can center the screen on the starting node perfectly
      container.current.scrollTop =
        (virtualGridDims.y * hexGridPx.y - appSize.y) / 2;
      container.current.scrollLeft =
        ((virtualGridDims.x + 0.5) * hexGridPx.x - appSize.x) / 2;
    }
    previousContainer.current = container.current;
  }, [appSize, virtualGridDims, hexGridPx]);

  // Uses offset to jump to a new scroll position, exactly once
  useEffect(() => {
    if (!jumpOffset) return;
    const ref = container.current;
    if (!ref) return;
    ref.scrollTo(
      ref.scrollLeft - jumpOffset.x * hexGridPx.x,
      ref.scrollTop - jumpOffset.y * hexGridPx.y
    );
  }, [jumpOffset, hexGridPx]);

  // when we trigger a scroll jump, compute where we jump to, and don't forget to update the virtual grid location
  const handleJump = useCallback(
    (args: { direction: Vector2 }) => {
      // // direction: if we hit bottom right of screen, direction == (1,1)
      // // console.log({ direction: args.direction });
      // // let jumpAmounts = virtualGridDims.multiply(0.35).floor();
      // let jumpAmounts = virtualGridDims.multiply(0.05).floor();
      // // jumpAmounts = jumpAmounts.withY(Math.floor(jumpAmounts.y / 2) * 2);
      // jumpAmounts = jumpAmounts
      //   .clampX(1, virtualGridDims.x - 1)
      //   .clampY(1, virtualGridDims.y - 1);
      // // .clampY(2, Math.floor((virtualGridDims.y - 1) / 2) * 2);

      // let newJumpOffset = jumpAmounts.multiply(args.direction); // multiply the magnitudes by unit-ish direction vector
      let locationOffset = new Vector2(args.direction.x, -1 * args.direction.y); // biased
      if (args.direction.x === args.direction.y) {
        locationOffset = new Vector2(0, -1 * args.direction.y);
      }

      const newJumpOffset = new Vector2(locationOffset.x, 0).add(
        new Vector2(-0.5, -1).multiply(locationOffset.y)
      );

      // console.log({ newJumpOffset });

      updaters.playerUI.virtualGridLocation.enqueueUpdate((it) => {
        return it.add(Vector3.FromVector2(locationOffset, 0));
      });
      // force a rerender
      setJumpOffset(newJumpOffset);
    },
    [updaters]
  );

  const getForceJumpOffset = debug.getForceJumpOffset;
  useEffect(() => {
    const newJumpOffset = getForceJumpOffset?.();
    if (newJumpOffset) {
      updaters.playerUI.virtualGridLocation.enqueueUpdate((it) => {
        return it
          .addX(newJumpOffset.x)
          .add(new Vector3(-1, -2, 0).multiply(newJumpOffset.y / 2));
      });
    }
  }, [updaters, getForceJumpOffset]);

  // Detect if the user has scrolled to the edge of the screen, and if so trigger a scroll jump
  const enableScrollJump = debug.enableScrollJump;
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
      // console.log("NOW IN handlescroll");

      // fast exit if debug
      if (!enableScrollJump) {
        // console.log("skipped scroll trigger due to debug", { debug });
        return;
      }

      // handle scroll
      let direction = { x: 0, y: 0 };
      const target = e.target! as Element;
      let newScrollTop = target.scrollTop; // only used as boolean to see if it changed
      let newScrollLeft = target.scrollLeft;
      if (target.scrollTop < hexGridPx.y * 0.9) {
        // between 0.1 and 0.4 of leeway is recommended. increasing it more helps with lag but also incurs more virtual area cost.
        newScrollTop += hexGridPx.y * 2;
        direction.y -= 1;
      }
      if (
        target.scrollTop >
        (virtualGridDims.y - 0.9) * hexGridPx.y - appSize.y
      ) {
        newScrollTop -= hexGridPx.y * 2;
        direction.y += 1;
      }
      if (target.scrollLeft < hexGridPx.x * 0.9) {
        // between 0.6 and 0.9 of leeway is recommended. increasing it more helps with lag but also incurs more virtual area cost.
        newScrollLeft += hexGridPx.x * 2;
        direction.x -= 1;
      }
      if (
        target.scrollLeft >
        (virtualGridDims.x - 0.9) * hexGridPx.x - appSize.x
      ) {
        newScrollLeft -= hexGridPx.x * 2;
        direction.x += 1;
      }
      // console.log(target);
      // console.log(target.scrollTop);
      // console.log(target.scrollLeft);

      if (
        target.scrollTop !== newScrollTop ||
        target.scrollLeft !== newScrollLeft
      ) {
        // console.log('jump!', +new Date());
        // target.scrollTo(newScrollLeft, newScrollTop);
        handleJump({ direction: new Vector2(direction.x, direction.y) });
      }
    },
    [appSize, handleJump, hexGridPx, virtualGridDims, enableScrollJump]
  );

  // control scroll with keyboard
  useEffect(() => {
    if (!keyboardScrollDirection.equals(Vector2.Zero)) {
      // console.log('nonzero keyboard scroll direction update received');

      let lastTime: number | null = null;
      const action = () => {
        const ref = container.current;
        if (!ref) return;
        let direction = Vector2.Zero;
        if (lastTime === null) {
          direction = keyboardScrollDirection.multiply(SCROLL_INTERVAL_MS); // assume 1 tick
          lastTime = +new Date();
        } else {
          const elapsed = +new Date() - lastTime;
          if (elapsed > 40) {
            console.log('WAS SLOW - ' + elapsed.toString());
          }
          direction = keyboardScrollDirection.multiply(elapsed);
          lastTime = +new Date();
        }
        direction = direction.multiply(SCROLL_VELOCITY);
        ref.scrollTo(
          ref.scrollLeft + direction.x,
          ref.scrollTop - direction.y // scroll is measured from the top left
        );
      };
      const interval = setInterval(action, SCROLL_INTERVAL_MS);
      action();
      return () => clearInterval(interval);
    }
  }, [keyboardScrollDirection]);

  return (
    <div
      ref={container}
      className={classnames({
        'game-area': true,
        'hidden-scrollbars': !(debug?.debugShowScrollbars || false),
      })}
      hidden={props.hidden}
      onScroll={handleScroll}
    >
      <div className="virtual-game-area">{props.children}</div>
    </div>
  );
}
