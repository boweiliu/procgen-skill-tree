import { Vector2 } from '../../lib/util/geometry/vector2';
import React, { useEffect } from 'react';
import { colorToCss } from '../../pixi/colors';

export const CssVariablesComponent = React.memo(Component);

/**
 * Handles loading display settings from props into css variables.
 * component is empty in the DOM - can be embedded anywhere in react hierarchy
 */
function Component(props: {
  appSize: Vector2;
  hexGridPx: Vector2;
  borderWidth: number;
  hexCenterRadius: number;
  COLORS: any;
  children?: any;
}) {
  const { hexGridPx, borderWidth, hexCenterRadius, appSize, COLORS } = props;
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
