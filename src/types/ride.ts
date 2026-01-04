/**
 * Ride and Offer Type Definitions
 */

export type RideStatus =
  | 'created'      // Ride session created, QR generated
  | 'discovery'    // Discovery mode active (looking for drivers)
  | 'hold'         // Driver selected, waiting for confirmation
  | 'confirmed'    // Driver confirmed, ride about to start
  | 'active'       // Ride in progress
  | 'completed'    // Ride completed successfully
  | 'canceled'     // Ride canceled by rider or driver
  | 'expired';     // Ride session expired (no response)

export type OfferType =
  | 'accept'       // Driver accepts Rora Fare
  | 'counter';     // Driver counters with different price

export type RequestType =
  | 'broadcast'    // Broadcast to nearby drivers
  | 'direct';      // Direct request to specific driver

export type PriceLabel =
  | 'good_deal'    // Below Rora Fare
  | 'normal'       // At or near Rora Fare
  | 'pricier';     // Above Rora Fare

export interface RideSession {
  id: string;
  region_id: string;
  rider_user_id: string | null;
  guest_token_id: string | null;

  // Origin and destination
  origin_lat: number;
  origin_lng: number;
  origin_label: string;
  destination_lat: number;
  destination_lng: number;
  destination_label: string;
  destination_freeform_name: string | null;

  // Pricing
  rora_fare_amount: number;
  pricing_rule_version_id: string | null;
  pricing_calculation_metadata: any;

  // Request details
  request_type: RequestType;
  target_driver_id: string | null;

  // State
  status: RideStatus;
  discovery_started_at: string | null;
  selected_driver_id: string | null;
  selected_offer_id: string | null;
  hold_expires_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  final_agreed_amount: number | null;

  // QR
  qr_token_jti: string | null;

  created_at: string;
  updated_at: string;
}

export interface RideOffer {
  id: string;
  ride_session_id: string;
  driver_user_id: string;
  offer_type: OfferType;
  offer_amount: number;
  price_label: PriceLabel | null;
  status: 'pending' | 'selected' | 'rejected' | 'expired';
  response_metadata: any;
  created_at: string;
}

export interface RideEvent {
  id: string;
  ride_session_id: string;
  event_type: string;
  event_data: any;
  actor_user_id: string | null;
  actor_type: 'rider' | 'driver' | 'system' | 'admin' | null;
  created_at: string;
}

/**
 * Client-side ride creation payload
 */
export interface CreateRideSessionPayload {
  origin: {
    lat: number;
    lng: number;
    label: string;
  };
  destination: {
    lat: number;
    lng: number;
    label: string;
    freeform_name?: string;
  };
  request_type: RequestType;
  target_driver_id?: string;
}

/**
 * QR Token Payload (JWT claims)
 */
export interface QRTokenPayload {
  jti: string;                 // Unique token ID
  ride_session_id: string;      // Ride session reference
  origin_label: string;         // For display on driver app
  destination_label: string;    // For display on driver app
  rora_fare_amount: number;     // For display
  exp: number;                  // Expiry timestamp (10 minutes)
  iat: number;                  // Issued at timestamp
}
