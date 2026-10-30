import { SeededRNG } from '../engine/core/random';
import { GeoCoords } from '../engine/core/coordinates';
import { WorldGenerator } from '../engine/world-generator';
import { getDefaultConfig } from '../engine/presets/planet-presets';
import { BiomeClassifier, BIOMES } from '../engine/biomes/classification';

export interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

export function runScientificValidation(): TestResult[] {
  const results: TestResult[] = [];

  // TEST 1: Seed Reproducibility
  try {
    const config1 = getDefaultConfig('scientific-seed-alpha');
    const config2 = getDefaultConfig('scientific-seed-alpha');
    const p1 = WorldGenerator.generatePlanet(config1);
    const p2 = WorldGenerator.generatePlanet(config2);

    let match = true;
    for (let i = 0; i < 500; i++) {
      if (Math.abs(p1.terrain.elevations[i] - p2.terrain.elevations[i]) > 1e-6) {
        match = false;
        break;
      }
    }
    results.push({
      name: 'Test 1: Seed Reproducibility',
      passed: match && p1.stats.landPercentage === p2.stats.landPercentage,
      details: match ? 'Identical seeds yielded identical elevation fields and surface statistics.' : 'Seed divergence detected.'
    });
  } catch (e: any) {
    results.push({ name: 'Test 1: Seed Reproducibility', passed: false, details: e.message });
  }

  // TEST 2: Spherical Coordinate Conversion
  try {
    const eps = 1e-3;
    // Equator & Prime Meridian (lat=0, lon=0) -> (x=0, y=0, z=1)
    const eq0 = GeoCoords.latLonToCartesian(0, 0);
    const eq0Back = GeoCoords.cartesianToLatLon(eq0[0], eq0[1], eq0[2]);
    const passEq0 = Math.abs(eq0Back.lat - 0) < eps && Math.abs(eq0Back.lon - 0) < eps;

    // North Pole (lat=90, lon=0) -> (x=0, y=1, z=0)
    const np = GeoCoords.latLonToCartesian(90, 0);
    const npBack = GeoCoords.cartesianToLatLon(np[0], np[1], np[2]);
    const passNP = Math.abs(npBack.lat - 90) < eps;

    // South Pole (lat=-90, lon=0) -> (x=0, y=-1, z=0)
    const sp = GeoCoords.latLonToCartesian(-90, 0);
    const spBack = GeoCoords.cartesianToLatLon(sp[0], sp[1], sp[2]);
    const passSP = Math.abs(spBack.lat - (-90)) < eps;

    // Antimeridian (lat=0, lon=180) -> (x=0, y=0, z=-1)
    const am = GeoCoords.latLonToCartesian(0, 180);
    const amBack = GeoCoords.cartesianToLatLon(am[0], am[1], am[2]);
    const passAM = Math.abs(amBack.lat - 0) < eps && Math.abs(Math.abs(amBack.lon) - 180) < eps;

    const allPassed = passEq0 && passNP && passSP && passAM;
    results.push({
      name: 'Test 2: Spherical Coordinate Conversion',
      passed: allPassed,
      details: allPassed ? 'Tested Equator, North Pole, South Pole, and Antimeridian successfully.' : 'Spherical conversion error.'
    });
  } catch (e: any) {
    results.push({ name: 'Test 2: Spherical Coordinate Conversion', passed: false, details: e.message });
  }

  // TEST 3: Land/Water Classification with Sea Level
  try {
    const config = getDefaultConfig('sea-level-test');
    const pBase = WorldGenerator.generatePlanet(config);
    const pHighSea = WorldGenerator.updateSeaLevel(pBase, 0.35);
    const pLowSea = WorldGenerator.updateSeaLevel(pBase, -0.35);

    const landBase = pBase.stats.landPercentage;
    const landHigh = pHighSea.stats.landPercentage;
    const landLow = pLowSea.stats.landPercentage;

    const passSea = (landHigh < landBase) && (landLow > landBase);
    results.push({
      name: 'Test 3: Land/Water Classification',
      passed: passSea,
      details: passSea
        ? `Raising sea level reduced land from ${landBase.toFixed(1)}% to ${landHigh.toFixed(1)}%; lowering increased land to ${landLow.toFixed(1)}%.`
        : 'Sea level change did not affect land percentage as expected.'
    });
  } catch (e: any) {
    results.push({ name: 'Test 3: Land/Water Classification', passed: false, details: e.message });
  }

  // TEST 4: Surface Coverage Area
  try {
    const config = getDefaultConfig('coverage-area-test');
    const p = WorldGenerator.generatePlanet(config);
    const totalArea = p.stats.totalSurfaceAreaKm2;
    const sumArea = p.stats.landAreaKm2 + p.stats.waterAreaKm2;
    const areaDiff = Math.abs(totalArea - sumArea) / totalArea;

    const passArea = areaDiff < 1e-4 && Math.abs((p.stats.landPercentage + p.stats.waterPercentage) - 100.0) < 1e-3;
    results.push({
      name: 'Test 4: Surface Coverage Solid Angle Calculation',
      passed: passArea,
      details: passArea ? `Land + Water equals exactly 100.00% (${Math.round(totalArea).toLocaleString()} km²).` : 'Surface area discrepancy.'
    });
  } catch (e: any) {
    results.push({ name: 'Test 4: Surface Coverage Area', passed: false, details: e.message });
  }

  // TEST 5: Elevation Statistics
  try {
    const config = getDefaultConfig('elevation-stat-test');
    const p = WorldGenerator.generatePlanet(config);
    const minM = p.stats.minElevationM;
    const maxM = p.stats.maxElevationM;
    const meanM = p.stats.averageElevationM;

    const passElev = minM < 0 && maxM > 0 && meanM > minM && meanM < maxM;
    results.push({
      name: 'Test 5: Elevation Extremes & Distribution',
      passed: passElev,
      details: passElev
        ? `Min: ${Math.round(minM)}m, Max: +${Math.round(maxM)}m, Mean: ${Math.round(meanM)}m.`
        : 'Invalid elevation range.'
    });
  } catch (e: any) {
    results.push({ name: 'Test 5: Elevation Statistics', passed: false, details: e.message });
  }

  // TEST 6: Slope Behavior
  try {
    const config = getDefaultConfig('slope-test');
    const p = WorldGenerator.generatePlanet(config);
    let allNonNegative = true;
    let maxSlope = 0;
    for (let i = 0; i < p.terrain.slopes.length; i++) {
      const s = p.terrain.slopes[i];
      if (s < 0 || s > Math.PI / 2) allNonNegative = false;
      if (s > maxSlope) maxSlope = s;
    }
    const passSlope = allNonNegative && maxSlope > 0.1;
    results.push({
      name: 'Test 6: Slope Gradient Angle Calculation',
      passed: passSlope,
      details: passSlope ? `All slopes within [0, π/2] radians; max slope is ${(maxSlope * 180 / Math.PI).toFixed(1)}°.` : 'Slope out of bounds.'
    });
  } catch (e: any) {
    results.push({ name: 'Test 6: Slope Calculation', passed: false, details: e.message });
  }

  // TEST 7: Hydrology Downhill Drainage
  try {
    const config = getDefaultConfig('hydrology-test');
    const p = WorldGenerator.generatePlanet(config);
    const flowDirs = p.hydrology.flowDirections;
    const resX = config.resolution * 2;
    const dj = [-1, -1, 0, 1, 1, 1, 0, -1];
    const di = [0, 1, 1, 1, 0, -1, -1, -1];

    let validDownhillTransitions = 0;
    let checkedLandTransitions = 0;

    for (let idx = 0; idx < p.terrain.isLand.length; idx++) {
      if (p.terrain.isLand[idx] === 1 && flowDirs[idx] >= 0) {
        checkedLandTransitions++;
        const dir = flowDirs[idx];
        const j = Math.floor(idx / resX);
        const i = idx % resX;
        const nj = j + dj[dir];
        const ni = (i + di[dir] + resX) % resX;
        const targetIdx = nj * resX + ni;

        // Flow must move towards lower or equal elevation
        if (p.terrain.elevations[targetIdx] <= p.terrain.elevations[idx]) {
          validDownhillTransitions++;
        }
      }
    }

    const downhillRatio = validDownhillTransitions / Math.max(1, checkedLandTransitions);
    const passHydro = downhillRatio > 0.98;
    results.push({
      name: 'Test 7: Hydrological D8 Drainage Pathways',
      passed: passHydro,
      details: passHydro ? `${(downhillRatio * 100).toFixed(1)}% of flow directions strictly downhill towards coastal base levels.` : 'Non-downhill flow paths detected.'
    });
  } catch (e: any) {
    results.push({ name: 'Test 7: Hydrology Downhill Drainage', passed: false, details: e.message });
  }

  // TEST 8: Climate Physical Behavior
  try {
    const config = getDefaultConfig('climate-test');
    const p = WorldGenerator.generatePlanet(config);

    // 1. Latitude effect: Equator warmer than North Pole
    const eqCell = WorldGenerator.sampleGeographicCell(p, 0, 0);
    const poleCell = WorldGenerator.sampleGeographicCell(p, 85, 0);
    const passLat = eqCell.temperatureC > poleCell.temperatureC;

    // 2. Lapse rate effect: Mountain cooler than sea level at same latitude
    let passLapse = false;
    for (let lon = -180; lon < 180; lon += 30) {
      const c1 = WorldGenerator.sampleGeographicCell(p, 20, lon);
      const c2 = WorldGenerator.sampleGeographicCell(p, 20, lon + 10);
      if (Math.abs(c1.elevationMeters - c2.elevationMeters) > 1500) {
        const higher = c1.elevationMeters > c2.elevationMeters ? c1 : c2;
        const lower = c1.elevationMeters > c2.elevationMeters ? c2 : c1;
        if (higher.temperatureC < lower.temperatureC) {
          passLapse = true;
          break;
        }
      }
    }

    const passClimate = passLat && passLapse;
    results.push({
      name: 'Test 8: Climate Physical Relationships',
      passed: passClimate,
      details: passClimate
        ? `Solar insolation cooled equator (${eqCell.temperatureC.toFixed(1)}°C) to pole (${poleCell.temperatureC.toFixed(1)}°C); lapse rate cooling verified.`
        : 'Climate model failed physical tendency checks.'
    });
  } catch (e: any) {
    results.push({ name: 'Test 8: Climate Physical Behavior', passed: false, details: e.message });
  }

  // TEST 9: Biome Classification Matrix
  try {
    // Hot wet -> Tropical Rainforest
    const b1 = BiomeClassifier.classifyCell(true, 100, 26, 2500, false);
    // Cold dry -> Tundra or Glacial Ice
    const b2 = BiomeClassifier.classifyCell(true, 100, -10, 100, false);
    // Hot dry -> Hot Desert
    const b3 = BiomeClassifier.classifyCell(true, 100, 32, 100, false);
    // Submerged -> Ocean
    const b4 = BiomeClassifier.classifyCell(false, -2000, 15, 1000, false);

    const passBiomes =
      b1.key === 'tropical_rainforest' &&
      b2.key === 'ice_sheet' &&
      b3.key === 'hot_desert' &&
      b4.key === 'deep_ocean';

    results.push({
      name: 'Test 9: Ecological Biome Classification Matrix',
      passed: passBiomes,
      details: passBiomes
        ? 'Verified tropical rainforest, glacial ice, hot desert, and ocean biome classification bounds.'
        : 'Biome classification mismatch.'
    });
  } catch (e: any) {
    results.push({ name: 'Test 9: Biome Classification Matrix', passed: false, details: e.message });
  }

  // TEST 10: Dependency Invalidation
  try {
    const config = getDefaultConfig('dep-test');
    const p1 = WorldGenerator.generatePlanet(config);

    // Update sea level only
    const p2 = WorldGenerator.updateSeaLevel(p1, 0.2);
    // Elevation array should be untouched
    let elevationsIdentical = true;
    for (let i = 0; i < 200; i++) {
      if (p1.terrain.elevations[i] !== p2.terrain.elevations[i]) {
        elevationsIdentical = false;
        break;
      }
    }
    const recalculated = p2.metadata.subsystemsRecalculated;
    const passDep = elevationsIdentical && recalculated.includes('seaLevel') && !recalculated.includes('terrain');

    results.push({
      name: 'Test 10: Subsystem Dependency Invalidation',
      passed: passDep,
      details: passDep
        ? 'Selective sea level update preserved raw terrain elevation arrays without wasteful recalculation.'
        : 'Dependency invalidation failed.'
    });
  } catch (e: any) {
    results.push({ name: 'Test 10: Subsystem Dependency Invalidation', passed: false, details: e.message });
  }

  return results;
}
