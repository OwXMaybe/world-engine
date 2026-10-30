import { BiomeDefinition, BiomeData, TerrainData, ClimateData, HydrologyData, PlanetGenerationConfig } from '../../types/planet';

export const BIOMES: Record<number, BiomeDefinition> = {
  // Marine
  0: {
    id: 0,
    key: 'deep_ocean',
    name: 'Deep Ocean',
    color: '#0a1931',
    rgb: [0.039, 0.098, 0.192],
    description: 'Abyssal and bathyal marine zones with extreme depths.',
    minTempC: -2,
    maxTempC: 30,
    minPrecipMm: 0,
    maxPrecipMm: 6000,
    isWater: true
  },
  1: {
    id: 1,
    key: 'coastal_water',
    name: 'Coastal Water / Reef',
    color: '#0077b6',
    rgb: [0.0, 0.467, 0.714],
    description: 'Sunlit shallow continental shelves and marine reefs.',
    minTempC: -2,
    maxTempC: 32,
    minPrecipMm: 0,
    maxPrecipMm: 6000,
    isWater: true
  },

  // Cryosphere
  2: {
    id: 2,
    key: 'ice_sheet',
    name: 'Glacial Ice Sheet',
    color: '#e2e8f0',
    rgb: [0.886, 0.91, 0.941],
    description: 'Perennial ice caps and polar glaciers with permanent freeze.',
    minTempC: -60,
    maxTempC: -5,
    minPrecipMm: 0,
    maxPrecipMm: 1200,
    isWater: false
  },
  3: {
    id: 3,
    key: 'tundra',
    name: 'Polar Tundra',
    color: '#94a3b8',
    rgb: [0.58, 0.639, 0.722],
    description: 'Treeless permafrost plains with lichens, mosses, and dwarf shrubs.',
    minTempC: -15,
    maxTempC: 2,
    minPrecipMm: 50,
    maxPrecipMm: 500,
    isWater: false
  },
  4: {
    id: 4,
    key: 'alpine',
    name: 'Alpine Highland',
    color: '#cbd5e1',
    rgb: [0.796, 0.835, 0.882],
    description: 'High-elevation mountain peaks above tree line with exposed rock and frost.',
    minTempC: -30,
    maxTempC: 4,
    minPrecipMm: 100,
    maxPrecipMm: 3000,
    isWater: false
  },

  // Boreal & Temperate
  5: {
    id: 5,
    key: 'boreal_forest',
    name: 'Boreal Forest (Taiga)',
    color: '#1b4332',
    rgb: [0.106, 0.263, 0.196],
    description: 'Subarctic coniferous forests of pine, spruce, and larch.',
    minTempC: -5,
    maxTempC: 8,
    minPrecipMm: 300,
    maxPrecipMm: 1000,
    isWater: false
  },
  6: {
    id: 6,
    key: 'temperate_forest',
    name: 'Temperate Forest',
    color: '#2d6a4f',
    rgb: [0.176, 0.416, 0.31],
    description: 'Broadleaf deciduous and mixed forests with distinct four seasons.',
    minTempC: 6,
    maxTempC: 18,
    minPrecipMm: 700,
    maxPrecipMm: 1800,
    isWater: false
  },
  7: {
    id: 7,
    key: 'temperate_rainforest',
    name: 'Temperate Rainforest',
    color: '#081c15',
    rgb: [0.031, 0.11, 0.082],
    description: 'Humid coastal maritime forests with giant evergreen canopies.',
    minTempC: 8,
    maxTempC: 18,
    minPrecipMm: 1800,
    maxPrecipMm: 4500,
    isWater: false
  },
  8: {
    id: 8,
    key: 'temperate_grassland',
    name: 'Temperate Steppe / Prairie',
    color: '#a3b18a',
    rgb: [0.639, 0.694, 0.541],
    description: 'Semi-arid plains and steppe dominated by grasses and herbs.',
    minTempC: 4,
    maxTempC: 20,
    minPrecipMm: 250,
    maxPrecipMm: 700,
    isWater: false
  },
  9: {
    id: 9,
    key: 'mediterranean',
    name: 'Mediterranean Woodland',
    color: '#808000',
    rgb: [0.502, 0.502, 0.0],
    description: 'Chaparral and sclerophyll scrub with warm dry summers and mild winters.',
    minTempC: 12,
    maxTempC: 22,
    minPrecipMm: 400,
    maxPrecipMm: 900,
    isWater: false
  },

  // Arid
  10: {
    id: 10,
    key: 'cold_desert',
    name: 'Cold Desert',
    color: '#d4a373',
    rgb: [0.831, 0.639, 0.451],
    description: 'Dry continental interior basins with harsh winter cold and sparse vegetation.',
    minTempC: -5,
    maxTempC: 15,
    minPrecipMm: 0,
    maxPrecipMm: 200,
    isWater: false
  },
  11: {
    id: 11,
    key: 'hot_desert',
    name: 'Hot Subtropical Desert',
    color: '#e76f51',
    rgb: [0.906, 0.435, 0.318],
    description: 'Extreme hyper-arid dune fields and rocky reg with minimal precipitation.',
    minTempC: 18,
    maxTempC: 50,
    minPrecipMm: 0,
    maxPrecipMm: 250,
    isWater: false
  },

  // Tropical
  12: {
    id: 12,
    key: 'savanna',
    name: 'Tropical Savanna',
    color: '#ddb892',
    rgb: [0.867, 0.722, 0.573],
    description: 'Tropical grasslands with scattered trees and intense seasonal wet/dry cycles.',
    minTempC: 18,
    maxTempC: 35,
    minPrecipMm: 500,
    maxPrecipMm: 1200,
    isWater: false
  },
  13: {
    id: 13,
    key: 'tropical_seasonal',
    name: 'Tropical Seasonal Forest',
    color: '#588157',
    rgb: [0.345, 0.506, 0.341],
    description: 'Monsoon forests that shed leaves during the dry period.',
    minTempC: 20,
    maxTempC: 35,
    minPrecipMm: 1200,
    maxPrecipMm: 2200,
    isWater: false
  },
  14: {
    id: 14,
    key: 'tropical_rainforest',
    name: 'Tropical Rainforest',
    color: '#132a13',
    rgb: [0.075, 0.165, 0.075],
    description: 'Equatorial multi-tiered dense rainforest with immense biodiversity.',
    minTempC: 22,
    maxTempC: 38,
    minPrecipMm: 2000,
    maxPrecipMm: 6000,
    isWater: false
  },
  15: {
    id: 15,
    key: 'wetland',
    name: 'Coastal Wetland / Mangrove',
    color: '#2a9d8f',
    rgb: [0.165, 0.616, 0.561],
    description: 'Waterlogged estuarine and delta ecosystems.',
    minTempC: 10,
    maxTempC: 35,
    minPrecipMm: 1000,
    maxPrecipMm: 6000,
    isWater: false
  }
};

