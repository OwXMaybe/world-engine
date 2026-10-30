import { SeededRNG } from '../core/random';
import { SimplexNoise3D } from './noise';
import { TectonicModel } from '../geology/plates';
import { GeoCoords } from '../core/coordinates';
import { PlanetGenerationConfig, TerrainData } from '../../types/planet';

/**
 * Procedural Planetary Terrain Generator.
 * Computes multi-scale elevation, tectonic orogeny, slope, and land/water masks across the sphere.
 */
export class TerrainGenerator {
  private noise: SimplexNoise3D;
  private mountainNoise: SimplexNoise3D;
  private tectonic: TectonicModel;

  constructor(rng: SeededRNG, continentCount: number) {
    const terrainRng = rng.fork('terrain_elevation');
    const mountainRng = rng.fork('terrain_mountains');
    const tectonicRng = rng.fork('terrain_tectonics');

    this.noise = new SimplexNoise3D(terrainRng);
    this.mountainNoise = new SimplexNoise3D(mountainRng);
    this.tectonic = new TectonicModel(tectonicRng, continentCount);
  }

  /**
   * Evaluates raw continuous elevation in [-1.0, 1.0] at a 3D unit sphere point (x, y, z).
   */
  public evaluateElevation(x: number, y: number, z: number, config: PlanetGenerationConfig): number {
    // 1. Continental macro-structure (low frequency, domain-warped)
    const macroScale = 0.9;
    const macro = this.noise.domainWarp(
      x * macroScale,
      y * macroScale,
      z * macroScale,
      0.35 + config.continentalFragmentation * 0.35,
      4
    );

    // Land bias shift based on config.landCoverage (0.0 to 1.0)
    // Target 0.29 land on Earth corresponds to macro ~ 0.15 threshold
    const landBias = (config.landCoverage - 0.3) * 1.4;
    let baseElevation = macro + landBias;

    // 2. Tectonic influence (subduction orogeny & rift depressions)
    const plateSample = this.tectonic.sample(x, y, z);
    if (plateSample.boundaryType === 'convergent') {
      // Orogeny uplift along convergent boundary
      const proximity = Math.max(0, 1.0 - plateSample.boundaryDistance / 0.25);
      baseElevation += proximity * 0.45 * config.mountainIntensity;
    } else if (plateSample.boundaryType === 'divergent') {
      // Rift trough along divergent boundary
      const proximity = Math.max(0, 1.0 - plateSample.boundaryDistance / 0.2);
      baseElevation -= proximity * 0.3;
    }

    // 3. Mountain Ranges: Ridged multifractal noise
    // Mountains are concentrated on dry land and along continental boundaries
    const ridgeScale = 2.4;
    const ridgeVal = this.mountainNoise.ridgedMultifractal(
      x * ridgeScale,
      y * ridgeScale,
      z * ridgeScale,
      5,
      2.1,
      0.55
    );

    // Apply mountains selectively where base elevation is elevated
    if (baseElevation > 0.05) {
      const mountainMask = Math.pow(Math.min(1.0, (baseElevation - 0.05) * 2.5), 1.2);
      const mountainHeight = Math.max(0, ridgeVal) * config.mountainIntensity * 0.65;
      baseElevation += mountainHeight * mountainMask;
    }

    // 4. Regional hills & plains (medium frequency FBM)
    const detailScale = 4.2;
    const detail = this.noise.fbm(x * detailScale, y * detailScale, z * detailScale, 4, 2.0, 0.45);
    baseElevation += detail * 0.18 * config.terrainRoughness;

    // 5. Shallow continental shelves vs deep ocean floor shaping
    if (baseElevation < config.seaLevel) {
      // Shape oceanic abyssal plain and continental slope
      const depth = (config.seaLevel - baseElevation);
      // Gentle shelf near coastline, steeper drop to abyssal plain
      baseElevation = config.seaLevel - Math.pow(depth, 1.25) * 1.1;
    }

    // Clamp normalized elevation to [-1.0, 1.0]
    return Math.max(-1.0, Math.min(1.0, baseElevation));
  }

