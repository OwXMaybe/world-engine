import { PlanetGenerationConfig, TerrainData, ClimateData } from '../../types/planet';

/**
 * Planetary Climate Simulation Engine.
 * Evaluates latitudinal solar insolation, seasonal swings from axial tilt,
 * atmospheric lapse rate, oceanic thermal moderation, Hadley cells,
 * prevailing zonal winds, and mountain orographic rain shadows.
 */
export class ClimateEngine {
  /**
   * Generates temperature, precipitation, and moisture fields across the planetary surface.
   */
  public static generateClimate(
    terrain: TerrainData,
    config: PlanetGenerationConfig
  ): ClimateData {
    const resY = terrain.resolution;
    const resX = terrain.resolution * 2;
    const totalCells = resX * resY;

    const temperaturesC = new Float32Array(totalCells);
    const summerTempsC = new Float32Array(totalCells);
    const winterTempsC = new Float32Array(totalCells);
    const precipitationMm = new Float32Array(totalCells);
    const moistureIndex = new Float32Array(totalCells);

    const baseGlobalTemp = config.averageTemperatureC;
    const tiltRad = (config.axialTiltDegrees * Math.PI) / 180.0;
    const lapseRatePerKm = 6.5; // Standard troposphere lapse rate in C/1000m

    // 1. Compute Temperature Field
    for (let j = 0; j < resY; j++) {
      const latDeg = 90.0 - (180.0 * (j + 0.5)) / resY;
      const latRad = (latDeg * Math.PI) / 180.0;
      const cosLat = Math.cos(latRad);

      // Latitudinal solar insolations: equator warm, poles cold
      // Solar input varies with cos(lat)^0.8
      const latSolarFactor = Math.pow(Math.max(0, cosLat), 0.85);
      const latBaseTemp = baseGlobalTemp + (latSolarFactor * 32.0 - 22.0);

      // Seasonal temperature variation amplitude driven by axial tilt and latitude
      // Polar regions experience massive seasonal swings when tilted
      const seasonalAmplitude = Math.abs(Math.sin(latRad)) * Math.sin(tiltRad) * 28.0;

      for (let i = 0; i < resX; i++) {
        const idx = j * resX + i;
        const isLand = terrain.isLand[idx] === 1;
        const elevKm = Math.max(0, terrain.elevationsMeters[idx]) / 1000.0;

        // Lapse rate cooling: -6.5 C per 1000 meters elevation
        const lapseCooling = elevKm * lapseRatePerKm;

        // Thermal moderation: land has higher seasonal amplitude than ocean
        const continentality = isLand ? 1.0 : 0.25;
        const summerOffset = seasonalAmplitude * continentality;
        const winterOffset = -seasonalAmplitude * continentality;

        // Greenhouse warming effect factor
        const greenhouseBonus = (config.greenhouseEffect - 1.0) * 8.0;

        const meanTemp = latBaseTemp - lapseCooling + greenhouseBonus;
        temperaturesC[idx] = meanTemp;
        summerTempsC[idx] = meanTemp + summerOffset;
        winterTempsC[idx] = meanTemp + winterOffset;
      }
    }

    // 2. Compute Precipitation & Moisture Field
    for (let j = 0; j < resY; j++) {
      const latDeg = 90.0 - (180.0 * (j + 0.5)) / resY;
      const absLat = Math.abs(latDeg);

      // Zonal atmospheric circulation cells:
      // - ITCZ equatorial convective belt (0-10 deg): heavy rain
      // - Subtropical high dry belt (20-35 deg): arid descending air (deserts)
      // - Temperate storm tracks (45-60 deg): cyclonic rain
      // - Polar desert (75-90 deg): cold dry air
      let zonalMoisture = 0.5;
      if (absLat < 12) {
        zonalMoisture = 1.8; // ITCZ wet belt
      } else if (absLat >= 12 && absLat < 35) {
        // Subtropical arid descent
        const t = (absLat - 12) / (35 - 12);
        zonalMoisture = 0.25 + 0.15 * Math.sin(t * Math.PI);
      } else if (absLat >= 35 && absLat < 65) {
        // Temperate frontal precipitation
        const t = (absLat - 35) / (65 - 35);
        zonalMoisture = 0.8 + 0.6 * Math.sin(t * Math.PI);
      } else {
        zonalMoisture = 0.2; // Polar high
      }

      // Prevailing zonal wind direction:
      // Tropics (0-30 deg): Trade winds blow from East to West (wind dir = -1)
      // Mid-latitudes (30-60 deg): Westerlies blow from West to East (wind dir = +1)
      // Polar (>60 deg): Polar Easterlies blow from East to West (wind dir = -1)
      const windDirection = (absLat >= 30 && absLat < 60) ? 1 : -1;

      for (let i = 0; i < resX; i++) {
        const idx = j * resX + i;
        const temp = temperaturesC[idx];
        const isLand = terrain.isLand[idx] === 1;

        // Warm air holds exponentially more moisture (Clausius-Clapeyron approximation)
        const moistureCapacity = Math.max(0.1, Math.min(2.5, Math.exp((temp - 10.0) / 18.0)));

        // Base precipitation in mm/year
        let precip = 950.0 * zonalMoisture * moistureCapacity * config.precipitationIntensity;

        // Ocean cells have abundant evaporation
        if (!isLand) {
          precip *= 1.25;
        } else {
          // Orographic precipitation & Rain Shadow approximation:
          // Check upstream elevation based on prevailing wind
          const upstreamI = (i - windDirection + resX) % resX;
          const upstreamIdx = j * resX + upstreamI;

          const currentElev = terrain.elevations[idx];
          const upstreamElev = terrain.elevations[upstreamIdx];

          // Windward slope: air rises over mountain -> condensation & heavy rain
          const windwardLift = (currentElev - upstreamElev);
          if (windwardLift > 0.02) {
            precip += windwardLift * 2800.0 * config.prevailingWindSpeed;
          }

          // Leeward slope (rain shadow): air descends and dries out
          const leewardDrop = (upstreamElev - currentElev);
          if (leewardDrop > 0.03) {
            precip *= Math.max(0.15, 1.0 - (leewardDrop * 4.0 * config.prevailingWindSpeed));
          }
        }

        precipitationMm[idx] = Math.max(10.0, Math.min(6000.0, precip));

        // Moisture Index: Ratio of precipitation to potential evapotranspiration (PET)
        // Approximate Thornthwaite PET ~ max(1, (temp + 10) * 35)
        const pet = Math.max(150.0, (temp + 15.0) * 55.0);
        moistureIndex[idx] = Math.max(0.0, Math.min(1.0, precip / (pet * 1.8)));
      }
    }

    return {
      temperaturesC,
      summerTempsC,
      winterTempsC,
      precipitationMm,
      moistureIndex
    };
  }
}