export class BiomeClassifier {
  /**
   * Classify a cell based on temperature, precipitation, elevation, and water status.
   */
  public static classifyCell(
    isLand: boolean,
    elevationMeters: number,
    tempC: number,
    precipMm: number,
    isRiverOrLake: boolean
  ): BiomeDefinition {
    // Water bodies
    if (!isLand) {
      if (elevationMeters > -400) {
        return BIOMES[1]; // Coastal water / reef
      }
      return BIOMES[0]; // Deep ocean
    }

    // High alpine peaks
    if (elevationMeters > 3800 || (elevationMeters > 2200 && tempC < 0)) {
      if (tempC < -5) return BIOMES[2]; // Glacial Ice Sheet
      return BIOMES[4]; // Alpine
    }

    // Permanent Ice / Permafrost
    if (tempC < -8) {
      return BIOMES[2]; // Glacial ice
    }
    if (tempC < 0) {
      if (precipMm < 350) return BIOMES[3]; // Tundra
      return BIOMES[5]; // Boreal forest
    }

    // Wetlands near rivers/depressions in warm climates
    if (isRiverOrLake && tempC > 14 && precipMm > 1000) {
      return BIOMES[15]; // Wetland
    }

    // Boreal zone (0 to 6 C)
    if (tempC < 6) {
      if (precipMm < 250) return BIOMES[3]; // Tundra
      return BIOMES[5]; // Boreal forest
    }

    // Temperate zone (6 to 18 C)
    if (tempC < 18) {
      if (precipMm < 250) return BIOMES[10]; // Cold desert
      if (precipMm < 600) return BIOMES[8]; // Temperate grassland
      if (precipMm < 1800) {
        if (tempC > 12 && precipMm < 850) return BIOMES[9]; // Mediterranean
        return BIOMES[6]; // Temperate deciduous forest
      }
      return BIOMES[7]; // Temperate rainforest
    }

    // Subtropical and Tropical zone (> 18 C)
    if (precipMm < 180) {
      return BIOMES[11]; // Hot desert
    }
    if (precipMm < 800) {
      return BIOMES[12]; // Savanna
    }
    if (precipMm < 1900) {
      return BIOMES[13]; // Tropical seasonal forest
    }
    return BIOMES[14]; // Tropical rainforest
  }

  /**
   * Generates BiomeData for the full world grid.
   */
  public static generateBiomes(
    terrain: TerrainData,
    climate: ClimateData,
    hydrology: HydrologyData,
    _config: PlanetGenerationConfig
  ): BiomeData {
    const totalCells = terrain.resolution * terrain.resolution * 2;
    const biomeIds = new Uint8Array(totalCells);
    const counts: Record<number, number> = {};

    let totalLandCells = 0;

    for (let idx = 0; idx < totalCells; idx++) {
      const isLand = terrain.isLand[idx] === 1;
      const elevM = terrain.elevationsMeters[idx];
      const temp = climate.temperaturesC[idx];
      const precip = climate.precipitationMm[idx];
      const isWaterBody = (hydrology.riverMask[idx] === 1 || hydrology.lakes[idx] === 1);

      const biome = BiomeClassifier.classifyCell(isLand, elevM, temp, precip, isWaterBody);
      biomeIds[idx] = biome.id;

      if (isLand) {
        totalLandCells++;
        counts[biome.id] = (counts[biome.id] || 0) + 1;
      }
    }

    // Compute coverage percentages over land area
    const biomeCoveragePercentages: Record<number, number> = {};
    for (const [idStr, count] of Object.entries(counts)) {
      const bId = Number(idStr);
      biomeCoveragePercentages[bId] = totalLandCells > 0 ? (count / totalLandCells) * 100 : 0;
    }

    return {
      biomeIds,
      biomeCoveragePercentages
    };
  }
}
