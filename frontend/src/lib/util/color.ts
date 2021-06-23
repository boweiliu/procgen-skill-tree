const RED_MASK = 0xff0000;
const GREEN_MASK = 0x00ff00;
const BLUE_MASK = 0x0000ff;
const RED_UNIT = 0x010000;
const GREEN_UNIT = 0x000100;
const BLUE_UNIT = 0x000001;
const COLOR_MAX = 255;

/**
 * Multiplies colors (0xFFFFFF === 1). use for applying tints manually.
 * @param color1 A base color
 * @param color2 A tint
 */
export function multiplyColor(color1: number, color2: number): number {
  let reds = [color1 & RED_MASK, color2 & RED_MASK];
  let greens = [color1 & GREEN_MASK, color2 & GREEN_MASK];
  let blues = [color1 & BLUE_MASK, color2 & BLUE_MASK];
  let out = Math.round(((reds[0] / RED_UNIT) * reds[1]) / RED_MASK) * RED_UNIT;
  out +=
    Math.round(((greens[0] / GREEN_UNIT) * greens[1]) / GREEN_MASK) *
    GREEN_UNIT;
  out +=
    Math.round(((blues[0] / BLUE_UNIT) * blues[1]) / BLUE_MASK) * BLUE_UNIT;
  return out;
}

export function addColor(color1: number, color2: number): number {
  let reds = [color1 & RED_MASK, color2 & RED_MASK];
  let greens = [color1 & GREEN_MASK, color2 & GREEN_MASK];
  let blues = [color1 & BLUE_MASK, color2 & BLUE_MASK];
  let out =
    Math.round(Math.min(reds[0] / RED_UNIT + reds[1] / RED_UNIT, COLOR_MAX)) *
    RED_UNIT;
  out +=
    Math.round(
      Math.min(greens[0] / GREEN_UNIT + greens[1] / GREEN_UNIT, COLOR_MAX)
    ) * GREEN_UNIT;
  out +=
    Math.round(
      Math.min(blues[0] / BLUE_UNIT + blues[1] / BLUE_UNIT, COLOR_MAX)
    ) * BLUE_UNIT;
  return out;
}
/**
 *
 * @param args either { target, proportion, base } or { color, opacity, background } or target
 * @param arg2 if args was a single number, this should be opacity
 * @param arg3 if args was a single number, this should be background, or default to 0 (black) background
 */

export function interpolateColor(
  args:
    | { target: number; proportion: number; base?: number }
    | { color: number; opacity: number; background?: number }
    | number,
  arg2?: number,
  arg3?: number
): number {
  if (typeof args === 'object') {
    if (args.hasOwnProperty('target')) {
      let _args: any = args;
      return _interpolateColor(_args);
    } else if (args.hasOwnProperty('color')) {
      let _args: any = args;
      return _interpolateColor({
        target: _args.color,
        proportion: _args.opacity,
        base: _args.background,
      });
    } else {
      throw new Error(`missing parameter in interpolateColor: ${args}`);
    }
  } else {
    if (arg2) {
      return _interpolateColor({ target: args, proportion: arg2, base: arg3 });
    } else {
      throw new Error(
        `missing parameter in interpolateColor: ${args} ${arg2} ${arg3}`
      );
    }
  }
}
function _interpolateColor(args: {
  target: number;
  proportion: number;
  base?: number;
}): number {
  const { target, base = 0, proportion = 1 } = args;
  let reds = [target & RED_MASK, base & RED_MASK];
  let greens = [target & GREEN_MASK, base & GREEN_MASK];
  let blues = [target & BLUE_MASK, base & BLUE_MASK];
  let out =
    Math.round(
      (reds[0] / RED_UNIT) * proportion +
        (reds[1] / RED_UNIT) * (1 - proportion)
    ) * RED_UNIT;
  out +=
    Math.round(
      (greens[0] / GREEN_UNIT) * proportion +
        (greens[1] / GREEN_UNIT) * (1 - proportion)
    ) * GREEN_UNIT;
  out +=
    Math.round(
      (blues[0] / BLUE_UNIT) * proportion +
        (blues[1] / BLUE_UNIT) * (1 - proportion)
    ) * BLUE_UNIT;

  return out;
}

// h in degrees; s, v in [0, 1]
type Hsv = {
  h: number;
  s: number;
  v: number;
};

const SECTOR_DEGREES = 60; // 6 color sectors that total 360 degrees

// source: https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately/54024653#54024653
// and https://stackoverflow.com/questions/8022885/rgb-to-hsv-color-in-javascript
// tested using: https://stackoverflow.com/questions/52193529/is-it-possible-to-import-a-typescript-into-a-running-instance-of-ts-node-repl
export function hexToHsv(color: number): Hsv {
  const [r, g, b] = [
    (color & RED_MASK) / RED_UNIT / COLOR_MAX,
    (color & GREEN_MASK) / GREEN_UNIT / COLOR_MAX,
    (color & BLUE_MASK) / BLUE_UNIT / COLOR_MAX,
  ];
  const v = Math.max(r, g, b);
  const cMin = Math.min(r, g, b);
  const range = v - cMin;
  const hueSector =
    range &&
    (v === r
      ? (g - b) / range
      : v === g
      ? 2 + (b - r) / range
      : 4 + (r - g) / range);
  const h = SECTOR_DEGREES * (hueSector < 0 ? hueSector + 6 : hueSector);
  return {
    h,
    s: v && range / v,
    v,
  };
}

export function hsvToHex(hsv: Hsv): number {
  const [r, g, b] = [
    hsvToHexHelper(5, hsv),
    hsvToHexHelper(3, hsv),
    hsvToHexHelper(1, hsv),
  ];
  return r * RED_UNIT + g * GREEN_UNIT + b * BLUE_UNIT;
}

function hsvToHexHelper(colorDirection: number, hsv: Hsv) {
  const { h, s, v } = hsv;
  const k = (colorDirection + h / SECTOR_DEGREES) % 6;
  const colorPercentUnclamped = Math.min(k, 4 - k);
  const colorPercent = Math.max(0, Math.min(colorPercentUnclamped, 1));
  // console.log({ h, s, v , colorDirection, k, colorPercentUnclamped, colorPercent, })
  return Math.round(v * (1 - s * colorPercent) * COLOR_MAX);
}
