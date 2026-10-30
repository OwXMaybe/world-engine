import { Planet, VisualizationMode } from '../../types/planet';
import { GeoCoords } from '../core/coordinates';
import { BIOMES } from '../biomes/classification';

export class MeshExporter {
  /**
   * Generates a Wavefront .OBJ 3D file with displaced vertices and vertex colors.
   */
  public static exportToOBJ(
    planet: Planet,
    _mode: VisualizationMode = 'natural',
    reliefExaggeration: number = 3.0
  ): string {
    const res = Math.min(64, planet.terrain.resolution); // Subdivided mesh resolution
    const resY = res;
    const resX = res * 2;

    const baseRadius = 1.0;
    const maxDisplacement = 0.08 * reliefExaggeration;

    let obj = `# WORLD ENGINE — 3D Procedural Planetary Mesh\n`;
    obj += `# Planet: ${planet.name}\n`;
    obj += `# Seed: ${planet.config.seedString}\n`;
    obj += `# Resolution: ${resX}x${resY}\n\n`;

    // 1. Vertices (v x y z r g b)
    for (let j = 0; j <= resY; j++) {
      const lat = 90.0 - (180.0 * j) / resY;
      for (let i = 0; i <= resX; i++) {
        const lon = -180.0 + (360.0 * i) / resX;
        const [x, y, z] = GeoCoords.latLonToCartesian(lat, lon);

        // Sample elevation
        const clampedLat = Math.max(-90, Math.min(90, lat));
        const gridJ = Math.max(0, Math.min(planet.terrain.resolution - 1, Math.floor(((90.0 - clampedLat) / 180.0) * planet.terrain.resolution)));
        const normLon = ((lon + 180.0) % 360 + 360) % 360 - 180;
        const gridI = Math.max(0, Math.min(planet.terrain.resolution * 2 - 1, Math.floor(((normLon + 180.0) / 360.0) * (planet.terrain.resolution * 2))));
        const idx = gridJ * (planet.terrain.resolution * 2) + gridI;

        const elevMeters = planet.terrain.elevationsMeters[idx];
        const isLand = planet.terrain.isLand[idx] === 1;

        // Radial displacement factor
        const normH = isLand
          ? (elevMeters / planet.config.maxElevationMeters) * maxDisplacement
          : (elevMeters / planet.config.oceanDepthMeters) * (maxDisplacement * 0.4);

        const r = baseRadius + normH;
        const vx = (x * r).toFixed(5);
        const vy = (y * r).toFixed(5);
        const vz = (z * r).toFixed(5);

        // Vertex color matching biome or elevation
        const biomeId = planet.biomes.biomeIds[idx];
        const biome = BIOMES[biomeId] || BIOMES[0];
        const cr = biome.rgb[0].toFixed(3);
        const cg = biome.rgb[1].toFixed(3);
        const cb = biome.rgb[2].toFixed(3);

        obj += `v ${vx} ${vy} ${vz} ${cr} ${cg} ${cb}\n`;
      }
    }

    // 2. Texture Coordinates (vt u v)
    for (let j = 0; j <= resY; j++) {
      const v = (1.0 - j / resY).toFixed(4);
      for (let i = 0; i <= resX; i++) {
        const u = (i / resX).toFixed(4);
        obj += `vt ${u} ${v}\n`;
      }
    }

    // 3. Faces (f v1/vt1 v2/vt2 v3/vt3)
    const stride = resX + 1;
    for (let j = 0; j < resY; j++) {
      for (let i = 0; i < resX; i++) {
        const p1 = j * stride + i + 1;
        const p2 = p1 + 1;
        const p3 = (j + 1) * stride + i + 1;
        const p4 = p3 + 1;

        // Quad split into two triangles
        obj += `f ${p1}/${p1} ${p3}/${p3} ${p2}/${p2}\n`;
        obj += `f ${p2}/${p2} ${p3}/${p3} ${p4}/${p4}\n`;
      }
    }

    return obj;
  }
}
