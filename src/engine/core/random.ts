/**
 * Deterministic Pseudo-Random Number Generator using Mulberry32 & SplitMix32.
 * Includes MurmurHash3 for reproducible string seed hashing and derived sub-streams.
 */

export class SeededRNG {
  private state: number;

  constructor(seed: number | string) {
    if (typeof seed === 'string') {
      this.state = SeededRNG.hashString(seed);
    } else {
      this.state = (seed | 0) || 0x12345678;
    }
  }

  /**
   * MurmurHash3 32-bit string hashing.
   */
  public static hashString(str: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  }

  /**
   * Returns a float in [0, 1).
   */
  public nextFloat(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns an integer in [min, max] inclusive.
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(min + this.nextFloat() * (max - min + 1));
  }

  /**
   * Returns a float in [min, max).
   */
  public nextRange(min: number, max: number): number {
    return min + this.nextFloat() * (max - min);
  }

  /**
   * Generates a 3D unit vector uniformly distributed on the sphere.
   */
  public nextUnitSphereVector(): [number, number, number] {
    const u = this.nextFloat();
    const v = this.nextFloat();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const sinPhi = Math.sin(phi);
    return [
      sinPhi * Math.cos(theta),
      sinPhi * Math.sin(theta),
      Math.cos(phi)
    ];
  }

  /**
   * Fork an independent deterministic sub-stream.
   */
  public fork(tag: string): SeededRNG {
    const subSeed = SeededRNG.hashString(`${this.state}:${tag}`);
    return new SeededRNG(subSeed);
  }
}
