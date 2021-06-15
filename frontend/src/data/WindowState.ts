import { Vector2 } from '../lib/util/geometry/vector2';
import { Const } from '../lib/util/misc';

/**
 * current window settings -- allows for dynamic resizing and also rotation on mobile web
 */
export type WindowState = {
  orientation: 'original' | 'rotated'; // rotated === we are forcing landscape-in-portrait
  innerWidth: number;
  innerHeight: number;
};

export const newWindowState = (): WindowState => {
  return {
    orientation: 'original',
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
  };
};

/**
 * given the dimensions of the entire html window, computes the size of the intended play area -- leaves a 24px border
 * TODO(bowei): move this somewhere more appropriate. for now it's just here because it's used in both pixi and react components
 */
export function appSizeFromWindowSize(window?: Const<Vector2>): Vector2 {
  return new Vector2({
    x: Math.min(1920, (window?.x || Infinity) - 24),
    y: Math.min(1080, (window?.y || Infinity) - 24),
  });
}
