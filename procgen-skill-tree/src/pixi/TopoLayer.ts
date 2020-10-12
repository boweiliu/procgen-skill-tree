import { connect } from "http2";
import { HashState } from "../library/random";

export type Topo3Frames = {
  out: TopoFrame;
  in0: TopoFrame;
  in1: TopoFrame;
};

export class TopoTemplate {
  public id!: string;
  public orientation!: FrameOrientation;

  public frames!: Topo3Frames;

  public nodes: TopoNode[] = [];

  constructor(id: string, frames: Topo3Frames, random: HashState) {
    this.id = id;
    this.frames = frames;
    this.orientation = frames.out.orientation;

    // start constructing the guy
    connectCorner(this.frames.out.corners["00"], this.frames.in0.corners["00"]);
    connectCorner(this.frames.out.corners["11"], this.frames.in1.corners["00"]);

    if (this.orientation == "=") {
      connectCorner(
        this.frames.out.corners["01"],
        this.frames.in0.corners["01"]
      );
      connectCorner(
        this.frames.out.corners["10"],
        this.frames.in1.corners["10"]
      );
      connectMiddleCorner(
        this.frames.in0.corners["10"],
        this.frames.in1.corners["00"]
      );
      connectMiddleCorner(
        this.frames.in0.corners["11"],
        this.frames.in1.corners["01"]
      );
    } else if (this.orientation == "0") {
      connectCorner(
        this.frames.out.corners["01"],
        this.frames.in1.corners["01"]
      );
      connectCorner(
        this.frames.out.corners["10"],
        this.frames.in0.corners["10"]
      );
      connectMiddleCorner(
        this.frames.in0.corners["01"],
        this.frames.in1.corners["00"]
      );
      connectMiddleCorner(
        this.frames.in0.corners["11"],
        this.frames.in1.corners["10"]
      );
    }
  }
}

export type FrameOrientation = "=" | "0";
export class TopoFrame {
  public id!: string;
  public orientation!: FrameOrientation;

  public corners!: {
    "00": TopoNode;
    "01": TopoNode;
    "10": TopoNode;
    "11": TopoNode;
  };

  /**
   * 00 ----- 10
   * |         |
   * 01 ----- 11
   */
  constructor(id: string, orientation: FrameOrientation) {
    this.id = id;
    this.corners = {
      "00": new TopoNode(id + "-N00"),
      "01": new TopoNode(id + "-N01"),
      "10": new TopoNode(id + "-N10"),
      "11": new TopoNode(id + "-N11"),
    };
    this.orientation = orientation;
  }
}

export class TopoNode {
  public id!: string;

  constructor(id: string) {
    this.id = id;
  }
}
