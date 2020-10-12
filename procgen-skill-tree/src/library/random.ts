import crypto from "crypto";

/**
 * Md5 is 16 bytes, or max int of 256 ** 16 = 2 ** 128
 */
export class HashState {
  private seed!: Buffer;

  /**
   * HashState().step("foo") is equivalent to HashState("foo")
   */
  constructor(seed?: string) {
    const buffer = crypto
      .createHash("md5")
      .update((seed || "").toString())
      .digest();
    this.seed = buffer;
  }

  public peekRandom(): number {
    const buffer = crypto.createHash("md5").update(this.seed).digest();
    return Number(this.bufferToBigInt(buffer) % BigInt(2 ** 32)) % 2 ** 32;
  }

  // increment the seed linearly by 1
  public step(numSteps: number = 1) {
    this.seed = this.bigIntToBuffer(this.bufferToBigInt(this.seed) + BigInt(1));
  }

  public stepSeed(seed: string) {
    const buffer = crypto.createHash("md5").update(seed.toString()).digest();
    this.seed = this.bigIntToBuffer(
      this.bufferToBigInt(this.seed) + this.bufferToBigInt(buffer)
    );
  }

  private bigIntToBuffer(b: bigint): Buffer {
    let buf = Buffer.alloc(16);
    let val = b;
    for (let i = 0; i < 16; i++) {
      buf[i] = Number(val % BigInt(256));
      val = val / BigInt(256);
    }
    return buf;
  }

  private bufferToBigInt(b: Buffer): bigint {
    let val = BigInt(0);
    for (let i = 0; i < 16; i++) {
      val = val * BigInt(256) + BigInt(b[i]);
    }
    return val;
  }

  public random(): number {
    this.step();
    return this.peekRandom();
  }
}
