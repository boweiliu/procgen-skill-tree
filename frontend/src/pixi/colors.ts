let COLORS = {
  // good colors
  backgroundBlue: 0x222222,
  // nodePink: 0xeeaaaa,
  // nodeLavender: 0xcc88ee,
  // nodeBlue: 0x99bbff,
  // nodeAqua: 0xbbccdd,
  // nodeGrey: 0xddffdd,

  // shitty colors
  // backgroundBlue: 0xffffff,
  nodePink: 0x332244,
  nodeLavender: 0x777777,
  nodeBlue: 0xdddddd,

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
  black: 0x000000,
};

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
