/**
 * Geographic Utilities
 *
 * Haversine distance calculation and point-in-circle checking
 */

/**
 * Earth radius in kilometers
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate Haversine distance between two points
 *
 * @param lat1 Latitude of point 1 (degrees)
 * @param lng1 Longitude of point 1 (degrees)
 * @param lat2 Latitude of point 2 (degrees)
 * @param lng2 Longitude of point 2 (degrees)
 * @returns Distance in kilometers
 */
export const calculateHaversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
};

/**
 * Check if a point is inside a circular zone
 *
 * @param pointLat Point latitude (degrees)
 * @param pointLng Point longitude (degrees)
 * @param centerLat Zone center latitude (degrees)
 * @param centerLng Zone center longitude (degrees)
 * @param radiusMeters Zone radius (meters)
 * @returns true if point is inside zone
 */
export const isPointInCircle = (
  pointLat: number,
  pointLng: number,
  centerLat: number,
  centerLng: number,
  radiusMeters: number
): boolean => {
  const distanceKm = calculateHaversineDistance(
    pointLat,
    pointLng,
    centerLat,
    centerLng
  );
  const distanceMeters = distanceKm * 1000;

  return distanceMeters <= radiusMeters;
};

/**
 * Format distance for display
 *
 * @param distanceKm Distance in kilometers
 * @param unit 'km' or 'mi'
 * @returns Formatted string (e.g., "5.2 km" or "3.2 mi")
 */
export const formatDistance = (
  distanceKm: number,
  unit: 'km' | 'mi' = 'km'
): string => {
  if (unit === 'mi') {
    const distanceMi = distanceKm * 0.621371;
    return `${distanceMi.toFixed(1)} mi`;
  }

  return `${distanceKm.toFixed(1)} km`;
};

/**
 * Estimate distance using haversine with multiplier
 * (for offline fallback)
 *
 * @param lat1 Origin latitude
 * @param lng1 Origin longitude
 * @param lat2 Destination latitude
 * @param lng2 Destination longitude
 * @param multiplier Default 1.3 (to account for roads not being straight lines)
 * @returns Estimated distance in kilometers
 */
export const estimateRouteDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  multiplier: number = 1.3
): number => {
  const straightLineDistance = calculateHaversineDistance(lat1, lng1, lat2, lng2);
  return straightLineDistance * multiplier;
};

/**
 * Validate latitude/longitude coordinates
 */
export const isValidCoordinate = (lat: number, lng: number): boolean => {
  return (
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng)
  );
};

/**
 * Calculate bounding box around a point
 *
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param radiusKm Radius in kilometers
 * @returns Bounding box { minLat, maxLat, minLng, maxLng }
 */
export const calculateBoundingBox = (
  centerLat: number,
  centerLng: number,
  radiusKm: number
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} => {
  // Approximate conversion (more accurate calculation can be done with proper projection)
  const latDelta = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);
  const lngDelta =
    ((radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI)) /
    Math.cos(toRadians(centerLat));

  return {
    minLat: centerLat - latDelta,
    maxLat: centerLat + latDelta,
    minLng: centerLng - lngDelta,
    maxLng: centerLng + lngDelta,
  };
};