  /**
   * Generates complete TerrainData grid for given resolution (width = res * 2, height = res).
   * Equirectangular spherical discrete grid.
   */
  public generateGrid(config: PlanetGenerationConfig): TerrainData {
    const resY = config.resolution;
    const resX = config.resolution * 2;
    const totalCells = resX * resY;

    const elevations = new Float32Array(totalCells);
    const elevationsMeters = new Float32Array(totalCells);
    const slopes = new Float32Array(totalCells);
    const isLand = new Uint8Array(totalCells);
    const plateIds = new Uint8Array(totalCells);
    const plateDistances = new Float32Array(totalCells);

    // Generate elevations and tectonic samples
    for (let j = 0; j < resY; j++) {
      // Latitude from +90 (North Pole) down to -90 (South Pole)
      const lat = 90.0 - (180.0 * (j + 0.5)) / resY;
      for (let i = 0; i < resX; i++) {
        // Longitude from -180 to +180
        const lon = -180.0 + (360.0 * (i + 0.5)) / resX;
        const [x, y, z] = GeoCoords.latLonToCartesian(lat, lon);
        const idx = j * resX + i;

        const elev = this.evaluateElevation(x, y, z, config);
        elevations[idx] = elev;

        const plate = this.tectonic.sample(x, y, z);
        plateIds[idx] = plate.plateId;
        plateDistances[idx] = plate.boundaryDistance;

        // Land/water classification based on sea level threshold
        const land = elev >= config.seaLevel;
        isLand[idx] = land ? 1 : 0;

        // Physical elevation in meters:
        if (land) {
          const normLand = (elev - config.seaLevel) / Math.max(0.01, (1.0 - config.seaLevel));
          elevationsMeters[idx] = Math.pow(normLand, 1.1) * config.maxElevationMeters;
        } else {
          const normWater = (config.seaLevel - elev) / Math.max(0.01, (config.seaLevel - (-1.0)));
          elevationsMeters[idx] = -Math.pow(normWater, 1.0) * config.oceanDepthMeters;
        }
      }
    }

    // Compute terrain slopes (gradient magnitude)
    for (let j = 0; j < resY; j++) {
      const jPrev = Math.max(0, j - 1);
      const jNext = Math.min(resY - 1, j + 1);
      for (let i = 0; i < resX; i++) {
        const iPrev = (i - 1 + resX) % resX;
        const iNext = (i + 1) % resX;

        const idx = j * resX + i;
        const elevX1 = elevations[j * resX + iPrev];
        const elevX2 = elevations[j * resX + iNext];
        const elevY1 = elevations[jPrev * resX + i];
        const elevY2 = elevations[jNext * resX + i];

        const dx = (elevX2 - elevX1) * 0.5;
        const dy = (elevY2 - elevY1) * 0.5;
        const gradient = Math.sqrt(dx * dx + dy * dy);
        
        // Slope angle in radians [0, pi/2]
        slopes[idx] = Math.atan(gradient * 5.0);
      }
    }

    // Optional hydraulic erosion smoothing approximation
    if (config.erosionStrength > 0.05) {
      this.applyErosionPass(elevations, isLand, resX, resY, config.erosionStrength);
    }

    return {
      resolution: config.resolution,
      elevations,
      elevationsMeters,
      slopes,
      isLand,
      plateIds,
      plateDistances
    };
  }

  /**
   * Simplified hydraulic / thermal erosion approximation pass.
   * Fluvial transport redistributes high-elevation unstable sediment downhill towards valleys.
   */
  private applyErosionPass(
    elevations: Float32Array,
    isLand: Uint8Array,
    resX: number,
    resY: number,
    strength: number
  ): void {
    const iterations = Math.min(4, Math.max(1, Math.round(strength * 4)));
    const transferRate = strength * 0.06;

    for (let iter = 0; iter < iterations; iter++) {
      for (let j = 1; j < resY - 1; j++) {
        for (let i = 0; i < resX; i++) {
          const idx = j * resX + i;
          if (isLand[idx] === 0) continue; // Skip ocean beds

          const e = elevations[idx];
          const iPrev = (i - 1 + resX) % resX;
          const iNext = (i + 1) % resX;

          // Find lowest neighbor
          const neighbors = [
            (j - 1) * resX + i,
            (j + 1) * resX + i,
            j * resX + iPrev,
            j * resX + iNext
          ];

          let lowestNeighbor = idx;
          let lowestElev = e;
          for (const n of neighbors) {
            if (elevations[n] < lowestElev) {
              lowestElev = elevations[n];
              lowestNeighbor = n;
            }
          }

          const diff = e - lowestElev;
          // Talus angle threshold: material flows downhill when gradient is steep
          if (diff > 0.04) {
            const transfer = diff * transferRate;
            elevations[idx] -= transfer;
            elevations[lowestNeighbor] += transfer * 0.7; // some sediment carried out to sea or deposited
          }
        }
      }
    }
  }
}
