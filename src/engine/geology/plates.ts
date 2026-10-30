import { SeededRNG } from '../core/random';
import { GeoCoords } from '../core/coordinates';

export type PlateBoundaryType = 'convergent' | 'divergent' | 'transform' | 'interior';

export interface TectonicPlate {
  id: number;
  center: [number, number, number]; // Cartesian unit vector
  velocity: [number, number, number]; // Drift vector
  isOceanic: boolean;
  density: number; // Oceanic plates are denser (subducting)
}

export interface PlateSampleResult {
  plateId: number;
  boundaryDistance: number; // 0 at boundary, larger towards center
  boundaryType: PlateBoundaryType;
  relativeMovement: number; // >0 convergent (compression/uplift), <0 divergent (rift/trench)
}

/**
 * Simplified spherical tectonic plate partitioning.
 * Uses spherical Voronoi partitioning around seeded centers with kinetic drift vectors.
 */
export class TectonicModel {
  private plates: TectonicPlate[] = [];

  constructor(rng: SeededRNG, plateCount: number = 8) {
    const count = Math.max(3, Math.min(24, plateCount));
    
    // Seed plate centers uniformly on sphere
    for (let i = 0; i < count; i++) {
      const center = rng.nextUnitSphereVector();
      // Generate tangential velocity vector
      const vRaw = rng.nextUnitSphereVector();
      // Project onto tangent plane at center: vTangent = vRaw - (vRaw . center) * center
      const dot = vRaw[0] * center[0] + vRaw[1] * center[1] + vRaw[2] * center[2];
      const vx = vRaw[0] - dot * center[0];
      const vy = vRaw[1] - dot * center[1];
      const vz = vRaw[2] - dot * center[2];
      const speed = rng.nextRange(0.02, 0.08); // cm/yr analog
      const len = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;

      this.plates.push({
        id: i,
        center,
        velocity: [(vx / len) * speed, (vy / len) * speed, (vz / len) * speed],
        isOceanic: rng.nextFloat() > 0.4,
        density: rng.nextRange(2.7, 3.3) // Continental ~2.7 g/cm3, Oceanic ~3.0 g/cm3
      });
    }
  }

  /**
   * Sample which plate a 3D unit sphere point belongs to, plus its boundary distance and boundary type.
   */
  public sample(x: number, y: number, z: number): PlateSampleResult {
    let closestPlate = this.plates[0];
    let secondClosestPlate = this.plates[1];
    let minAngle = 10.0;
    let secondMinAngle = 10.0;

    for (let i = 0; i < this.plates.length; i++) {
      const p = this.plates[i];
      const angle = GeoCoords.vectorAngularDistance([x, y, z], p.center);
      if (angle < minAngle) {
        secondMinAngle = minAngle;
        secondClosestPlate = closestPlate;
        minAngle = angle;
        closestPlate = p;
      } else if (angle < secondMinAngle) {
        secondMinAngle = angle;
        secondClosestPlate = p;
      }
    }

    // Distance to boundary is proportional to the difference between distance to closest and second closest plate
    const boundaryDistance = Math.max(0, (secondMinAngle - minAngle) / 0.5);

    // Relative boundary velocity: deltaV = V1 - V2
    const dvx = closestPlate.velocity[0] - secondClosestPlate.velocity[0];
    const dvy = closestPlate.velocity[1] - secondClosestPlate.velocity[1];
    const dvz = closestPlate.velocity[2] - secondClosestPlate.velocity[2];

    // Direction vector from closest plate center to second closest plate center
    const dirx = secondClosestPlate.center[0] - closestPlate.center[0];
    const diry = secondClosestPlate.center[1] - closestPlate.center[1];
    const dirz = secondClosestPlate.center[2] - closestPlate.center[2];
    const dlen = Math.sqrt(dirx * dirx + diry * diry + dirz * dirz) || 1;

    // Movement along boundary normal: positive = moving apart (divergent/rift), negative = colliding (convergent/subduction)
    const normalConvergence = -((dvx * dirx + dvy * diry + dvz * dirz) / dlen);

    let boundaryType: PlateBoundaryType = 'interior';
    if (boundaryDistance < 0.25) {
      if (normalConvergence > 0.01) {
        boundaryType = 'convergent';
      } else if (normalConvergence < -0.01) {
        boundaryType = 'divergent';
      } else {
        boundaryType = 'transform';
      }
    }

    return {
      plateId: closestPlate.id,
      boundaryDistance,
      boundaryType,
      relativeMovement: normalConvergence
    };
  }

  public getPlates(): TectonicPlate[] {
    return this.plates;
  }
}
