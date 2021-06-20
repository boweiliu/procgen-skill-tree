/**
 * Multiplies colors (0xFFFFFF === 1). use for applying tints manually.
 * @param color1 A base color
 * @param color2 A tint
 */

export function multiplyColor(color1: number, color2: number): number {
  let reds = [color1 & 0xff0000, color2 & 0xff0000];
  let blues = [color1 & 0x0000ff, color2 & 0x0000ff];
  let greens = [color1 & 0x00ff00, color2 & 0x00ff00];
  let out = Math.round(((reds[0] / 0x010000) * reds[1]) / 0xffffff) * 0x010000;
  out += Math.round(((greens[0] / 0x000100) * greens[1]) / 0x00ff00) * 0x000100;
  out += Math.round((blues[0] * blues[1]) / 0x0000ff);
  return out;
}

export function addColor(color1: number, color2: number): number {
  let reds = [color1 & 0xff0000, color2 & 0xff0000];
  let blues = [color1 & 0x0000ff, color2 & 0x0000ff];
  let greens = [color1 & 0x00ff00, color2 & 0x00ff00];
  let out =
    Math.round(Math.min(reds[0] / 0x010000 + reds[1] / 0x010000, 255)) *
    0x010000;
  out +=
    Math.round(Math.min(greens[0] / 0x000100 + greens[1] / 0x000100, 255)) *
    0x000100;
  out += Math.round(Math.min(blues[0] + blues[1], 255));
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
  let reds = [target & 0xff0000, base & 0xff0000];
  let blues = [target & 0x0000ff, base & 0x0000ff];
  let greens = [target & 0x00ff00, base & 0x00ff00];
  let out =
    Math.round(
      (reds[0] / 0x010000) * proportion +
        (reds[1] / 0x010000) * (1 - proportion)
    ) * 0x010000;
  out +=
    Math.round(
      (greens[0] / 0x000100) * proportion +
        (greens[1] / 0x000100) * (1 - proportion)
    ) * 0x000100;
  out += Math.round(blues[0] * proportion + blues[1] * (1 - proportion));

  return out;
}
