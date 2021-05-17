import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';

export function virtualCoordsToLocation(args: {
  virtualCoords: Vector2;
  virtualGridLocation: Vector3;
  virtualGridDims: Vector2;
}): Vector3 {
  const { virtualCoords, virtualGridLocation, virtualGridDims } = args;
  const virtualCenter = virtualGridDims.divide(2).floor();
  const offsetFromVirtualCenter = virtualCoords.subtract(virtualCenter);
  let relativeLocation = new Vector2(0, 0);

  if (offsetFromVirtualCenter.y % 2 === 0) {
    // calculate the effect of y
    relativeLocation = new Vector2(-1, -2).multiply(
      offsetFromVirtualCenter.y / 2
    );
  } else if (virtualCenter.y % 2 == 0) {
    // half block is not in the center row
    /**
     * 0: O - O - O
     * 1:   O - O - O
     * 2: O - O - O <- virtualCenter.y
     * 3:   O - O - O <- offsetFromVirtualCenter.y == 1
     */
    relativeLocation = new Vector2(0, -1).add(
      new Vector2(-1, -2).multiply((offsetFromVirtualCenter.y - 1) / 2)
    );
  } else {
    // half block is in the center row
    /**
     * 0: O - O - O
     * 1:   O - O - O <- virtualCenter.y
     * 2: O - O - O <- offsetFromVirtualCenter.y == 1
     * 3:   O - O - O
     */
    relativeLocation = new Vector2(-1, -1).add(
      new Vector2(-1, -2).multiply((offsetFromVirtualCenter.y - 1) / 2)
    );
  }
  // now add in the x offset
  relativeLocation = relativeLocation.addX(offsetFromVirtualCenter.x);

  return virtualGridLocation.add(Vector3.FromVector2(relativeLocation, 0));
}

export function locationToVirtualCoords() {}
