import { Vector2 } from '../lib/util/geometry/vector2';
import { Vector3 } from '../lib/util/geometry/vector3';

export type PlayerUIState = {
  /**
   * Determines if pixi (i.e. strategic view) is hidden or not.
   */
  isPixiHidden: boolean;
  /**
   * Determines where in the universe the user has scrolled to.
   */
  virtualGridLocation: Vector3;
  /**
   * Which, if any, node is highlighted with a selection cursor
   */
  cursoredNodeLocation: Vector3 | undefined;
  /**
   * state of the sidebar component
   */
  isSidebarOpen: boolean;
  /**
   * whether or not the cursor is captured by a text entry element. if so, we need to allow default behavior on keyboard events
   */
  isTextBoxFocused: boolean;

  // WIP?
  virtualApproximateScroll?: Vector2;
  strategicGridLocation?: Vector3;
};

export const newPlayerUIState = (): PlayerUIState => {
  return {
    isPixiHidden: true,
    virtualGridLocation: Vector3.Zero,
    cursoredNodeLocation: undefined,
    isSidebarOpen: false,
    isTextBoxFocused: false,
  };
};

const serializeToObject = (s: PlayerUIState): object => {
  return {
    ...s,
    virtualGridLocation: Vector3.SerializeToObject(s.virtualGridLocation),
  };
};

const serialize = (s: PlayerUIState) => JSON.stringify(serializeToObject(s));

const deserializeFromObject = (obj: object): PlayerUIState => {
  if (
    !obj.hasOwnProperty('isPixiHidden') ||
    !obj.hasOwnProperty('virtualGridLocation') ||
    !obj.hasOwnProperty('cursoredNodeLocation') ||
    !obj.hasOwnProperty('isSidebarOpen') ||
    !obj.hasOwnProperty('isTextBoxFocused')
  ) {
    console.error('Failed deserializing PlayerUIState');
  }

  return {
    ...obj,
    virtualGridLocation: Vector3.Deserialize((obj as any).virtualGridLocation),
  } as PlayerUIState;
};

const deserialize = (obj: string) => deserializeFromObject(JSON.parse(obj));

export const PlayerUiState = {
  new: newPlayerUIState,
  serialize,
  deserialize,
};
