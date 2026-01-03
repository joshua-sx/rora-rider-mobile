import type { PlaceDetails, RouteData } from '@/src/store/route-store';

export type TripStatus = 'not_taken' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface TripQuote {
  estimatedPrice: number;
  currency: 'USD';
  pricingVersion: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  userId?: string; // For future auth integration
  timestamp: number;
  origin: PlaceDetails;
  destination: PlaceDetails;

  // Quote metadata
  quote: TripQuote;

  // Legacy routeData (kept for backward compatibility)
  routeData: RouteData;

  status: TripStatus;
  driverId?: string;

  // Confirmation tracking
  confirmationMethod?: 'qr_scan' | 'manual_code' | 'auto';
  confirmedAt?: string;
  confirmedBy?: 'passenger' | 'driver';

  // Completion tracking
  completedAt?: string;
  completedBy?: 'passenger' | 'driver';

  saved?: boolean;
}

