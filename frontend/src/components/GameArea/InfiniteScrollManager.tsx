import './GameAreaGrid.css';
import './GameArea.css';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';
import { UpdaterGeneratorType2 } from '../../lib/util/updaterGenerator';
import { GameState } from '../../data/GameState';

const SCROLL_INTERVAL_MS = 8; // polling interval - how often to check keyboard scroll state. recommended 60 FPS == 16ms or faster.
const SCROLL_VELOCITY = 0.75; // pixels per ms. independent of interval_ms tick rate

export const InfiniteScrollManager = React.memo(Component);
/**
 * Manages the scroll state.
 * @param hidden
 */
function Component(props: {
  hidden: boolean;
  appSize: Vector2;
  hexGridPx: Vector2; // the size of a single grid unit, in px
  virtualGridDims: Vector2; // in grid units. width x height, guaranteed to be integers
  children?: any;
  debug?: any; // TODO(bowei): contains triggers (extracted out of gameState.playerUI) for debugging the scroll jump and the virtual position rerender, SEPARATELY

  updaters: UpdaterGeneratorType2<GameState, GameState>; // TODO(bowei): remove this
  keyboardScrollDirection: Vector2;
}) {
  const {
    hexGridPx,
    virtualGridDims,
    appSize,
    updaters,
    keyboardScrollDirection,
  } = props;
  console.log('infinite scroll manager rerender');

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
  }, [container.current, appSize]);

  // Uses offset to jump to a new scroll position, exactly once
  useEffect(() => {
    if (!jumpOffset) return;
    const ref = container.current;
    if (!ref) return;
    ref.scrollTo(
      ref.scrollLeft - jumpOffset.x * hexGridPx.x,
      ref.scrollTop - jumpOffset.y * hexGridPx.y
    );
  }, [jumpOffset]);

  const handleJump = useCallback(
    (args: { direction: Vector2 }) => {
      // direction: if we hit bottom right of screen, direction == (1,1)
      // console.log({ direction: args.direction });
      let jumpAmounts = virtualGridDims.multiply(0.35).floor();
      jumpAmounts = jumpAmounts.withY(Math.floor(jumpAmounts.y / 2) * 2);
      jumpAmounts = jumpAmounts
        .clampX(1, virtualGridDims.x - 1)
        .clampY(2, Math.floor((virtualGridDims.y - 1) / 2) * 2);

      const newJumpOffset = jumpAmounts.multiply(args.direction);

      // console.log({ newJumpOffset });

      updaters.playerUI.virtualGridLocation.enqueueUpdate((it) => {
        return it
          .addX(newJumpOffset.x)
          .add(new Vector3(-1, -2, 0).multiply(newJumpOffset.y / 2));
      });
      // force a rerender
      setJumpOffset(newJumpOffset);
    },
    [virtualGridDims, updaters]
  );

  /**
   * Detect if the user has scrolled to the edge of the screen, and if so trigger a scroll jump
   */
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
      // console.log("NOW IN handlescroll");
      // handle scroll
      let direction = { x: 0, y: 0 };
      const target = e.target! as Element;
      let newScrollTop = target.scrollTop; // only used as boolean to see if it changed
      let newScrollLeft = target.scrollLeft;
      if (target.scrollTop < hexGridPx.y * 0.4) {
        // between 0.1 and 0.4 of leeway is recommended. increasing it more helps with lag but also incurs more virtual area cost.
        newScrollTop += hexGridPx.y * 2;
        direction.y -= 1;
      }
      if (
        target.scrollTop >
        (virtualGridDims.y - 0.4) * hexGridPx.y - appSize.y
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
    [appSize.x, appSize.y]
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
  }, [keyboardScrollDirection, container.current]);

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
  return (
    <div
      ref={container}
      // className="game-area hidden-scrollbars"
      className="game-area"
      hidden={props.hidden}
      onScroll={handleScroll}
    >
      <div className="virtual-game-area">{props.children}</div>
    </div>
  );
}
