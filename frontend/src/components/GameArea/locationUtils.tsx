import { Vector2 } from '../../lib/util/geometry/vector2';
import { Vector3 } from '../../lib/util/geometry/vector3';

export function convertVirtualCoordsToLocation(args: {
  virtualCoords: Vector2;
  virtualGridLocation: Vector3;
  virtualGridDims: Vector2;
}): Vector3 {
  const { virtualCoords, virtualGridLocation, virtualGridDims } = args;
  const virtualCenter = virtualGridDims.divide(2).floor();
  const offsetFromVirtualCenter = virtualCoords.subtract(virtualCenter);
  let relativeLocation = Vector2.Zero;

  if (offsetFromVirtualCenter.y % 2 === 0) {
    // calculate the effect of y
    relativeLocation = new Vector2(-1, -2).multiply(
      offsetFromVirtualCenter.y / 2
    );
  } else if (virtualCenter.y % 2 === 0) {
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

export function convertLocationToVirtualCoords(args: {
  location: Vector3;
  virtualGridLocation: Vector3;
  virtualGridDims: Vector2;
}): Vector2 | null {
  const { location, virtualGridLocation, virtualGridDims } = args;
  const virtualCenter = virtualGridDims.divide(2).floor();
  const offsetFromVirtualGridLocation = location.subtract(virtualGridLocation);
  let relativeVirtualCoords = Vector2.Zero;

  if (offsetFromVirtualGridLocation.z !== 0) {
    return null;
  }

  if (offsetFromVirtualGridLocation.y % 2 === 0) {
    relativeVirtualCoords = new Vector2(-1, -2).multiply(
      offsetFromVirtualGridLocation.y / 2
    );
  } else if (virtualCenter.y % 2 === 0) {
    // half block is not in the center row
    /**
     * 0: O - O - O
     * 1:   O - O - O <- offsetFromVirtualGridLocation.y == 1
     * 2: O - O - O <- virtualCenter.y
     * 3:   O - O - O
     */
    relativeVirtualCoords = new Vector2(-1, -1).add(
      new Vector2(-1, -2).multiply((offsetFromVirtualGridLocation.y - 1) / 2)
    );
  } else {
    // half block is in the center row
    /**
     * 0: O - O - O <- offsetFromVirtualGridLocation.y == 1
     * 1:   O - O - O <- virtualCenter.y
     * 2: O - O - O
     * 3:   O - O - O
     */
    relativeVirtualCoords = new Vector2(0, -1).add(
      new Vector2(-1, -2).multiply((offsetFromVirtualGridLocation.y - 1) / 2)
    );
  }
  relativeVirtualCoords = relativeVirtualCoords.addX(
    offsetFromVirtualGridLocation.x
  );

  return virtualCenter.add(relativeVirtualCoords);
}

/**
 *
 * @param args
 * @return the number of pixels, measured from the top left of the virtual area, to the center of the "virtualCenter" node
 */
export function getVirtualGridCenterPx(args: {
  virtualGridDims: Vector2;
  hexGridPx: Vector2;
}) {
  const { virtualGridDims, hexGridPx } = args;

  const virtualCenter = virtualGridDims.divide(2).floor();
  let centerPxY = (virtualCenter.y + 0.5) * hexGridPx.y;

  // even rows are left-aligned, odd rows are right-aligned
  let centerPxX = (virtualCenter.x + 0.5) * hexGridPx.x;
  if (virtualCenter.y % 2 === 1) {
    centerPxX += 0.5 * hexGridPx.x;
  }

  return new Vector2(centerPxX, centerPxY);
}
