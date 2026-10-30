export type VisualizationMode =
  | 'natural'
  | 'elevation'
  | 'temperature'
  | 'precipitation'
  | 'biome'
  | 'moisture'
  | 'slope'
  | 'geological'
  | 'waterDepth'
  | 'contour';

export type PlanetType =
  | 'terrestrial'
  | 'ocean'
  | 'desert'
  | 'frozen'
  | 'archipelago'
  | 'mountain'
  | 'volcanic'
  | 'alien';

export interface PlanetGenerationConfig {
  seed: number;
  seedString: string;
  name: string;
  planetType: PlanetType;
  radiusKm: number; // e.g., 6371 km default
  resolution: number; // grid/subdivision resolution e.g. 64, 128
  
  // Terrain
  landCoverage: number; // 0.0 to 1.0 (target proportion of land, e.g. 0.29)
  continentCount: number; // 2 to 12 major land centers
  continentalFragmentation: number; // 0.0 to 1.0
  terrainRoughness: number; // 0.1 to 1.0
  mountainIntensity: number; // 0.0 to 2.0
  maxElevationMeters: number; // e.g. 8848
  oceanDepthMeters: number; // e.g. 10994
  erosionStrength: number; // 0.0 to 1.0
  
  // Ocean / Hydrology
  seaLevel: number; // -1.0 to 1.0 normalized elevation cutoff (0 = standard)
  riverDensityThreshold: number; // threshold for drainage channels
  lakeGeneration: boolean;
  
  // Climate
  averageTemperatureC: number; // baseline global mean, e.g. 15.0 C
  axialTiltDegrees: number; // e.g. 23.44 deg
  rotationPeriodHours: number; // e.g. 24.0 hours
  precipitationIntensity: number; // 0.2 to 2.0
  greenhouseEffect: number; // 0.5 to 2.0
  prevailingWindSpeed: number; // factor for rain shadows
  
  // Biomes & Vegetation
  vegetationDensity: number; // 0.0 to 1.0
  
  // Rendering
  dayNightCycle: boolean;
  sunLongitude: number; // angle 0-360 deg
  sunLatitude: number; // angle -90 to +90 deg
  atmosphereGlow: boolean;
  atmosphereDensity: number;
  cloudCoverage: number;
  cloudSpeed: number;
}

export interface ElevationRange {
  min: number;
  max: number;
  mean: number;
}

export interface SurfaceStatistics {
  totalSurfaceAreaKm2: number;
  landAreaKm2: number;
  waterAreaKm2: number;
  landPercentage: number;
  waterPercentage: number;
  averageElevationM: number;
  maxElevationM: number;
  minElevationM: number;
  averageTemperatureC: number;
  averagePrecipitationMm: number;
}

export interface TerrainData {
  resolution: number;
  // Normalized elevation: [-1, 1], where 0 is nominal sea level before adjustment
  elevations: Float32Array;
  // Physical elevation in meters: negative for ocean depths, positive for dry land
  elevationsMeters: Float32Array;
  slopes: Float32Array; // Radians [0, pi/2]
  isLand: Uint8Array; // 1 = land, 0 = water
  plateIds: Uint8Array; // Tectonic plate membership
  plateDistances: Float32Array; // Distance to plate boundaries
}

export interface HydrologyData {
  flowDirections: Int8Array; // D8 flow indices (-1 for pits / ocean)
  flowAccumulation: Float32Array; // Accumulated cell drainage area
  riverMask: Uint8Array; // 1 = detected river segment
  lakes: Uint8Array; // 1 = lake body
}

export interface ClimateData {
  temperaturesC: Float32Array; // Annual mean surface temperature
  summerTempsC: Float32Array;
  winterTempsC: Float32Array;
  precipitationMm: Float32Array; // Annual precipitation in mm
  moistureIndex: Float32Array; // Thornthwaite / Lang moisture index [0, 1]
}

export interface BiomeDefinition {
  id: number;
  key: string;
  name: string;
  color: string; // hex
  rgb: [number, number, number]; // [0..1]
  description: string;
  minTempC: number;
  maxTempC: number;
  minPrecipMm: number;
  maxPrecipMm: number;
  isWater: boolean;
}

export interface BiomeData {
  biomeIds: Uint8Array;
  biomeCoveragePercentages: Record<number, number>;
}

export interface GeographicCell {
  index: number;
  latitude: number; // Degrees [-90, +90]
  longitude: number; // Degrees [-180, +180]
  cartesian: [number, number, number]; // Unit sphere (x,y,z)
  elevation: number; // Normalized [-1, 1]
  elevationMeters: number; // Physical meters
  isLand: boolean;
  slopeDegrees: number;
  temperatureC: number;
  seasonalRangeC: number;
  precipitationMm: number;
  moistureIndex: number;
  biome: BiomeDefinition;
  isRiver: boolean;
  isLake: boolean;
  plateId: number;
}

export interface GenerationMetadata {
  generationDurationMs: number;
  seed: number;
  subsystemsRecalculated: string[];
  timestamp: string;
}

export interface Planet {
  id: string;
  name: string;
  config: PlanetGenerationConfig;
  terrain: TerrainData;
  hydrology: HydrologyData;
  climate: ClimateData;
  biomes: BiomeData;
  stats: SurfaceStatistics;
  metadata: GenerationMetadata;
  createdAt: string;
  updatedAt: string;
}
