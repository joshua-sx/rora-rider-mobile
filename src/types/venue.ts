export type VenueCategory =
  | 'restaurant'
  | 'beach'
  | 'shopping'
  | 'nightlife'
  | 'hotel'
  | 'activity';

export type CategoryInfo = {
  slug: VenueCategory;
  name: string;
  icon: string; // Ionicons name
  color: string;
};

export type Venue = {
  id: string;
  name: string;
  category: VenueCategory;
  description: string;
  shortDescription: string;
  images: string[];
  rating: number;
  reviewCount: number;
  distance: number; // km
  latitude: number;
  longitude: number;
  tags: string[];
  isPopular?: boolean;
  isFeatured?: boolean;
  estimatedDuration?: number; // minutes to reach
  hours?: string;
  amenities?: string[];
};

export type SearchResultType = 'venue' | 'category' | 'landmark';

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  icon?: string;
  venueId?: string;
  categorySlug?: VenueCategory;
};

