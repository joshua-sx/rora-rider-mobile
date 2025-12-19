import type { PlaceDetails, RouteData } from '@/store/route-store';

export type TripStatus = 'not_taken' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Trip {
  id: string;
  timestamp: number;
  origin: PlaceDetails;
  destination: PlaceDetails;
  routeData: RouteData;
  status: TripStatus;
  driverId?: string;
}

