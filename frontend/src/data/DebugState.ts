import { Vector2 } from '../lib/util/geometry/vector2';

export type DebugState = {
  retriggerVirtualGridDims: () => void;
  debugShowScrollbars: boolean; // default false
  rerenderGameAreaGrid: () => void;
  enableScrollJump: boolean; // default true
  getForceJumpOffset: () => Vector2 | void;
  getOffsetX: () => number | void;
  isFlipCursored: () => boolean | void;
};

export const newDebugState = (): DebugState => {
  return {
    retriggerVirtualGridDims: () => {},
    debugShowScrollbars: false,
    rerenderGameAreaGrid: () => {},
    enableScrollJump: true,
    getForceJumpOffset: () => {},
    getOffsetX: () => {},
    isFlipCursored: () => {},
  };
};
