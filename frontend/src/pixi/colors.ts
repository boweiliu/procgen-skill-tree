const doInvertColors = true;

export const COLORS = Object.fromEntries(
  Object.entries({
    // good colors
    backgroundBlue: 0x222222, // 444444 or 383838 also work
    // nodePink: 0xeeaaaa,
    // nodeLavender: 0xcc88ee,
    // nodeBlue: 0x99bbff,
    // nodeAqua: 0xbbccdd,
    // nodeGrey: 0xddffdd,

    // shitty colors
    // backgroundBlue: 0xffffff,
    // nodePink: 0x332244,
    nodePink: 0x333333, // try this?
    nodeLavender: 0x4b4b4b,
    nodeBlue: 0x444444,

    // used for lock nodes
    nodeAqua: 0xffaaaa,
    // gateTint: 0xaaaaaa,
    gateTint: 0xffffff,

    selectedTint: 0xbbbbff,
    allocatedTint: 0x444444,
    nodeBorder: 0x666666,
    nullTint: 0xffffff,

    // colors that dont matter too much
    tooltipBorderBlack: 0x222222,
    tooltipFillWhite: 0xeeeeee,
    white: 0xffffff,
    grayBlack: 0x1d1d1d,
    borderBlack: 0x111111,
    borderWhite: 0x666666,
    black: 0x000000,
    textWhite: 0x888888,
  }).map(([k, v]) => [k, doInvertColors ? 0xffffff - v : v])
);

// baseColor = 0xccee88; // bright yellow green
// baseColor = 0xcccccc; // gray almost invisible
// baseColor = 0xccccee; // lavender almost invisible
// baseColor = 0xaacccc; // lavender almost invisible
// baseColor = 0xdddddd; // grayish white?
// baseColor = 0xaaaaaa; // dark grayish brown
// baseColor = 0x777777; // very dark brown

export default COLORS;

export function colorToCss(c: number): string {
  return '#' + c.toString(16);
}
