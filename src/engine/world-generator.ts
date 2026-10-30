import { SeededRNG } from './core/random';
import { TerrainGenerator } from './terrain/elevation';
import { HydrologyEngine } from './hydrology/drainage';
import { ClimateEngine } from './climate/atmosphere';
import { BiomeClassifier, BIOMES } from './biomes/classification';
import { GeoCoords } from './core/coordinates';
import { Planet, PlanetGenerationConfig, GeographicCell } from '../types/planet';

/**
 * WorldEngine Master Procedural Planetary Generator.
 * Coordinates deterministic execution, modular subsystem regeneration,
 * and high-precision spherical data inspection.
 */
export class WorldGenerator {
  /**
   * Generates a complete planetary world from the specified configuration.
   */
  public static generatePlanet(config: PlanetGenerationConfig): Planet {
    const startTime = performance.now();
    const seed = SeededRNG.hashString(config.seedString || String(config.seed));
    const masterRng = new SeededRNG(seed);

    // 1. Terrain subsystem
    const terrainGen = new TerrainGenerator(masterRng, config.continentCount);
    const terrain = terrainGen.generateGrid(config);

    // 2. Hydrology subsystem
    const stats = HydrologyEngine.calculateSurfaceStatistics(terrain, config);
    const hydrology = HydrologyEngine.generateHydrology(terrain, config);

    // 3. Climate subsystem
    const climate = ClimateEngine.generateClimate(terrain, config);

    // 4. Biome subsystem
    const biomes = BiomeClassifier.generateBiomes(terrain, climate, hydrology, config);

    const endTime = performance.now();

    return {
      id: `planet-${seed.toString(16)}-${Date.now()}`,
      name: config.name || 'Terra Incognita',
      config: { ...config, seed },
      terrain,
      hydrology,
      climate,
      biomes,
      stats,
      metadata: {
        generationDurationMs: Math.round(endTime - startTime),
        seed,
        subsystemsRecalculated: ['terrain', 'hydrology', 'climate', 'biomes'],
        timestamp: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Selectively recalculates only sea level and dependent subsystems (hydrology, stats, biomes)
   * without re-evaluating expensive noise and terrain elevation arrays!
   */
  public static updateSeaLevel(planet: Planet, newSeaLevel: number): Planet {
    const startTime = performance.now();
    const config: PlanetGenerationConfig = { ...planet.config, seaLevel: newSeaLevel };
    const terrain = { ...planet.terrain };
    const totalCells = terrain.elevations.length;

    // Update isLand and elevationsMeters
    for (let idx = 0; idx < totalCells; idx++) {
      const elev = terrain.elevations[idx];
      const land = elev >= newSeaLevel;
      terrain.isLand[idx] = land ? 1 : 0;

      if (land) {
        const normLand = (elev - newSeaLevel) / Math.max(0.01, (1.0 - newSeaLevel));
        terrain.elevationsMeters[idx] = Math.pow(normLand, 1.1) * config.maxElevationMeters;
      } else {
        const normWater = (newSeaLevel - elev) / Math.max(0.01, (newSeaLevel - (-1.0)));
        terrain.elevationsMeters[idx] = -Math.pow(normWater, 1.0) * config.oceanDepthMeters;
      }
    }

    const stats = HydrologyEngine.calculateSurfaceStatistics(terrain, config);
    const hydrology = HydrologyEngine.generateHydrology(terrain, config);
    const biomes = BiomeClassifier.generateBiomes(terrain, planet.climate, hydrology, config);

    const endTime = performance.now();

    return {
      ...planet,
      config,
      terrain,
      stats,
      hydrology,
      biomes,
      metadata: {
        ...planet.metadata,
        generationDurationMs: Math.round(endTime - startTime),
        subsystemsRecalculated: ['seaLevel', 'hydrology', 'biomes']
      },
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Selectively updates climate and biomes without recalculating terrain geometry.
   */
  public static updateClimate(planet: Planet, modifiedConfig: Partial<PlanetGenerationConfig>): Planet {
    const startTime = performance.now();
    const config: PlanetGenerationConfig = { ...planet.config, ...modifiedConfig };

    const climate = ClimateEngine.generateClimate(planet.terrain, config);
    const biomes = BiomeClassifier.generateBiomes(planet.terrain, climate, planet.hydrology, config);

    const endTime = performance.now();

    return {
      ...planet,
      config,
      climate,
      biomes,
      metadata: {
        ...planet.metadata,
        generationDurationMs: Math.round(endTime - startTime),
        subsystemsRecalculated: ['climate', 'biomes']
      },
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Sample the underlying geographic data model at exact (lat, lon) coordinates in degrees.
   * Tests at equator, poles, meridian, antimeridian return mathematically accurate cell data.
   */
  public static sampleGeographicCell(planet: Planet, lat: number, lon: number): GeographicCell {
    const resY = planet.terrain.resolution;
    const resX = planet.terrain.resolution * 2;

    // Clamp lat to [-90, 90]
    const clampedLat = Math.max(-90.0, Math.min(90.0, lat));
    // Normalize lon to [-180, 180]
    let normLon = lon;
    while (normLon > 180) normLon -= 360;
    while (normLon < -180) normLon += 360;

    // Map latitude [+90, -90] to grid row [0, resY - 1]
    const j = Math.max(0, Math.min(resY - 1, Math.floor(((90.0 - clampedLat) / 180.0) * resY)));
    // Map longitude [-180, +180] to grid col [0, resX - 1]
    const i = Math.max(0, Math.min(resX - 1, Math.floor(((normLon + 180.0) / 360.0) * resX)));

    const idx = j * resX + i;
    const cartesian = GeoCoords.latLonToCartesian(clampedLat, normLon);

    const biomeId = planet.biomes.biomeIds[idx];
    const biome = BIOMES[biomeId] || BIOMES[0];

    const temp = planet.climate.temperaturesC[idx];
    const summerT = planet.climate.summerTempsC[idx];
    const winterT = planet.climate.winterTempsC[idx];

    return {
      index: idx,
      latitude: clampedLat,
      longitude: normLon,
      cartesian,
      elevation: planet.terrain.elevations[idx],
      elevationMeters: planet.terrain.elevationsMeters[idx],
      isLand: planet.terrain.isLand[idx] === 1,
      slopeDegrees: (planet.terrain.slopes[idx] * 180.0) / Math.PI,
      temperatureC: temp,
      seasonalRangeC: Math.abs(summerT - winterT),
      precipitationMm: planet.climate.precipitationMm[idx],
      moistureIndex: planet.climate.moistureIndex[idx],
      biome,
      isRiver: planet.hydrology.riverMask[idx] === 1,
      isLake: planet.hydrology.lakes[idx] === 1,
      plateId: planet.terrain.plateIds[idx]
    };
  }
}
