import { PlanetGenerationConfig, TerrainData, HydrologyData, SurfaceStatistics } from '../../types/planet';
import { GeoCoords } from '../core/coordinates';

/**
 * Hydrology & Drainage Engine.
 * Evaluates D8 flow direction, upstream flow accumulation, river network extraction, and spherical surface areas.
 */
export class HydrologyEngine {
  /**
   * Calculates surface statistics using rigorous spherical solid angles.
   * Ensures polar grid cells are not distorted or overcounted compared to equatorial cells.
   */
  public static calculateSurfaceStatistics(
    terrain: TerrainData,
    config: PlanetGenerationConfig
  ): SurfaceStatistics {
    const resY = terrain.resolution;
    const resX = terrain.resolution * 2;
    const deltaLonDeg = 360.0 / resX;
    const deltaLatDeg = 180.0 / resY;

    let totalSolidAngle = 0;
    let landSolidAngle = 0;
    let waterSolidAngle = 0;

    let sumElev = 0;
    let minElev = Infinity;
    let maxElev = -Infinity;

    for (let j = 0; j < resY; j++) {
      const latCenter = 90.0 - (180.0 * (j + 0.5)) / resY;
      const lat1 = latCenter - deltaLatDeg * 0.5;
      const lat2 = latCenter + deltaLatDeg * 0.5;
      const cellAreaSteradians = GeoCoords.cellSolidAngle(lat1, lat2, deltaLonDeg);

      for (let i = 0; i < resX; i++) {
        const idx = j * resX + i;
        const isLand = terrain.isLand[idx] === 1;
        const elevMeters = terrain.elevationsMeters[idx];

        totalSolidAngle += cellAreaSteradians;
        if (isLand) {
          landSolidAngle += cellAreaSteradians;
        } else {
          waterSolidAngle += cellAreaSteradians;
        }

        sumElev += elevMeters;
        if (elevMeters < minElev) minElev = elevMeters;
        if (elevMeters > maxElev) maxElev = elevMeters;
      }
    }

    const totalSphereArea = GeoCoords.totalSphereAreaKm2(config.radiusKm);
    const landFraction = landSolidAngle / totalSolidAngle;
    const waterFraction = waterSolidAngle / totalSolidAngle;

    const landAreaKm2 = totalSphereArea * landFraction;
    const waterAreaKm2 = totalSphereArea * waterFraction;
    const averageElevationM = sumElev / (resX * resY);

    return {
      totalSurfaceAreaKm2: totalSphereArea,
      landAreaKm2,
      waterAreaKm2,
      landPercentage: landFraction * 100.0,
      waterPercentage: waterFraction * 100.0,
      averageElevationM,
      maxElevationM: maxElev,
      minElevationM: minElev,
      averageTemperatureC: config.averageTemperatureC,
      averagePrecipitationMm: 1000 * config.precipitationIntensity
    };
  }

  /**
   * Generates D8 drainage flow direction, accumulated upstream catchment area, and extracts river networks.
   */
  public static generateHydrology(
    terrain: TerrainData,
    config: PlanetGenerationConfig
  ): HydrologyData {
    const resY = terrain.resolution;
    const resX = terrain.resolution * 2;
    const totalCells = resX * resY;

    const flowDirections = new Int8Array(totalCells); // -1 = sink/ocean, 0..7 = neighbor index
    const flowAccumulation = new Float32Array(totalCells);
    const riverMask = new Uint8Array(totalCells);
    const lakes = new Uint8Array(totalCells);

    // Initial flow accumulation: 1 unit per cell
    flowAccumulation.fill(1.0);

    // 8-neighbor directional offsets [dj, di]
    // 0: N, 1: NE, 2: E, 3: SE, 4: S, 5: SW, 6: W, 7: NW
    const dj = [-1, -1, 0, 1, 1, 1, 0, -1];
    const di = [0, 1, 1, 1, 0, -1, -1, -1];

    // Array of cell indices sorted by elevation in descending order (highest down to lowest)
    const sortedIndices = new Int32Array(totalCells);
    for (let i = 0; i < totalCells; i++) sortedIndices[i] = i;
    sortedIndices.sort((a, b) => terrain.elevations[b] - terrain.elevations[a]);

    // 1. Determine D8 flow directions
    for (let idx = 0; idx < totalCells; idx++) {
      if (terrain.isLand[idx] === 0) {
        flowDirections[idx] = -1; // Water body is base level
        continue;
      }

      const j = Math.floor(idx / resX);
      const i = idx % resX;
      const currentElev = terrain.elevations[idx];

      let steepestDrop = 0;
      let targetDir = -1;

      for (let dir = 0; dir < 8; dir++) {
        const nj = j + dj[dir];
        if (nj < 0 || nj >= resY) continue; // Clamp at poles

        const ni = (i + di[dir] + resX) % resX; // Wrap around longitude
        const neighborIdx = nj * resX + ni;
        const neighborElev = terrain.elevations[neighborIdx];

        // Diagonal distance correction (sqrt(2) ~ 1.414)
        const dist = (dir % 2 === 1) ? 1.414 : 1.0;
        const drop = (currentElev - neighborElev) / dist;

        if (drop > steepestDrop) {
          steepestDrop = drop;
          targetDir = dir;
        }
      }

      flowDirections[idx] = targetDir;
      if (targetDir === -1) {
        // Depression / pit on dry land
        lakes[idx] = 1;
      }
    }

    // 2. Accumulate flow downhill from highest to lowest cell
    for (let k = 0; k < totalCells; k++) {
      const idx = sortedIndices[k];
      if (terrain.isLand[idx] === 0) continue;

      const dir = flowDirections[idx];
      if (dir >= 0) {
        const j = Math.floor(idx / resX);
        const i = idx % resX;
        const nj = j + dj[dir];
        const ni = (i + di[dir] + resX) % resX;
        const targetIdx = nj * resX + ni;

        flowAccumulation[targetIdx] += flowAccumulation[idx];
      }
    }

    // 3. River thresholding: cells with large drainage catchment become visible rivers
    const riverThreshold = Math.max(15, (100 - config.riverDensityThreshold * 60));
    for (let idx = 0; idx < totalCells; idx++) {
      if (terrain.isLand[idx] === 1 && flowAccumulation[idx] > riverThreshold) {
        riverMask[idx] = 1;
      }
    }

    return {
      flowDirections,
      flowAccumulation,
      riverMask,
      lakes
    };
  }
}
