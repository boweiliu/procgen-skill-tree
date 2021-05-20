import { Vector2 } from '../../lib/util/geometry/vector2';
import React, { useCallback, useEffect, useRef } from 'react';
import COLORS, { colorToCss } from '../../pixi/colors';

import {
  hexGridPx,
  hexCenterRadius,
  borderWidth,
} from './GameAreaStateManager';

export const CssVariablesComponent = React.memo(Component);

function Component(props: { appSize: Vector2; children?: any }) {
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--grid-width',
      ` ${hexGridPx.x}px`
    );
    document.documentElement.style.setProperty(
      '--grid-height',
      ` ${hexGridPx.y}px`
    );
    document.documentElement.style.setProperty(
      '--hex-center-radius',
      ` ${hexCenterRadius}px`
    );
    document.documentElement.style.setProperty(
      '--border-width',
      ` ${borderWidth}px`
    );
  }, [hexGridPx, hexCenterRadius, borderWidth]);
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--background-black',
      colorToCss(COLORS.backgroundBlue)
    );
    document.documentElement.style.setProperty(
      '--deemphasized-black',
      colorToCss(COLORS.grayBlack)
    );
    document.documentElement.style.setProperty(
      '--active-purple',
      colorToCss(COLORS.nodePink)
    );
    document.documentElement.style.setProperty(
      '--border-unimportant-black',
      colorToCss(COLORS.borderBlack)
    );
    document.documentElement.style.setProperty(
      '--border-important-white',
      colorToCss(COLORS.borderWhite)
    );
    document.documentElement.style.setProperty(
      '--text-readable-white',
      colorToCss(COLORS.textWhite)
    );
  }, [COLORS]);
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--app-size-width',
      ` ${props.appSize.x}px`
    );
    document.documentElement.style.setProperty(
      '--app-size-height',
      ` ${props.appSize.y}px`
    );
  }, [props.appSize]);

  return <>{props.children}</>;
}
