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

  doStuff() {}

  constructor(id: string, frames: Topo3Frames, random: HashState) {
    this.id = id;
    this.frames = frames;
    this.orientation = frames.out.orientation;

    // start constructing the guy
    // opposite corners
    connectCorner(this.frames.out.corners.I, this.frames.in0.corners.I);
    connectCorner(this.frames.out.corners.D, this.frames.in1.corners.D);
    // the other 2 outside corners
    connectCorner(this.frames.out.corners.S, this.frames.in0.corners.L);
    connectCorner(this.frames.out.corners.L, this.frames.in1.corners.S);
    // center corners
    connectCorner(this.frames.in0.corners.S, this.frames.in1.corners.I);
    connectCorner(this.frames.in0.corners.D, this.frames.in1.corners.L);

    // make some midpoints

    // connect some midpoints
    // out.IS , in0.IL
    // in0.SD, in1.IL
    // in1.SD, out.LD
    // out.IL, in0.IS, in1.IS
    // out.SD, in0.LD, in1.LD
  }
}
function connectCorner(x: any, y: any) {}

export type FrameOrientation = "=" | "0";
export class TopoFrame {
  public id!: string;
  public orientation!: FrameOrientation;

  public corners!: {
    I: TopoNode;
    L: TopoNode;
    S: TopoNode;
    D: TopoNode;
  };

  /**
   *
   * I -----   L       I  -  S
   * |         |       |     |
   * S  -----  D  or   |     |
   *                   |     |
   *                   L  -  D
   *
   */
  constructor(id: string, orientation: FrameOrientation) {
    this.id = id;
    this.corners = {
      I: new TopoNode(id + "-NI"),
      L: new TopoNode(id + "-NL"),
      S: new TopoNode(id + "-NS"),
      D: new TopoNode(id + "-ND"),
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
