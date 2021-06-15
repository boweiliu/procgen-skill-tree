import { EPSILON } from '../epsilon_math';
import { IVector2, Vector2 } from './vector2';

export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

export class Vector3 {
  private _x: number;
  private _y: number;
  private _z: number;

  public get x(): number {
    return this._x;
  }
  public get y(): number {
    return this._y;
  }
  public get z(): number {
    return this._z;
  }

  constructor();
  constructor(x: number, y: number, z: number);
  constructor(props: IVector3);
  constructor(
    propsOrX: IVector3 | number = { x: 0, y: 0, z: 0 },
    y?: number,
    z?: number
  ) {
    if (typeof propsOrX === 'number') {
      this._x = propsOrX;
      this._y = y!;
      this._z = z!;
    } else {
      this._x = propsOrX.x;
      this._y = propsOrX.y;
      this._z = propsOrX.z;
    }
  }

  // public get half(): Vector3 {
  //   return new Vector3({ x: this.x / 2, y: this.y / 2 });
  // }

  public static Zero: Vector3 = new Vector3(0, 0, 0);
  public static One: Vector3 = new Vector3(1, 1, 1);

  static IsVector3(x: any): x is Vector3 {
    return x instanceof Vector3;
  }

  static FromVector2(p: IVector2, z: number = 0) {
    return new Vector3(p.x, p.y, z);
  }

  // static Random(highX: number, highY: number, lowX = 0, lowY = 0) {
  //   return new Vector3({
  //     x: Util.RandRange(lowX, highX),
  //     y: Util.RandRange(lowY, highY),
  //   });
  // }

  hash(): string {
    return this.toString();
  }

  toString(): string {
    return `[${this.x}, ${this.y}, ${this.z}]`;
  }

  // invert(): Vector3 {
  //   return new Vector3({
  //     x: -this.x,
  //     y: -this.y,
  //   });
  // }

  // round(): Vector3 {
  //   return new Vector3({
  //     x: Math.round(this.x),
  //     y: Math.round(this.y),
  //   });
  // }

  // floor(): Vector3 {
  //   return new Vector3({
  //     x: Math.floor(this.x),
  //     y: Math.floor(this.y),
  //   });
  // }

  // taxicabDistance(p: Vector3): number {
  //   return Math.abs(p.x - this.x) + Math.abs(p.y - this.y);
  // }

  // diagonalDistance(p: IVector3): number {
  //   return Math.max(Math.abs(p.x - this.x), Math.abs(p.y - this.y));
  // }

  // distance(p: IVector3): number {
  //   let dx = Math.abs(p.x - this.x);
  //   let dy = Math.abs(p.y - this.y);

  //   return Math.sqrt(dx * dx + dy * dy);
  // }

  // translate(p: { x: number; y: number }): Vector3 {
  //   return new Vector3({
  //     x: this.x + p.x,
  //     y: this.y + p.y,
  //   });
  // }

  subtract(p: IVector3): Vector3 {
    return new Vector3({
      x: this.x - p.x,
      y: this.y - p.y,
      z: this.z - p.z,
    });
  }

  add(pOrX: IVector3 | number, y?: number, z?: number): Vector3 {
    if (typeof pOrX === 'number') {
      return new Vector3({
        x: this.x + pOrX,
        y: this.y + y!,
        z: this.z + z!,
      });
    } else {
      return new Vector3({
        x: this.x + pOrX.x,
        y: this.y + pOrX.y,
        z: this.z + pOrX.z,
      });
    }
  }

  addX(x: number): Vector3 {
    return new Vector3({
      x: this.x + x,
      y: this.y,
      z: this.z,
    });
  }

  addY(y: number): Vector3 {
    return new Vector3({
      x: this.x,
      y: this.y + y,
      z: this.z,
    });
  }

  addZ(z: number): Vector3 {
    return new Vector3({
      x: this.x,
      y: this.y,
      z: this.z + z,
    });
  }

  subtractX(x: number): Vector3 {
    return new Vector3({
      x: this.x - x,
      y: this.y,
      z: this.z,
    });
  }

  subtractY(y: number): Vector3 {
    return new Vector3({
      x: this.x,
      y: this.y - y,
      z: this.z,
    });
  }

  subtractZ(z: number): Vector3 {
    return new Vector3({
      x: this.x,
      y: this.y,
      z: this.z - z,
    });
  }

  // clampY(low: number, high: number): Vector3 {
  //   let newY = this.y;

  //   if (newY < low) {
  //     newY = low;
  //   }
  //   if (newY > high) {
  //     newY = high;
  //   }

  //   return new Vector3({
  //     x: this.x,
  //     y: newY,
  //   });
  // }

