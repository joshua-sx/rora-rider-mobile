import type { Venue, CategoryInfo, VenueCategory } from '@/src/types/venue';

export const CATEGORIES: CategoryInfo[] = [
  { slug: 'restaurant', name: 'Restaurants', icon: 'restaurant', color: '#F59E0B' },
  { slug: 'beach', name: 'Beaches', icon: 'water', color: '#0EA5E9' },
  { slug: 'shopping', name: 'Shopping', icon: 'bag-handle', color: '#EC4899' },
  { slug: 'nightlife', name: 'Nightlife', icon: 'wine', color: '#8B5CF6' },
  { slug: 'hotel', name: 'Hotels', icon: 'bed', color: '#10B981' },
  { slug: 'activity', name: 'Activities', icon: 'compass', color: '#F97316' },
];

export const VENUES: Venue[] = [
  // Beaches
  {
    id: 'maho-beach',
    name: 'Maho Beach',
    category: 'beach',
    description:
      'Famous for the Princess Juliana International Airport right next to the beach. Watch heavy jets land just meters above your head. A unique experience combining aviation and beach fun.',
    shortDescription: 'Famous for plane spotting and turquoise water.',
    images: [],
    rating: 4.8,
    reviewCount: 310,
    distance: 3.4,
    latitude: 18.0409,
    longitude: -63.1182,
    tags: ['Plane Spotting', 'Bar/Grill', 'Swimming'],
    isPopular: true,
    isFeatured: true,
    estimatedDuration: 12,
    hours: '24 hours',
    amenities: ['Restaurants nearby', 'Parking', 'Restrooms'],
  },
  {
    id: 'mullet-bay',
    name: 'Mullet Bay',
    category: 'beach',
    description:
      'One of the most beautiful beaches on the island with crystal clear water and calm conditions. Perfect for families and swimming.',
    shortDescription: 'Clear water & calm waves. Perfect for families.',
    images: [],
    rating: 4.9,
    reviewCount: 205,
    distance: 4.1,
    latitude: 18.0378,
    longitude: -63.1241,
    tags: ['Swimming', 'Family Friendly', 'Snorkeling'],
    isPopular: true,
    estimatedDuration: 15,
  },
  {
    id: 'orient-bay',
    name: 'Orient Bay',
    category: 'beach',
    description:
      'A stunning two-mile stretch of white sand beach on the French side. Known for water sports, beach clubs, and clothing-optional section.',
    shortDescription: 'White sand paradise with water sports.',
    images: [],
    rating: 4.7,
    reviewCount: 180,
    distance: 8.2,
    latitude: 18.0942,
    longitude: -63.0131,
    tags: ['Water Sports', 'Beach Clubs', 'Restaurants'],
    estimatedDuration: 22,
  },
  {
    id: 'great-bay-beach',
    name: 'Great Bay Beach',
    category: 'beach',
    description:
      'Located in Philipsburg, this beach offers calm waters and is walking distance from duty-free shopping and restaurants.',
    shortDescription: 'Philipsburg beachfront with nearby shopping.',
    images: [],
    rating: 4.5,
    reviewCount: 120,
    distance: 2.1,
    latitude: 18.0167,
    longitude: -63.0456,
    tags: ['Shopping Nearby', 'Calm Waters', 'Restaurants'],
    estimatedDuration: 8,
  },

  // Restaurants
  {
    id: 'grand-case',
    name: 'Grand Case',
    category: 'restaurant',
    description:
      'Known as the "Gourmet Capital of the Caribbean," Grand Case offers a strip of world-class restaurants featuring French, Creole, and international cuisine.',
    shortDescription: 'The gourmet capital of the Caribbean.',
    images: [],
    rating: 4.9,
    reviewCount: 450,
    distance: 6.5,
    latitude: 18.1017,
    longitude: -63.0528,
    tags: ['Fine Dining', 'French Cuisine', 'Seafood'],
    isFeatured: true,
    estimatedDuration: 18,
  },
  {
    id: 'beau-beaus',
    name: "Beau Beau's",
    category: 'restaurant',
    description:
      'Charming beachfront restaurant in Oyster Bay serving fresh seafood and Caribbean dishes with stunning ocean views.',
    shortDescription: 'Beachfront dining in Oyster Bay.',
    images: [],
    rating: 4.6,
    reviewCount: 89,
    distance: 5.3,
    latitude: 18.0461,
    longitude: -63.0183,
    tags: ['Seafood', 'Beachfront', 'Caribbean'],
    estimatedDuration: 16,
  },
  {
    id: 'skipjack-sxm',
    name: "Skipjack's SXM",
    category: 'restaurant',
    description:
      'Popular spot for fresh catches and local favorites. Known for their fish tacos and casual island vibe.',
    shortDescription: 'Fresh catches and fish tacos.',
    images: [],
    rating: 4.4,
    reviewCount: 156,
    distance: 3.8,
    latitude: 18.0234,
    longitude: -63.0678,
    tags: ['Seafood', 'Casual', 'Local Favorite'],
    estimatedDuration: 12,
  },

  // Hotels
  {
    id: 'sonesta-resort',
    name: 'Sonesta Resort',
    category: 'hotel',
    description:
      'Luxury beachfront resort at Maho Beach with stunning views of the airport runway. Multiple pools, restaurants, and casino on-site.',
    shortDescription: 'Luxury resort at Maho Beach.',
    images: [],
    rating: 4.5,
    reviewCount: 892,
    distance: 3.2,
    latitude: 18.0412,
    longitude: -63.1156,
    tags: ['Beachfront', 'Casino', 'Pool'],
    isFeatured: true,
    estimatedDuration: 11,
    amenities: ['Pool', 'Spa', 'Casino', 'Multiple Restaurants'],
  },
  {
    id: 'divi-little-bay',
    name: 'Divi Little Bay Beach Resort',
    category: 'hotel',
    description:
      'All-inclusive resort on a private peninsula with three beaches and panoramic Caribbean views.',
    shortDescription: 'All-inclusive on a private peninsula.',
    images: [],
    rating: 4.3,
    reviewCount: 567,
    distance: 1.8,
    latitude: 18.0089,
    longitude: -63.0512,
    tags: ['All-Inclusive', 'Private Beach', 'Family Friendly'],
    estimatedDuration: 7,
  },

  // Nightlife
  {
    id: 'lotus-nightclub',
    name: 'Lotus Nightclub',
    category: 'nightlife',
    description:
      'Premier nightclub in Sint Maarten featuring international DJs, bottle service, and a high-energy atmosphere.',
    shortDescription: 'Premier nightclub with international DJs.',
    images: [],
    rating: 4.2,
    reviewCount: 234,
    distance: 2.9,
    latitude: 18.0356,
    longitude: -63.0823,
    tags: ['Dancing', 'DJ', 'Bottle Service'],
    isPopular: true,
    estimatedDuration: 10,
    hours: '10 PM - 4 AM',
  },
  {
    id: 'sunset-bar',
    name: 'Sunset Bar & Grill',
    category: 'nightlife',
    description:
      'Famous beach bar at Maho Beach. Watch planes land while enjoying drinks and live music.',
    shortDescription: 'Iconic beach bar under the flight path.',
    images: [],
    rating: 4.6,
    reviewCount: 567,
    distance: 3.4,
    latitude: 18.0409,
    longitude: -63.1179,
    tags: ['Beach Bar', 'Live Music', 'Plane Spotting'],
    isPopular: true,
    estimatedDuration: 12,
  },

  // Shopping
  {
    id: 'front-street',
    name: 'Front Street Philipsburg',
    category: 'shopping',
    description:
      'Main shopping street in Philipsburg with duty-free stores, jewelry shops, and Caribbean souvenirs.',
    shortDescription: 'Duty-free shopping paradise.',
    images: [],
    rating: 4.4,
    reviewCount: 890,
    distance: 2.0,
    latitude: 18.0189,
    longitude: -63.0467,
    tags: ['Duty-Free', 'Jewelry', 'Souvenirs'],
    estimatedDuration: 8,
  },
  {
    id: 'maho-plaza',
    name: 'Maho Plaza',
    category: 'shopping',
    description:
      'Shopping center at Maho Village with boutiques, restaurants, and the famous Casino Royale.',
    shortDescription: 'Shopping and entertainment complex.',
    images: [],
    rating: 4.1,
    reviewCount: 345,
    distance: 3.3,
    latitude: 18.0398,
    longitude: -63.1145,
    tags: ['Boutiques', 'Casino', 'Entertainment'],
    estimatedDuration: 11,
  },

  // Activities
  {
    id: 'america-cup',
    name: "America's Cup Racing",
    category: 'activity',
    description:
      'Sail on an actual America\'s Cup yacht and participate in a real racing experience on the Caribbean Sea.',
    shortDescription: 'Race on a real America\'s Cup yacht.',
    images: [],
    rating: 4.9,
    reviewCount: 178,
    distance: 2.5,
    latitude: 18.0234,
    longitude: -63.0523,
    tags: ['Sailing', 'Adventure', 'Racing'],
    isPopular: true,
    estimatedDuration: 9,
  },
  {
    id: 'loterie-farm',
    name: 'Loterie Farm',
    category: 'activity',
    description:
      'Hidden nature reserve with zip lines, hiking trails, and the famous Jungle Pool. A tropical oasis in the hills.',
    shortDescription: 'Zip lines and jungle pool adventure.',
    images: [],
    rating: 4.7,
    reviewCount: 234,
    distance: 7.8,
    latitude: 18.0789,
    longitude: -63.0345,
    tags: ['Zip Line', 'Hiking', 'Nature'],
    isFeatured: true,
    estimatedDuration: 20,
  },
];

// Helper functions
export function getVenueById(id: string): Venue | undefined {
  return VENUES.find((venue) => venue.id === id);
}

export function getVenuesByCategory(category: VenueCategory): Venue[] {
  return VENUES.filter((venue) => venue.category === category);
}

export function getFeaturedVenues(): Venue[] {
  return VENUES.filter((venue) => venue.isFeatured);
}

export function getPopularVenues(): Venue[] {
  return VENUES.filter((venue) => venue.isPopular);
}

export function getNearbyVenues(limit: number = 5): Venue[] {
  return [...VENUES].sort((a, b) => a.distance - b.distance).slice(0, limit);
}

export function getCategoryBySlug(slug: VenueCategory): CategoryInfo | undefined {
  return CATEGORIES.find((cat) => cat.slug === slug);
}

export function searchVenues(query: string): Venue[] {
  const lowerQuery = query.toLowerCase();
  return VENUES.filter(
    (venue) =>
      venue.name.toLowerCase().includes(lowerQuery) ||
      venue.description.toLowerCase().includes(lowerQuery) ||
      venue.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

