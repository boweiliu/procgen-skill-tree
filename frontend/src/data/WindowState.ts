/**
 * current window settings -- allows for dynamic resizing and also rotation on mobile web
 */
export type WindowState = {
  orientation: 'original' | 'rotated'; // rotated === we are forcing landscape-in-portrait
  innerWidth: number;
  innerHeight: number;
};
