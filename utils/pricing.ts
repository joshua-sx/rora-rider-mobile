/**
 * Pricing calculation utilities
 * Formula: $5.00 base + ($1.50 × distance_km) + ($0.25 × duration_min)
 */

export function calculatePrice(distanceKm: number, durationMin: number): number {
  const BASE_FARE = 5.0;
  const PER_KM_RATE = 1.5;
  const PER_MIN_RATE = 0.25;

  const total = BASE_FARE + distanceKm * PER_KM_RATE + durationMin * PER_MIN_RATE;

  // Round to 2 decimal places
  return Math.round(total * 100) / 100;
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `~${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) {
    return `~${hours}h`;
  }
  return `~${hours}h ${mins}m`;
}
