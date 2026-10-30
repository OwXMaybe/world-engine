import { SeededRNG } from '../core/random';

/**
 * High-performance 3D Simplex Noise & Fractal Noise Generators.
 * Optimized for seamless spherical sampling without polar singularities or seam artifacts.
 */
export class SimplexNoise3D {
  private p: Uint8Array;
  private perm: Uint8Array;
  private permMod12: Uint8Array;

  // Skewing and unskewing factors for 3D Simplex
  private static readonly F3 = 1.0 / 3.0;
  private static readonly G3 = 1.0 / 6.0;

  // 12 gradient vectors for 3D
  private static readonly grad3 = new Float32Array([
    1, 1, 0,  -1, 1, 0,  1, -1, 0,  -1, -1, 0,
    1, 0, 1,  -1, 0, 1,  1, 0, -1,  -1, 0, -1,
    0, 1, 1,   0, -1, 1,  0, 1, -1,   0, -1, -1
  ]);

  constructor(rng: SeededRNG) {
    this.p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }
    // Fisher-Yates shuffle with seeded RNG
    for (let i = 255; i > 0; i--) {
      const j = rng.nextInt(0, i);
      const tmp = this.p[i];
      this.p[i] = this.p[j];
      this.p[j] = tmp;
    }

    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = (this.perm[i] % 12);
    }
  }

  /**
   * 3D Simplex noise sample in [-1, 1].
   */
  public sample(x: number, y: number, z: number): number {
    const F3 = SimplexNoise3D.F3;
    const G3 = SimplexNoise3D.G3;
    const grad3 = SimplexNoise3D.grad3;

    // Skew the input space to determine which simplex cell we're in
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);

    const t = (i + j + k) * G3;
    const X0 = i - t; // Unskew the cell origin back to (x,y,z) space
    const Y0 = j - t;
    const Z0 = k - t;

    const x0 = x - X0; // The x,y,z distances from the cell origin
    const y0 = y - Y0;
    const z0 = z - Z0;

    // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
    // Determine which simplex we are in.
    let i1: number, j1: number, k1: number; // Offsets for second corner of simplex in (i,j,k) coords
    let i2: number, j2: number, k2: number; // Offsets for third corner of simplex in (i,j,k) coords

    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; // X Y Z order
      } else if (x0 >= z0) {
        i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; // X Z Y order
      } else {
        i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; // Z X Y order
      }
    } else { // x0 < y0
      if (y0 < z0) {
        i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; // Z Y X order
      } else if (x0 < z0) {
        i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; // Y Z X order
      } else {
        i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; // Y X Z order
      }
    }

    // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
    // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
    // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where c = 1/6.
    const x1 = x0 - i1 + G3; // Offsets for middle corner in (x,y,z) coords
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0 * G3; // Offsets for middle corner in (x,y,z) coords
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    const x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;

    // Work out the hashed gradient indices of the four simplex corners
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    const gi0 = this.permMod12[ii + this.perm[jj + this.perm[kk]]] * 3;
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]] * 3;
    const gi2 = this.permMod12[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]] * 3;
    const gi3 = this.permMod12[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]] * 3;

    // Calculate the contribution from the four corners
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    let n0 = 0.0;
    if (t0 > 0) {
      t0 *= t0;
      n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
    }

    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    let n1 = 0.0;
    if (t1 > 0) {
      t1 *= t1;
      n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
    }

    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    let n2 = 0.0;
    if (t2 > 0) {
      t2 *= t2;
      n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
    }

    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    let n3 = 0.0;
    if (t3 > 0) {
      t3 *= t3;
      n3 = t3 * t3 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
    }

    // Add contributions from each corner to get the final noise value.
    // The result is scaled to stay within [-1, 1]
    return 32.0 * (n0 + n1 + n2 + n3);
  }

  /**
   * Fractal Brownian Motion (FBM) with configurable octaves, persistence, and lacunarity.
   */
  public fbm(
    x: number,
    y: number,
    z: number,
    octaves: number = 6,
    lacunarity: number = 2.0,
    persistence: number = 0.5
  ): number {
    let total = 0;
    let frequency = 1.0;
    let amplitude = 1.0;
    let maxValue = 0;

    for (let o = 0; o < octaves; o++) {
      total += this.sample(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  /**
   * Ridged Multifractal Noise for mountain ranges and tectonic ridges.
   * Produces sharp mountain crests with deep valleys.
   */
  public ridgedMultifractal(
    x: number,
    y: number,
    z: number,
    octaves: number = 5,
    lacunarity: number = 2.0,
    gain: number = 0.5
  ): number {
    let total = 0;
    let frequency = 1.0;
    let amplitude = 1.0;
    let weight = 1.0;
    let maxValue = 0;

    for (let o = 0; o < octaves; o++) {
      let signal = this.sample(x * frequency, y * frequency, z * frequency);
      signal = 1.0 - Math.abs(signal); // Invert so crests are at zero crossings
      signal = signal * signal; // Sharpen ridges
      signal *= weight;
      weight = Math.max(0, Math.min(1, signal * 2.0)); // Ridge weight cascades to higher frequencies

      total += signal * amplitude;
      maxValue += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }

    return (total / maxValue) * 2.0 - 1.0; // Normalized to [-1, 1]
  }

  /**
   * Domain Warped noise: samples coordinate perturbed by another noise field.
   * Creates realistic shorelines, dendritic ridges, and organic landmass forms.
   */
  public domainWarp(
    x: number,
    y: number,
    z: number,
    warpStrength: number = 0.35,
    octaves: number = 4
  ): number {
    const qx = this.fbm(x, y, z, 3, 2.0, 0.5);
    const qy = this.fbm(x + 5.2, y + 1.3, z + 2.8, 3, 2.0, 0.5);
    const qz = this.fbm(x + 1.7, y + 9.2, z + 0.4, 3, 2.0, 0.5);

    return this.fbm(
      x + warpStrength * qx,
      y + warpStrength * qy,
      z + warpStrength * qz,
      octaves,
      2.0,
      0.5
    );
  }
}
