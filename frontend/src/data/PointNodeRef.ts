import { Vector2 } from "../lib/util/geometry/vector2";

export class PointNodeRef {
  public z: number;
  public chunkCoord: Vector2;
  public pointNodeCoord: Vector2;
  public pointNodeId: number;

  constructor(args: {
    z: number;
    chunkCoord: Vector2;
    pointNodeCoord: Vector2;
    pointNodeId: number;
  }) {
    this.z = args.z;
    this.chunkCoord = args.chunkCoord;
    this.pointNodeCoord = args.pointNodeCoord;
    this.pointNodeId = args.pointNodeId;
  }

  public hash(): string {
    return (
      this.pointNodeId.toString() +
      this.z.toString() +
      this.chunkCoord.toString() +
      this.pointNodeCoord.toString()
    );
  }

  public toString(): string {
    return this.z + "," + this.chunkCoord.toString() + "," + this.pointNodeCoord.toString()
  }
}

export class ChunkRef {
  public z: number;
  public chunkCoord: Vector2;
  public chunkId: number;

  constructor(args: { z: number; chunkCoord: Vector2; chunkId: number }) {
    this.z = args.z;
    this.chunkCoord = args.chunkCoord;
    this.chunkId = args.chunkId;
  }

  public hash(): string {
    return (
      this.chunkId.toString() + this.z.toString() + this.chunkCoord.toString()
    );
  }
}
