
const logRowsToKeep: number = 60; // last 1 seconds, at 60 fps

/**
 * See https://www.npmjs.com/package/pixi-fps https://github.com/jkanchelov/pixi-fps
 */
export class FpsTracker {
  private frameTimestampsInTicks: any[] = [];
  private frameTimestampsInTime: any[] = [];

  constructor() {
    this.frameTimestampsInTicks.push(0);
    // this.frameTimestampsInTime.push((new Date()).getTime());
  }

  public tick(ticksSinceLastUpdate: number) {
    let lastFrameTime = this.frameTimestampsInTicks[this.frameTimestampsInTicks.length - 1];
    this.frameTimestampsInTicks.push(lastFrameTime + ticksSinceLastUpdate);
    
    // rotate logs
    if (this.frameTimestampsInTicks.length > logRowsToKeep + 60) {
      this.frameTimestampsInTicks = this.frameTimestampsInTicks.slice(60);
    }

    // do the same but track real time
    this.frameTimestampsInTime.push((new Date()).getTime());
    if (this.frameTimestampsInTime.length > logRowsToKeep + 60) {
      this.frameTimestampsInTime = this.frameTimestampsInTime.slice(60);
    }
  }

  // [0, 3, 4] -> 30 fps
  public getUps() : number {
    let ticksDiff = this.frameTimestampsInTicks[this.frameTimestampsInTicks.length - 1] - this.frameTimestampsInTicks[0];
    let framesDiff = this.frameTimestampsInTicks.length - 1;

    let framesPerTick = framesDiff / ticksDiff;
    if (!framesPerTick) {
      return 60;
    }

    return framesPerTick * 60;
  }

  public getFps(): number {
    let timeDiff = this.frameTimestampsInTime[this.frameTimestampsInTime.length - 1] - this.frameTimestampsInTime[0];
    let framesDiff = this.frameTimestampsInTime.length - 1;

    let framesPerMilli = framesDiff / timeDiff;
    if (!framesPerMilli) {
      return 60;
    }

    return framesPerMilli * 1000;
  }

  public getFpsString(): string {
    let fpsNumber = this.getFps();

    return fpsNumber.toFixed(1);
  }

  public getUpsString(): string {
    let upsNumber = this.getUps();

    return upsNumber.toFixed(1);
  }
}