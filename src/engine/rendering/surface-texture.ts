import { Planet, VisualizationMode } from '../../types/planet';
import { BIOMES } from '../biomes/classification';

/**
 * Procedural Planetary Surface Texture Synthesizer.
 * Creates crisp, scientific high-resolution data textures for Three.js sphere rendering.
 */
export class SurfaceTextureSynthesizer {
  /**
   * Generates a 2D Canvas with the planetary surface colored according to the selected visualization mode.
   */
  public static renderTextureCanvas(planet: Planet, mode: VisualizationMode): HTMLCanvasElement {
    const resY = planet.terrain.resolution;
    const resX = planet.terrain.resolution * 2;

    const canvas = document.createElement('canvas');
    canvas.width = resX;
    canvas.height = resY;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const imgData = ctx.createImageData(resX, resY);
    const data = imgData.data;

    const terrain = planet.terrain;
    const climate = planet.climate;
    const hydrology = planet.hydrology;
    const biomes = planet.biomes;

    for (let j = 0; j < resY; j++) {
      for (let i = 0; i < resX; i++) {
        const idx = j * resX + i;
        const pixelIdx = idx * 4;

        const isLand = terrain.isLand[idx] === 1;
        const elevMeters = terrain.elevationsMeters[idx];
        const temp = climate.temperaturesC[idx];
        const precip = climate.precipitationMm[idx];
        const moisture = climate.moistureIndex[idx];
        const slope = terrain.slopes[idx];
        const isRiver = hydrology.riverMask[idx] === 1;
        const isLake = hydrology.lakes[idx] === 1;

        let r = 0, g = 0, b = 0;

        switch (mode) {
          case 'natural': {
            if (!isLand) {
              // Ocean depth gradient: shallow shelf vs abyssal trench
              const depthFactor = Math.min(1.0, Math.max(0, -elevMeters / 6000.0));
              // Shallow turquoise (#0096c7) to deep navy (#03045e)
              r = Math.round(0 * (1 - depthFactor) + 3 * depthFactor);
              g = Math.round(150 * (1 - depthFactor) + 8 * depthFactor);
              b = Math.round(199 * (1 - depthFactor) + 60 * depthFactor);
            } else if (isRiver || isLake) {
              // Inland freshwater
              r = 20; g = 140; b = 220;
            } else {
              // Biome base color
              const biomeId = biomes.biomeIds[idx];
              const biome = BIOMES[biomeId] || BIOMES[0];
              r = Math.round(biome.rgb[0] * 255);
              g = Math.round(biome.rgb[1] * 255);
              b = Math.round(biome.rgb[2] * 255);

              // High-altitude snow caps
              if (elevMeters > 3600 || (elevMeters > 2000 && temp < 0)) {
                const snowMix = Math.min(1.0, Math.max(0, (elevMeters - 2000) / 2500.0));
                r = Math.round(r * (1 - snowMix) + 245 * snowMix);
                g = Math.round(g * (1 - snowMix) + 248 * snowMix);
                b = Math.round(b * (1 - snowMix) + 255 * snowMix);
              }
            }
            break;
          }

          case 'elevation': {
            if (!isLand) {
              // Bathymetry colormap: deep ocean (indigo) to shallow shelf (cyan)
              const depthT = Math.min(1.0, Math.max(0, (elevMeters + 8000) / 8000.0));
              r = Math.round(10 + depthT * 20);
              g = Math.round(30 + depthT * 140);
              b = Math.round(80 + depthT * 140);
            } else {
              // Hypsometric tint: lowlands green -> yellow plains -> orange plateau -> brown mountain -> white snow
              const normH = Math.min(1.0, Math.max(0, elevMeters / 7000.0));
              if (normH < 0.2) {
                // Lowlands: deep green to olive
                const t = normH / 0.2;
                r = Math.round(40 + t * 90);
                g = Math.round(130 + t * 40);
                b = Math.round(50 - t * 20);
              } else if (normH < 0.5) {
                // Plains to highlands: olive to golden ochre
                const t = (normH - 0.2) / 0.3;
                r = Math.round(130 + t * 70);
                g = Math.round(170 - t * 20);
                b = Math.round(30 + t * 10);
              } else if (normH < 0.8) {
                // Mountains: ochre to rustic mountain brown
                const t = (normH - 0.5) / 0.3;
                r = Math.round(200 - t * 70);
                g = Math.round(150 - t * 60);
                b = Math.round(40 + t * 40);
              } else {
                // Extreme alpine / snow
                const t = (normH - 0.8) / 0.2;
                r = Math.round(130 + t * 125);
                g = Math.round(90 + t * 165);
                b = Math.round(80 + t * 175);
              }
            }
            break;
          }

          case 'temperature': {
            // Diverging scientific thermal map: -45 C (violet/blue) to +45 C (red/crimson)
            const normT = Math.min(1.0, Math.max(0, (temp + 45.0) / 90.0));
            // Multi-segment thermal ramp
            if (normT < 0.25) {
              const t = normT / 0.25;
              r = Math.round(75 + t * -40);
              g = Math.round(0 + t * 120);
              b = Math.round(130 + t * 120);
            } else if (normT < 0.5) {
              const t = (normT - 0.25) / 0.25;
              r = Math.round(35 + t * 10);
              g = Math.round(120 + t * 100);
              b = Math.round(250 - t * 150);
            } else if (normT < 0.75) {
              const t = (normT - 0.5) / 0.25;
              r = Math.round(45 + t * 200);
              g = Math.round(220 - t * 20);
              b = Math.round(100 - t * 100);
            } else {
              const t = (normT - 0.75) / 0.25;
              r = Math.round(245 + t * 10);
              g = Math.round(200 - t * 160);
              b = Math.round(0 + t * 30);
            }
            break;
          }

          case 'precipitation': {
            // Precipitation in mm/yr: 0 (dry sand/ochre) -> 1000 (green) -> 3000+ (deep blue/magenta)
            const normP = Math.min(1.0, Math.max(0, precip / 3500.0));
            if (normP < 0.2) {
              const t = normP / 0.2;
              r = Math.round(220 - t * 100);
              g = Math.round(180 - t * 20);
              b = Math.round(100 + t * 20);
            } else if (normP < 0.6) {
              const t = (normP - 0.2) / 0.4;
              r = Math.round(120 - t * 100);
              g = Math.round(160 + t * 30);
              b = Math.round(120 + t * 100);
            } else {
              const t = (normP - 0.6) / 0.4;
              r = Math.round(20 + t * 60);
              g = Math.round(190 - t * 130);
              b = Math.round(220 + t * 35);
            }
            break;
          }

          case 'biome': {
            const biomeId = biomes.biomeIds[idx];
            const biome = BIOMES[biomeId] || BIOMES[0];
            r = Math.round(biome.rgb[0] * 255);
            g = Math.round(biome.rgb[1] * 255);
            b = Math.round(biome.rgb[2] * 255);
            break;
          }

          case 'moisture': {
            // Moisture index [0, 1]
            const m = Math.min(1.0, Math.max(0, moisture));
            r = Math.round(180 * (1 - m) + 15 * m);
            g = Math.round(130 * (1 - m) + 160 * m);
            b = Math.round(60 * (1 - m) + 210 * m);
            break;
          }

          case 'slope': {
            // Terrain slope in degrees (0 to 60 deg)
            const slopeDeg = (slope * 180.0) / Math.PI;
            const normS = Math.min(1.0, Math.max(0, slopeDeg / 45.0));
            // Flat plains (dark navy/slate) to steep cliffs (bright crimson/white)
            r = Math.round(20 + normS * 220);
            g = Math.round(25 + normS * 50);
            b = Math.round(40 + (1 - normS) * 60);
            break;
          }

          case 'geological': {
            // Tectonic plates and boundaries
            const plateId = terrain.plateIds[idx];
            const dist = terrain.plateDistances[idx];
            // Distinct plate colors
            const hue = (plateId * 47) % 360;
            const isBoundary = dist < 0.15;
            if (isBoundary) {
              // Highlight tectonic fault boundary
              r = 255; g = 80; b = 40;
            } else {
              // Convert HSL to RGB
              const s = 0.6;
              const l = 0.35;
              const rgb = hslToRgb(hue / 360, s, l);
              r = rgb[0]; g = rgb[1]; b = rgb[2];
            }
            break;
          }

          case 'waterDepth': {
            if (!isLand) {
              const depthNorm = Math.min(1.0, Math.max(0, -elevMeters / 9000.0));
              // Cyan shallow to deep indigo
              r = Math.round(0 + depthNorm * 10);
              g = Math.round(180 - depthNorm * 160);
              b = Math.round(220 - depthNorm * 120);
            } else {
              // Land rendered in muted topographic gray
              const landH = Math.min(1.0, Math.max(0, elevMeters / 6000.0));
              const gray = Math.round(40 + landH * 80);
              r = gray; g = gray; b = gray;
            }
            break;
          }

          case 'contour': {
            // Topographic isolines drawn every 500m on land and 1000m in oceans
            const baseGray = isLand ? 50 : 20;
            r = baseGray; g = baseGray + (isLand ? 30 : 10); b = baseGray + (isLand ? 10 : 60);

            const contourInterval = isLand ? 600.0 : 1200.0;
            const remainder = Math.abs(elevMeters % contourInterval);
            if (remainder < 45 || remainder > (contourInterval - 45)) {
              // Contour line
              r = isLand ? 250 : 100;
              g = isLand ? 210 : 220;
              b = isLand ? 120 : 255;
            }
            break;
          }
        }

        data[pixelIdx] = r;
        data[pixelIdx + 1] = g;
        data[pixelIdx + 2] = b;
        data[pixelIdx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}
