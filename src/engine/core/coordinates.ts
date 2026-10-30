/**
 * Spherical & Geographic Coordinate Transformations and Geodesic Utilities.
 * Coordinate conventions:
 * - Latitude (lat): -90 deg (South Pole) to +90 deg (North Pole)
 * - Longitude (lon): -180 deg (West) to +180 deg (East), 0 deg = Prime Meridian
 * - Cartesian (x, y, z):
 *     y = North pole (+Y is up, along rotational axis)
 *     z = Prime meridian at equator (lat=0, lon=0)
 *     x = 90 deg East (lat=0, lon=+90)
 */

const DEG2RAD = Math.PI / 180.0;
const RAD2DEG = 180.0 / Math.PI;

export interface LatLon {
  lat: number; // degrees [-90, 90]
  lon: number; // degrees [-180, 180]
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export class GeoCoords {
  /**
   * Convert spherical (lat, lon) in degrees to Cartesian (x, y, z) on unit sphere.
   */
  public static latLonToCartesian(lat: number, lon: number): [number, number, number] {
    const phi = lat * DEG2RAD;
    const lambda = lon * DEG2RAD;
    const cosPhi = Math.cos(phi);
    
    // y is along the rotational axis (up)
    const y = Math.sin(phi);
    // z is lat=0, lon=0
    const z = cosPhi * Math.cos(lambda);
    // x is lat=0, lon=90 deg
    const x = cosPhi * Math.sin(lambda);

    return [x, y, z];
  }

  /**
   * Convert Cartesian (x, y, z) to spherical (lat, lon) in degrees.
   */
  public static cartesianToLatLon(x: number, y: number, z: number): LatLon {
    const len = Math.sqrt(x * x + y * y + z * z);
    if (len === 0) {
      return { lat: 0, lon: 0 };
    }
    const nx = x / len;
    const ny = Math.max(-1.0, Math.min(1.0, y / len));
    const nz = z / len;

    const lat = Math.asin(ny) * RAD2DEG;
    let lon = Math.atan2(nx, nz) * RAD2DEG;
    
    // Normalize lon to [-180, 180]
    if (lon > 180) lon -= 360;
    if (lon < -180) lon += 360;

    return { lat, lon };
  }

  /**
   * Great-circle distance between two points on unit sphere in radians.
   */
  public static angularDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const phi1 = lat1 * DEG2RAD;
    const phi2 = lat2 * DEG2RAD;
    const deltaPhi = (lat2 - lat1) * DEG2RAD;
    const deltaLambda = (lon2 - lon1) * DEG2RAD;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
              
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  }

  /**
   * Great-circle distance between two 3D unit vectors in radians.
   */
  public static vectorAngularDistance(v1: [number, number, number], v2: [number, number, number]): number {
    const dot = Math.max(-1.0, Math.min(1.0, v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]));
    return Math.acos(dot);
  }

  /**
   * Physical distance in kilometers on a sphere of given radius.
   */
  public static physicalDistanceKm(angularDistRad: number, radiusKm: number): number {
    return angularDistRad * radiusKm;
  }

  /**
   * Spherical surface area of a latitude-longitude quad patch in steradians (solid angle).
   * Area = (lon2 - lon1)_rad * |sin(lat2) - sin(lat1)|
   */
  public static cellSolidAngle(lat1: number, lat2: number, deltaLonDeg: number): number {
    const sin1 = Math.sin(lat1 * DEG2RAD);
    const sin2 = Math.sin(lat2 * DEG2RAD);
    const deltaLonRad = Math.abs(deltaLonDeg) * DEG2RAD;
    return deltaLonRad * Math.abs(sin2 - sin1);
  }

  /**
   * Total spherical surface area: 4 * PI * R^2
   */
  public static totalSphereAreaKm2(radiusKm: number): number {
    return 4 * Math.PI * radiusKm * radiusKm;
  }
}
