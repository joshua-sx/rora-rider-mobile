# Design Document: Route Pricing Maps

## Overview

The Route Pricing Maps feature integrates Google Maps into the ride-sharing application to provide location search, route visualization, and pricing calculation. The system uses Google Maps APIs (Places, Directions, Distance Matrix) to deliver real-time location data and routing information for Sint Maarten. The pricing engine calculates fares based on distance and duration, displaying transparent cost breakdowns to users.

## Architecture

The feature follows a layered architecture:

```
┌─────────────────────────────────────────┐
│         UI Layer (React Components)      │
│  - Map Display, Search, Pricing Display  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Service Layer (Business Logic)      │
│  - Route Calculation, Pricing Engine     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      API Integration Layer               │
│  - Google Maps API Calls, Caching        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      External Services                   │
│  - Google Maps APIs, Environment Config  │
└─────────────────────────────────────────┘
```

## Components and Interfaces

### 1. MapComponent

- **Purpose**: Renders the interactive Google Map
- **Props**:
  - `center`: LatLng (initial map center)
  - `onLocationSelect`: (location: Location) => void
  - `markers`: Marker[] (pickup and destination markers)
  - `route`: PolylineData (route visualization)
- **Responsibilities**: Map rendering, marker management, polyline display

### 2. LocationSearchComponent

- **Purpose**: Provides location search functionality
- **Props**:
  - `onLocationSelected`: (location: Location) => void
  - `placeholder`: string
  - `region`: string (e.g., "Sint Maarten")
- **Responsibilities**: Query Google Places API, display results, handle user selection

### 3. RouteCalculationService

- **Purpose**: Orchestrates route and pricing calculations
- **Methods**:
  - `calculateRoute(pickup: Location, destination: Location): Promise<RouteData>`
  - `calculatePricing(routeData: RouteData): PricingData`
- **Responsibilities**: Call Google Directions API, compute pricing

### 4. PricingDisplayComponent

- **Purpose**: Shows pricing breakdown to user
- **Props**:
  - `pricing`: PricingData
- **Responsibilities**: Format and display pricing details

### 5. GoogleMapsService

- **Purpose**: Wrapper around Google Maps APIs
- **Methods**:
  - `searchPlaces(query: string, bounds: LatLngBounds): Promise<PlaceResult[]>`
  - `getDirections(origin: LatLng, destination: LatLng): Promise<DirectionsResult>`
  - `getDistanceMatrix(origins: LatLng[], destinations: LatLng[]): Promise<DistanceMatrixResult>`
- **Responsibilities**: API calls, error handling, response parsing

## Data Models

### Location

```typescript
interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}
```

### RouteData

```typescript
interface RouteData {
  pickupLocation: Location;
  destinationLocation: Location;
  distance: number; // in meters
  duration: number; // in seconds
  polylinePoints: LatLng[];
  steps: RouteStep[];
}

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}
```

### PricingData

```typescript
interface PricingData {
  baseFare: number;
  distanceCharge: number; // per km
  durationCharge: number; // per minute
  totalDistance: number; // km
  totalDuration: number; // minutes
  subtotal: number;
  tax: number;
  totalPrice: number;
}
```

### Marker

```typescript
interface Marker {
  id: string;
  location: Location;
  type: "pickup" | "destination";
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Location Search Returns Sint Maarten Results

_For any_ search query, all returned locations should have coordinates that fall within the Sint Maarten geographic boundaries (latitude 18.0° to 18.3°N, longitude -63.0° to -62.9°W).

**Validates: Requirements 1.1, 1.3**

### Property 2: Route Polyline Connects Endpoints

_For any_ calculated route with pickup and destination locations, the polyline points should form a continuous path where the first point is within 100 meters of the pickup location and the last point is within 100 meters of the destination location.

**Validates: Requirements 2.2**

### Property 3: Distance and Duration Are Positive

_For any_ valid route calculation, both the distance (in meters) and duration (in seconds) should be positive numbers greater than zero.

**Validates: Requirements 2.3**

### Property 4: Pricing Calculation Consistency

_For any_ route data with the same distance and duration values, calculating pricing multiple times should produce identical pricing results (deterministic calculation).

**Validates: Requirements 3.1**

### Property 5: Pricing Components Sum to Total

_For any_ pricing data, the equation (baseFare + distanceCharge + durationCharge + tax) should equal totalPrice, with no rounding errors exceeding 0.01 currency units.

**Validates: Requirements 3.2**

### Property 6: Route Recalculation on Location Change

_For any_ two different route calculations where at least one location differs, the resulting distance or duration values should be different (or the routes should be identical if locations are the same).

**Validates: Requirements 2.4, 3.4**

### Property 7: Map Marker Positioning

_For any_ selected location, the map marker should be positioned at coordinates that match the selected location's coordinates within 0.0001 degrees (approximately 10 meters).

**Validates: Requirements 1.2, 4.4**

### Property 8: Caching Returns Consistent Results

_For any_ repeated search query or route calculation within a cache validity period, the cached result should be returned without making a new API call, and the result should be identical to the original result.

**Validates: Requirements 5.4**

## Error Handling

- **API Failures**: Display user-friendly error messages when Google Maps API calls fail
- **No Results**: Show "No locations found" message when search returns empty results
- **Invalid Coordinates**: Validate that coordinates are within valid ranges before processing
- **Network Errors**: Implement retry logic with exponential backoff for transient failures
- **Rate Limiting**: Cache results and implement request throttling to respect API quotas

## Testing Strategy

### Unit Testing

- Test pricing calculation logic with various distance/duration combinations
- Test location validation and coordinate bounds checking
- Test data model transformations and formatting
- Test error handling for invalid inputs

### Property-Based Testing

- **Property 1**: Generate random search queries and verify all results are within Sint Maarten bounds
- **Property 2**: Generate random routes and verify polyline connectivity
- **Property 3**: Generate random route data and verify distance/duration are positive
- **Property 4**: Generate random route data and verify pricing consistency across multiple calculations
- **Property 5**: Generate random pricing inputs and verify component summation
- **Property 6**: Generate location pairs, calculate route, modify locations, verify route updates
- **Property 7**: Generate random locations and verify marker positioning

### Testing Framework

- Use **fast-check** for property-based testing (JavaScript/TypeScript)
- Configure each property test to run minimum 100 iterations
- Use Jest for unit testing

### Integration Testing

- Test end-to-end flow: search location → select location → calculate route → display pricing
- Mock Google Maps API responses for consistent testing
- Verify UI updates correctly when data changes