  scale(about: IVector3, amount: IVector3): Vector3 {
    return new Vector3({
      x: (this.x - about.x) * amount.x + about.x,
      y: (this.y - about.y) * amount.y + about.y,
      z: (this.z - about.z) * amount.z + about.z,
    });
  }

  // rotate(origin: Vector3, angle: number): Vector3 {
  //   angle = angle / (180 / Math.PI);

  //   return new Vector3({
  //     x:
  //       Math.cos(angle) * (this.x - origin.x) -
  //       Math.sin(angle) * (this.y - origin.y) +
  //       origin.x,
  //     y:
  //       Math.sin(angle) * (this.x - origin.x) +
  //       Math.cos(angle) * (this.y - origin.y) +
  //       origin.y,
  //   });
  // }

  equals(other: IVector3 | undefined): boolean {
    if (other === undefined) {
      return false;
    }

    return (
      Math.abs(this.x - other.x) < EPSILON &&
      Math.abs(this.y - other.y) < EPSILON &&
      Math.abs(this.z - other.z) < EPSILON
    );
  }

  multiply(other: IVector3 | number): Vector3 {
    if (typeof other === 'number') {
      return new Vector3({
        x: this.x * other,
        y: this.y * other,
        z: this.z * other,
      });
    } else {
      return new Vector3({
        x: this.x * other.x,
        y: this.y * other.y,
        z: this.z * other.z,
      });
    }
  }

  divide(other: IVector3 | number): Vector3 {
    if (typeof other === 'number') {
      return new Vector3({
        x: this.x / other,
        y: this.y / other,
        z: this.z / other,
      });
    } else {
      return new Vector3({
        x: this.x / other.x,
        y: this.y / other.y,
        z: this.z / other.z,
      });
    }
  }

  toJSON(): any {
    return {
      __type: 'Vector3',
      x: this.x,
      y: this.y,
      z: this.z,
    };
  }

  // transform(trans: Vector3, scale: number): Vector3 {
  //   return new Vector3({
  //     x: Math.floor((this.x - trans.x) * scale),
  //     y: Math.floor((this.y - trans.y) * scale),
  //   });
  // }

  // normalize(): Vector3 {
  //   if (this.x === 0 && this.y === 0) {
  //     return this;
  //   }

  //   const length = Math.sqrt(this.x * this.x + this.y * this.y);

  //   return new Vector3({
  //     x: this.x / length,
  //     y: this.y / length,
  //   });
  // }

  pairXY(): Vector2 {
    return new Vector2({
      x: this.x,
      y: this.y,
    });
  }

  withX(newX: number): Vector3 {
    return new Vector3({
      x: newX,
      y: this.y,
      z: this.z,
    });
  }

  withY(newY: number): Vector3 {
    return new Vector3({
      x: this.x,
      y: newY,
      z: this.z,
    });
  }

  withZ(newZ: number): Vector3 {
    return new Vector3({
      x: this.x,
      y: this.y,
      z: newZ,
    });
  }

  // invertX(): Vector3 {
  //   return new Vector3({
  //     x: -this.x,
  //     y: this.y,
  //   });
  // }

  // lerp(other: Vector3, t: number): Vector3 {
  //   if (t > 1 || t < 0) {
  //     console.error('Lerp t must be between 0 and 1.');
  //   }
  //   if (t === 0) return this;
  //   if (t === 1) return other;

  //   return this.scale({ x: 0, y: 0 }, { x: 1 - t, y: 1 - t }).add(
  //     other.scale({ x: 0, y: 0 }, { x: t, y: t })
  //   );
  // }

  // lerp2D(other: Vector3, tx: number, ty: number): Vector3 {
  //   if (tx > 1 || tx < 0 || ty > 1 || ty < 0) {
  //     console.error('Lerp t must be between 0 and 1.');
  //   }
  //   return this.scale({ x: 0, y: 0 }, { x: 1 - tx, y: 1 - ty }).add(
  //     other.scale({ x: 0, y: 0 }, { x: tx, y: ty })
  //   );
  // }

  // coserp(other: Vector3, t: number): Vector3 {
  //   t = 0.5 * (1 + Math.cos(2 * t * Math.PI));

  //   return this.lerp(other, t);
  // }

  static Deserialize(obj: any): Vector3 {
    if (
      !obj.hasOwnProperty('x') ||
      !obj.hasOwnProperty('y') ||
      !obj.hasOwnProperty('z')
    ) {
      console.error('Failed deserializing vector3');
    }

    return new Vector3({
      x: obj.x,
      y: obj.y,
      z: obj.z,
    });
  }

  static Serialize(obj: IVector3): string {
    return JSON.stringify(this.SerializeToObject(obj));
  }

  static SerializeToObject(obj: IVector3): object {
    return { x: obj.x, y: obj.y, z: obj.z };
  }
}
