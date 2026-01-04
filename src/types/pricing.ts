/**
 * Pricing Type Definitions
 */

export interface PricingZone {
  id: string;
  region_id: string;
  zone_name: string;
  zone_code: string;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingRuleVersion {
  id: string;
  region_id: string;
  version_number: number;
  version_name: string | null;
  base_fare: number;
  per_km_rate: number;
  is_active: boolean;
  activated_at: string | null;
  deactivated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PricingFixedFare {
  id: string;
  region_id: string;
  origin_zone_id: string | null;
  destination_zone_id: string | null;
  amount: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingModifier {
  id: string;
  region_id: string;
  modifier_type: 'night' | 'peak' | 'event';
  modifier_name: string;
  modifier_value: number;
  modifier_application: 'multiply' | 'add';
  threshold_config: any; // JSON
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Pricing calculation request
 */
export interface CalculateFareRequest {
  origin: {
    lat: number;
    lng: number;
  };
  destination: {
    lat: number;
    lng: number;
  };
  region_id: string;
  timestamp?: string; // For time-based modifiers
}

/**
 * Pricing calculation response
 */
export interface CalculateFareResponse {
  amount: number;
  pricing_rule_version_id: string;
  calculation_metadata: PricingCalculationMetadata;
}

/**
 * Pricing calculation metadata (for audit trail)
 */
export interface PricingCalculationMetadata {
  method: 'zone_fixed' | 'zone_distance' | 'distance_fallback' | 'haversine_offline';

  // Zone-based
  origin_zone_id?: string;
  origin_zone_name?: string;
  destination_zone_id?: string;
  destination_zone_name?: string;
  fixed_fare_id?: string;

  // Distance-based
  distance_km?: number;
  base_fare?: number;
  per_km_rate?: number;
  distance_fare?: number;

  // Modifiers applied
  modifiers?: Array<{
    type: string;
    name: string;
    value: number;
    application: 'multiply' | 'add';
  }>;

  // Final calculation
  subtotal?: number;
  total: number;

  // Metadata
  calculated_at: string;
  pricing_rule_version_id: string;
}

/**
 * Price label thresholds (for offer comparison)
 */
export interface PriceLabelThresholds {
  good_deal_max_percentage: number;    // e.g., 0.90 (up to 90% of Rora Fare)
  normal_min_percentage: number;        // e.g., 0.90
  normal_max_percentage: number;        // e.g., 1.10
  pricier_min_percentage: number;       // e.g., 1.10 (above 110% of Rora Fare)
}

/**
 * Default price label thresholds
 */
export const DEFAULT_PRICE_LABEL_THRESHOLDS: PriceLabelThresholds = {
  good_deal_max_percentage: 0.90,
  normal_min_percentage: 0.90,
  normal_max_percentage: 1.10,
  pricier_min_percentage: 1.10,
};

/**
 * Calculate price label for an offer
 */
export const calculatePriceLabel = (
  offerAmount: number,
  roraFareAmount: number,
  thresholds: PriceLabelThresholds = DEFAULT_PRICE_LABEL_THRESHOLDS
): 'good_deal' | 'normal' | 'pricier' => {
  const percentage = offerAmount / roraFareAmount;

  if (percentage <= thresholds.good_deal_max_percentage) {
    return 'good_deal';
  } else if (percentage >= thresholds.pricier_min_percentage) {
    return 'pricier';
  } else {
    return 'normal';
  }
};
