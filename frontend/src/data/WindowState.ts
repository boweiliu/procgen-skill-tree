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
