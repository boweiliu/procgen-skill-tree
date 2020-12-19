import crypto from "crypto";

/**
 * NOTE(bowei): we use a hash function that is NOT md5 -
 * Either https://github.com/sublee/squirrel3-python/blob/master/squirrel3.py or https://github.com/svaarala/duktape/blob/master/misc/splitmix64.c works fine and is much faster
 * Reference: https://www.youtube.com/watch?v=e4b--cyXEsM or https://www.youtube.com/watch?v=LWFzPP8ZbdU
 * TODO(bowei): port bigint to wasm for faster 64bit operations
 */

function splitmix64(seed: bigint, i: bigint) {
    let z: bigint = seed + i * BigInt("0x9e3779b97f4a7c15");
    z = ( z ^ ( z >> BigInt(30) ) ) * BigInt("0xBF58476D1CE4E5B9");
    z = ( z ^ ( z >> BigInt(27) ) ) * BigInt(0x94D049BB133111EB);
    return z ^ ( z >> BigInt(31) );
}

export const INTMAX32 = 2 ** 32;
export function squirrel3(i: number) {
  let n = (i + INTMAX32) % INTMAX32;
    n = Math.imul(n, 0xb5297a4d);
    n ^= n >>> 8;
    n += 0x68e31da4;
    n ^= n << 8;
    n = Math.imul(n, 0x1b56c4e9);
    n ^= n >>> 8;
    return (n + INTMAX32) % INTMAX32;
}
export const PRIME32 = 0x3233f2cd; // not used ; useful for hashing integers; a 32 bit prime

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
