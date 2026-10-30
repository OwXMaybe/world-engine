import { Planet } from '../../types/planet';
import { BIOMES } from '../biomes/classification';

export interface HypsometricBin {
  elevationM: number;
  count: number;
  percentage: number;
  isLand: boolean;
}

export interface LatitudinalPoint {
  latitude: number;
  tempMeanC: number;
  precipMm: number;
  elevationM: number;
}

export interface BiomeCoverageRank {
  id: number;
  name: string;
  color: string;
  percentage: number;
  areaKm2: number;
}

export class PlanetaryAnalytics {
  /**
   * Generates a 32-bin hypsometric elevation distribution histogram.
   */
  public static calculateHypsometricCurve(planet: Planet): HypsometricBin[] {
    const elevations = planet.terrain.elevationsMeters;
    const totalCells = elevations.length;
    const minElev = planet.stats.minElevationM;
    const maxElev = planet.stats.maxElevationM;

    const numBins = 32;
    const binWidth = (maxElev - minElev) / numBins;
    const counts = new Uint32Array(numBins);

    for (let i = 0; i < totalCells; i++) {
      const e = elevations[i];
      const binIdx = Math.min(numBins - 1, Math.max(0, Math.floor((e - minElev) / binWidth)));
      counts[binIdx]++;
    }

    const bins: HypsometricBin[] = [];
    for (let b = 0; b < numBins; b++) {
      const elev = minElev + (b + 0.5) * binWidth;
      bins.push({
        elevationM: Math.round(elev),
        count: counts[b],
        percentage: (counts[b] / totalCells) * 100,
        isLand: elev >= 0
      });
    }

    return bins;
  }

  /**
   * Generates latitudinal climate profile from South Pole (-90°) to North Pole (+90°).
   */
  public static calculateLatitudinalProfile(planet: Planet): LatitudinalPoint[] {
    const resY = planet.terrain.resolution;
    const resX = planet.terrain.resolution * 2;
    const temps = planet.climate.temperaturesC;
    const precips = planet.climate.precipitationMm;
    const elevs = planet.terrain.elevationsMeters;

    const profile: LatitudinalPoint[] = [];

    for (let j = 0; j < resY; j++) {
      const lat = 90.0 - (180.0 * (j + 0.5)) / resY;
      let sumT = 0;
      let sumP = 0;
      let sumE = 0;

      for (let i = 0; i < resX; i++) {
        const idx = j * resX + i;
        sumT += temps[idx];
        sumP += precips[idx];
        sumE += elevs[idx];
      }

      profile.push({
        latitude: Math.round(lat * 10) / 10,
        tempMeanC: Math.round((sumT / resX) * 10) / 10,
        precipMm: Math.round(sumP / resX),
        elevationM: Math.round(sumE / resX)
      });
    }

    // Return sorted from -90 (South Pole) to +90 (North Pole)
    return profile.reverse();
  }

  /**
   * Ranks all terrestrial biomes by surface coverage area in km².
   */
  public static calculateBiomeRankings(planet: Planet): BiomeCoverageRank[] {
    const landArea = planet.stats.landAreaKm2;
    const rankings: BiomeCoverageRank[] = [];

    for (const [idStr, pct] of Object.entries(planet.biomes.biomeCoveragePercentages)) {
      const id = Number(idStr);
      const biome = BIOMES[id];
      if (biome && !biome.isWater && pct > 0.05) {
        rankings.push({
          id,
          name: biome.name,
          color: biome.color,
          percentage: pct,
          areaKm2: (landArea * pct) / 100
        });
      }
    }

    return rankings.sort((a, b) => b.percentage - a.percentage);
  }
}
