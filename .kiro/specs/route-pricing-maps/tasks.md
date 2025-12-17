# Implementation Plan: Route Pricing Maps

- [-] 1. Set up Google Maps integration and core infrastructure

  - Install and configure `@react-native-maps/maps` or `react-native-google-maps` package
  - Set up Google Maps API keys for Places, Directions, and Distance Matrix APIs
  - Create environment configuration for API keys (development and production)
  - Create GoogleMapsService wrapper with error handling and request utilities
  - _Requirements: 5.1, 5.2_

- [ ] 2. Implement data models and validation

  - Create TypeScript interfaces for Location, RouteData, RouteStep, PricingData, and Marker
  - Implement location validation functions (coordinate bounds checking for Sint Maarten)
  - Implement pricing data validation functions
  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 2.1 Write property test for location bounds validation

  - **Feature: route-pricing-maps, Property 1: Location Search Returns Sint Maarten Results**
  - **Validates: Requirements 1.1, 1.3**

- [ ] 3. Implement location search functionality

  - Create LocationSearchComponent with text input and result display
  - Implement searchPlaces method in GoogleMapsService using Places API
  - Add Sint Maarten geographic bounds filtering to search results
  - Implement result selection handler that updates parent state
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3.1 Write property test for location search filtering

  - **Feature: route-pricing-maps, Property 1: Location Search Returns Sint Maarten Results**
  - **Validates: Requirements 1.1, 1.3**

- [ ] 4. Implement map display component

  - Create MapComponent that renders Google Map centered on Sint Maarten
  - Implement marker rendering for pickup and destination locations
  - Add map interaction handlers (tap to set location)
  - Implement polyline rendering for route visualization
  - _Requirements: 4.1, 4.3, 4.4_

- [ ] 4.1 Write property test for marker positioning

  - **Feature: route-pricing-maps, Property 7: Map Marker Positioning**
  - **Validates: Requirements 1.2, 4.4**

- [ ] 5. Implement route calculation service

  - Create RouteCalculationService class with calculateRoute method
  - Implement getDirections method in GoogleMapsService using Directions API
  - Parse polyline points from API response
  - Extract distance and duration from route data
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 5.1 Write property test for route polyline connectivity

  - **Feature: route-pricing-maps, Property 2: Route Polyline Connects Endpoints**
  - **Validates: Requirements 2.2**

- [ ] 5.2 Write property test for distance and duration positivity

  - **Feature: route-pricing-maps, Property 3: Distance and Duration Are Positive**
  - **Validates: Requirements 2.3**

- [ ] 6. Implement pricing calculation engine

  - Create pricing calculation logic with base fare, distance charge, and duration charge
  - Implement calculatePricing method in RouteCalculationService
  - Add tax calculation to pricing
  - Ensure pricing is deterministic and consistent
  - _Requirements: 3.1, 3.2_

- [ ] 6.1 Write property test for pricing calculation consistency

  - **Feature: route-pricing-maps, Property 4: Pricing Calculation Consistency**
  - **Validates: Requirements 3.1**

- [ ] 6.2 Write property test for pricing component summation

  - **Feature: route-pricing-maps, Property 5: Pricing Components Sum to Total**
  - **Validates: Requirements 3.2**

- [ ] 7. Implement pricing display component

  - Create PricingDisplayComponent to show pricing breakdown
  - Display base fare, distance charge, duration charge, subtotal, tax, and total
  - Format prices with appropriate currency symbols and decimal places
  - _Requirements: 3.2, 3.3_

- [ ] 8. Implement route update on location change

  - Add state management to track pickup and destination locations
  - Implement automatic route recalculation when either location changes
  - Update pricing when route changes
  - Trigger map updates with new polyline and markers
  - _Requirements: 2.4, 3.4_

- [ ] 8.1 Write property test for route recalculation on location change

  - **Feature: route-pricing-maps, Property 6: Route Recalculation on Location Change**
  - **Validates: Requirements 2.4, 3.4**

- [ ] 9. Implement caching and request optimization

  - Add caching layer to GoogleMapsService for search results and route calculations
  - Implement cache invalidation strategy (time-based or manual)
  - Add request throttling to prevent API rate limiting
  - _Requirements: 5.4_

- [ ] 9.1 Write property test for caching consistency

  - **Feature: route-pricing-maps, Property 8: Caching Returns Consistent Results**
  - **Validates: Requirements 5.4**

- [ ] 10. Implement error handling and user feedback

  - Add error handling for API failures with user-friendly messages
  - Implement "No locations found" message for empty search results
  - Add retry logic with exponential backoff for transient failures
  - Display loading states during API calls
  - _Requirements: 1.4, 5.2_

- [ ] 11. Integrate all components into main ride booking flow

  - Create main RouteAndPricingScreen component that orchestrates all sub-components
  - Wire LocationSearchComponent for pickup location selection
  - Wire LocationSearchComponent for destination location selection
  - Connect MapComponent to display route and markers
  - Connect PricingDisplayComponent to show calculated pricing
  - Add "Confirm Booking" button that passes route and pricing data to next step
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1_

- [ ] 12. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Write unit tests for pricing calculation

  - Test pricing calculation with various distance/duration combinations
  - Test edge cases (zero distance, very long distances, etc.)
  - Test tax calculation accuracy
  - _Requirements: 3.1, 3.2_

- [ ] 14. Write unit tests for location validation

  - Test coordinate bounds checking for Sint Maarten
  - Test invalid coordinate handling
  - Test location data model validation
  - _Requirements: 1.1, 1.3_

- [ ] 15. Write integration tests for end-to-end flow

  - Test complete flow: search location → select pickup → search location → select destination → view route → view pricing
  - Mock Google Maps API responses for consistent testing
  - Verify UI updates correctly when data changes
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2_

- [ ] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
