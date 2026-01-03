# Functional Requirements Document (FRD)
## RoraExpo - Ride Booking Mobile Application

**Version:** 1.0
**Date:** 2025-12-22
**Author:** Claude Code Analysis
**Status:** Draft for Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Functional Requirements by Module](#3-functional-requirements-by-module)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Data Requirements](#5-data-requirements)
6. [Integration Requirements](#6-integration-requirements)
7. [Platform Requirements](#7-platform-requirements)
8. [Implementation Status](#8-implementation-status)
9. [Gap Analysis](#9-gap-analysis)
10. [Appendix](#10-appendix)

---

## 1. Executive Summary

### 1.1 Purpose
This document defines the complete functional requirements for **RoraExpo**, a mobile ride-booking application that enables users to discover venues, plan routes, book rides with drivers, and manage their trip history.

### 1.2 Scope
This FRD covers:
- All user-facing features and workflows
- Backend/API integration requirements
- Data storage and persistence needs
- Platform-specific requirements (iOS/Android)
- Current implementation status and gaps

### 1.3 Target Users
- **Primary Users:** Passengers looking to book rides in Sint Maarten
- **Secondary Users:** Drivers (future scope - driver app not in current scope)

### 1.4 Success Criteria
The app is considered complete when:
1. Users can book a ride end-to-end (origin → destination → driver assignment → active ride → completion)
2. All trip data persists across app restarts
3. Users can create accounts and authenticate
4. App handles offline scenarios gracefully
5. App meets iOS App Store and Google Play Store requirements

---

## 2. Product Overview

### 2.1 Product Vision
RoraExpo is a ride-booking platform for Sint Maarten that combines venue discovery with ride booking, making it easy for users to explore local destinations and book rides to get there.

### 2.2 Core Value Propositions
1. **Discover + Book:** Browse venues and book rides in one app
2. **Transparent Pricing:** Upfront price calculation before booking
3. **Saved Preferences:** Remember favorite drivers and locations
4. **Trip History:** Track and review all rides

### 2.3 Key Features
1. Location Services & GPS Tracking
2. Route Planning & Price Estimation
3. Venue Discovery & Exploration
4. Driver Directory & Profiles
5. Ride Booking & Management
6. Trip History & Analytics
7. User Profile & Settings
8. Saved Locations Management
9. Favorite Drivers

---

## 3. Functional Requirements by Module

---

## 3.1 Location Services

### 3.1.1 Permission Management

**FR-LOC-001: Permission Request Flow**
- **Priority:** P0 (Critical)
- **Status:** ✅ Implemented
- **Description:** The app MUST request location permissions before accessing GPS
- **Requirements:**
  - FR-LOC-001.1: Display custom permission modal with clear explanation BEFORE system prompt
  - FR-LOC-001.2: Modal MUST explain why location is needed and what it's used for
  - FR-LOC-001.3: Provide two options: "Allow Location Access" and "Enter Manually"
  - FR-LOC-001.4: Only trigger system permission dialog after user taps "Allow"
  - FR-LOC-001.5: If user taps "Enter Manually", navigate to route-input for manual location selection
  - FR-LOC-001.6: Handle all permission states: undetermined, granted, denied, restricted
  - FR-LOC-001.7: Never show custom modal more than once per session
- **User Flow:**
  1. App launches for first time
  2. Check permission status
  3. If undetermined → Show custom modal
  4. User taps "Allow" → Request system permission
  5. If granted → Start GPS tracking
  6. If denied → Allow manual entry
- **Acceptance Criteria:**
  - Modal appears before system prompt
  - Permission status persists across app restarts
  - Manual entry works when permission denied

---

**FR-LOC-002: GPS Tracking**
- **Priority:** P0 (Critical)
- **Status:** ✅ Implemented
- **Description:** The app MUST track user's real-time location when permission granted
- **Requirements:**
  - FR-LOC-002.1: Use expo-location for GPS access
  - FR-LOC-002.2: Accuracy level: Balanced (not high precision to save battery)
  - FR-LOC-002.3: Update interval: Every 10 seconds OR 50 meters (whichever comes first)
  - FR-LOC-002.4: Track continuously while app is in foreground
  - FR-LOC-002.5: Stop tracking when app is backgrounded
  - FR-LOC-002.6: Resume tracking when app returns to foreground
  - FR-LOC-002.7: Display user's location on map with blue dot marker
  - FR-LOC-002.8: Auto-center map on user's location on initial load
- **Data Requirements:**
  - Store: latitude, longitude (LatLng type)
  - Update location store on every GPS update
- **Performance:**
  - GPS acquisition: < 5 seconds in normal conditions
  - Battery impact: Minimal (balanced accuracy mode)
- **Acceptance Criteria:**
  - User location updates in real-time on map
  - Location tracking stops when app backgrounded
  - No excessive battery drain

---

**FR-LOC-003: Reverse Geocoding**
- **Priority:** P0 (Critical)
- **Status:** ✅ Implemented
- **Description:** The app MUST convert GPS coordinates to human-readable addresses
- **Requirements:**
  - FR-LOC-003.1: Use expo-location reverseGeocodeAsync
  - FR-LOC-003.2: Trigger reverse geocoding after GPS position acquired
  - FR-LOC-003.3: Extract formatted address components: street, city, region
  - FR-LOC-003.4: Display formatted address in Home screen location card
  - FR-LOC-003.5: If reverse geocoding fails, show "Current Location" as fallback
  - FR-LOC-003.6: Cache formatted address until next GPS update
- **Example Output:**
  - "123 Main Street, Philipsburg"
  - "Airport Road, Simpson Bay"
  - "Current Location" (fallback)
- **Acceptance Criteria:**
  - Address appears within 2 seconds of GPS lock
  - Address updates when user moves to new location
  - Fallback text shows if geocoding fails

---

**FR-LOC-004: Location Persistence**
- **Priority:** P0 (Critical)
- **Status:** ✅ Implemented
- **Description:** The app MUST persist user's last known location across app restarts
- **Requirements:**
  - FR-LOC-004.1: Save location data to AsyncStorage on every update
  - FR-LOC-004.2: Storage key: `@rora/location`
  - FR-LOC-004.3: Persisted data includes:
    - currentLocation (latitude, longitude)
    - formattedAddress (string)
    - permissionGranted (boolean)
    - permissionStatus (enum)
  - FR-LOC-004.4: Hydrate location store from AsyncStorage on app launch
  - FR-LOC-004.5: If no persisted data, show permission modal
  - FR-LOC-004.6: If persisted data exists, display immediately while fetching fresh GPS
- **Storage Format:**
  ```json
  {
    "currentLocation": { "latitude": 18.0425, "longitude": -63.0548 },
    "formattedAddress": "Main Street, Philipsburg",
    "permissionGranted": true,
    "permissionStatus": "granted"
  }
  ```
- **Acceptance Criteria:**
  - Last location shows immediately on app launch
  - Location updates replace persisted data
  - No location data loss on app restart

---

**FR-LOC-005: Manual Location Entry**
- **Priority:** P1 (High)
- **Status:** ⚠️ Partial (route-input screen exists, but not integrated as location fallback)
- **Description:** The app MUST allow users to manually select their location if GPS is unavailable or denied
- **Requirements:**
  - FR-LOC-005.1: Provide "Enter Manually" button in permission modal
  - FR-LOC-005.2: Navigate to route-input screen for location search
  - FR-LOC-005.3: Use Google Places Autocomplete for location search
  - FR-LOC-005.4: Save selected location to location store
  - FR-LOC-005.5: Return to Home screen after selection
  - FR-LOC-005.6: Show manual location on map with marker
  - FR-LOC-005.7: Display indicator that location is manual (not GPS)
- **Acceptance Criteria:**
  - Manual location selectable via autocomplete
  - Manual location persists across restarts
  - Map displays manual location correctly

---

### 3.1.2 Map Display

**FR-LOC-006: Interactive Map View**
- **Priority:** P0 (Critical)
- **Status:** ✅ Implemented
- **Description:** The app MUST display an interactive map on the Home screen
- **Requirements:**
  - FR-LOC-006.1: Use react-native-maps with Google Maps provider
  - FR-LOC-006.2: Map fills entire Home screen (full-screen map)
  - FR-LOC-006.3: Display user's current location with blue dot marker
  - FR-LOC-006.4: Support gestures: pan, zoom, rotate
  - FR-LOC-006.5: Initial zoom level: City level (~12-14)
  - FR-LOC-006.6: Map region centered on Sint Maarten (18.0425, -63.0548)
  - FR-LOC-006.7: Support light mode map styling
- **Map Features:**
  - User location marker (blue dot)
  - Venue markers (future)
  - Route polylines (in route planning screens)
  - Custom marker icons for pickup/dropoff
- **Acceptance Criteria:**
  - Map loads within 2 seconds
  - Gestures are responsive
  - User location marker appears when GPS available

---

## 3.2 Route Planning

### 3.2.1 Route Input

**FR-ROUTE-001: Origin/Destination Selection**
- **Priority:** P0 (Critical)
- **Status:** ✅ Implemented
- **Description:** Users MUST be able to search and select origin and destination locations
- **Requirements:**
  - FR-ROUTE-001.1: Provide two input fields: Origin and Destination
  - FR-ROUTE-001.2: Pre-fill Origin with current location by default
  - FR-ROUTE-001.3: Display autocomplete suggestions as user types (Google Places Autocomplete)
  - FR-ROUTE-001.4: Debounce search input (350ms) to avoid excessive API calls
  - FR-ROUTE-001.5: Highlight matching text in autocomplete results
  - FR-ROUTE-001.6: Bias search results to Sint Maarten region (country:sx filter)
  - FR-ROUTE-001.7: Limit search radius to 50km from Sint Maarten center
  - FR-ROUTE-001.8: Display loading spinner while fetching suggestions
  - FR-ROUTE-001.9: Show empty state if no results found
  - FR-ROUTE-001.10: Allow clearing input to start new search
- **Autocomplete Result Format:**
  - Main text (e.g., "Princess Juliana Airport")
  - Secondary text (e.g., "Airport Road, Simpson Bay")
  - Place ID (for fetching full details)
- **User Flow:**
  1. User taps origin field
  2. Keyboard opens
  3. User types "airport"
  4. Wait 350ms (debounce)
  5. Fetch autocomplete suggestions
  6. Display results below input
  7. User taps suggestion
  8. Origin field updates with selected location
  9. Repeat for destination
- **Acceptance Criteria:**
  - Autocomplete returns relevant results within 1 second
  - Matching text is highlighted
  - Empty state shows when no results

---

**FR-ROUTE-002: Swap Origin/Destination**
- **Priority:** P2 (Nice to Have)
- **Status:** ✅ Implemented
- **Description:** Users SHOULD be able to swap origin and destination with one tap
- **Requirements:**
  - FR-ROUTE-002.1: Display swap button between origin and destination fields
  - FR-ROUTE-002.2: Swap button shows icon (up/down arrows or swap symbol)
  - FR-ROUTE-002.3: Tapping swap exchanges origin and destination values
  - FR-ROUTE-002.4: Clear route data after swap (must recalculate)
  - FR-ROUTE-002.5: Provide haptic feedback on swap
- **Acceptance Criteria:**
  - Values swap instantly
  - Route clears after swap
  - Haptic feedback fires

---

**FR-ROUTE-003: Route Calculation**
- **Priority:** P0 (Critical)
- **Status:** ✅ Implemented
- **Description:** The app MUST calculate the optimal route between origin and destination
- **Requirements:**
  - FR-ROUTE-003.1: Use Google Directions API via Cloud Run proxy
  - FR-ROUTE-003.2: Mode: driving (car)
  - FR-ROUTE-003.3: Request full route details including:
    - Distance (meters)
    - Duration (seconds)
    - Polyline encoding (for map display)
    - Turn-by-turn directions (steps)
  - FR-ROUTE-003.4: Trigger calculation after both origin and destination selected
  - FR-ROUTE-003.5: Show loading state during calculation
  - FR-ROUTE-003.6: Display error message if calculation fails
  - FR-ROUTE-003.7: Cache route data in route store
  - FR-ROUTE-003.8: Navigate to trip-preview after successful calculation
- **Calculation Triggers:**
  - User taps "Continue" button (both locations selected)
  - User selects venue from Explore (auto-calculate from current location to venue)
- **Error Handling:**
  - Network error → "Unable to calculate route. Check your connection."
  - No route found → "No route found between these locations."
  - API error → "Route calculation failed. Please try again."
- **Acceptance Criteria:**
  - Route calculates within 3 seconds (normal conditions)
  - Distance and duration are accurate
  - Polyline displays correctly on map

---

**FR-ROUTE-004: Price Calculation**
- **Priority:** P0 (Critical)
- **Status:** ✅ Implemented
- **Description:** The app MUST calculate trip price based on distance and duration
- **Requirements:**
  - FR-ROUTE-004.1: Calculate price using formula:
    ```
    Base Fare + (Distance in km × Price per km) + (Duration in min × Price per min)
    ```
  - FR-ROUTE-004.2: Default pricing:
    - Base Fare: $5.00
    - Price per km: $2.00
    - Price per min: $0.50
  - FR-ROUTE-004.3: Round price to 2 decimal places
  - FR-ROUTE-004.4: Display price in USD ($)
  - FR-ROUTE-004.5: Show price breakdown (optional tooltip/modal)
  - FR-ROUTE-004.6: Price MUST be calculated before navigating to trip-preview
- **Example:**
  - Distance: 10 km
  - Duration: 20 min
  - Price: $5 + (10 × $2) + (20 × $0.50) = $5 + $20 + $10 = **$35.00**
- **Future Enhancement:**
  - Dynamic pricing based on demand, time of day, driver rates
- **Acceptance Criteria:**
  - Price calculation is accurate
  - Price displays immediately after route calculation
  - Price format: $XX.XX

---

**FR-ROUTE-005: Map Visualization**
- **Priority:** P0 (Critical)
- **Status:** ✅ Implemented
- **Description:** The app MUST display the calculated route on a map
- **Requirements:**
  - FR-ROUTE-005.1: Decode polyline from Google Directions response
  - FR-ROUTE-005.2: Display route as blue polyline on map
  - FR-ROUTE-005.3: Show origin marker (green pin)
  - FR-ROUTE-005.4: Show destination marker (red pin)
  - FR-ROUTE-005.5: Auto-fit map bounds to show full route
  - FR-ROUTE-005.6: Display distance and duration below map
  - FR-ROUTE-005.7: Update map when route changes
- **Map Elements:**
  - Polyline: Blue, stroke width 3-4px
  - Origin marker: Green circle or pin
  - Destination marker: Red circle or pin
- **Acceptance Criteria:**
  - Full route visible on map
  - Markers correctly positioned
  - Polyline follows roads

---

### 3.2.2 Trip Preview

**FR-ROUTE-006: Trip Details Display**
- **Priority:** P0 (Critical)
- **Status:** ✅ Implemented
- **Description:** Users MUST be able to review trip details before booking
- **Requirements:**
  - FR-ROUTE-006.1: Display route visualization (map with polyline)
  - FR-ROUTE-006.2: Show trip metrics:
    - Origin address
    - Destination address
    - Distance (e.g., "12.5 km")
    - Duration (e.g., "25 min")
    - Price (e.g., "$35.00")
  - FR-ROUTE-006.3: Display scheduled time (if applicable)
  - FR-ROUTE-006.4: Provide "Save Trip" button
  - FR-ROUTE-006.5: Provide "Find Driver" button (NOT IMPLEMENTED)
  - FR-ROUTE-006.6: Auto-save trip to trip history on screen mount
  - FR-ROUTE-006.7: Initial trip status: 'not_taken'
- **User Flow:**
  1. Route calculated
  2. Navigate to trip-preview
  3. Trip auto-saved to history (status: 'not_taken')
  4. User reviews details
  5. User taps "Save Trip" → Trip.saved = true, navigate to Home
  6. OR User taps "Find Driver" → Navigate to driver search flow (NOT IMPLEMENTED)
- **Acceptance Criteria:**
  - All trip details display correctly
  - Trip auto-saves to history
  - "Save Trip" updates saved flag

---

**FR-ROUTE-007: QR Code Generation**
- **Priority:** P1 (High)
- **Status:** ✅ Implemented
- **Description:** The app SHOULD generate a QR code for trip verification
- **Requirements:**
  - FR-ROUTE-007.1: Generate QR code containing trip ID
  - FR-ROUTE-007.2: Display QR code on Page 2 of trip-preview
  - FR-ROUTE-007.3: QR code size: 200x200px
  - FR-ROUTE-007.4: Support swipe gesture to switch between Page 1 (details) and Page 2 (QR)
  - FR-ROUTE-007.5: Display page indicator dots (1 active, 2 inactive)
  - FR-ROUTE-007.6: QR code scannable by driver app (future)
- **QR Code Data:**
  ```json
  {
    "tripId": "trip-1234567890",
    "passengerId": "user-123",
    "timestamp": 1234567890000
  }
  ```
- **Acceptance Criteria:**
  - QR code generates successfully
  - QR code is scannable
  - Swipe gesture works smoothly

---

**FR-ROUTE-008: Trip Saving**
- **Priority:** P0 (Critical)
- **Status:** ⚠️ Partial (saves to store, but NO PERSISTENCE)
- **Description:** Users MUST be able to save trips for later booking
- **Requirements:**
  - FR-ROUTE-008.1: Provide "Save Trip" button
  - FR-ROUTE-008.2: Update trip.saved = true
  - FR-ROUTE-008.3: Show toast notification "Trip saved successfully"
  - FR-ROUTE-008.4: Provide haptic feedback on save
  - FR-ROUTE-008.5: Navigate to Home after save
  - FR-ROUTE-008.6: Persist saved trips to storage (NOT IMPLEMENTED - CRITICAL)
  - FR-ROUTE-008.7: Saved trips accessible from Trip History → Filter: Saved
- **Critical Issue:**
  - Currently saves to in-memory store only
  - All saved trips lost on app restart
  - MUST implement AsyncStorage or backend persistence
- **Acceptance Criteria:**
  - Saved trips persist across app restarts
  - Saved trips appear in Trip History (Saved filter)
  - Toast and haptic feedback work

---

## 3.3 Venue Discovery

### 3.3.1 Explore Home

**FR-EXPLORE-001: Search Venues**
- **Priority:** P1 (High)
- **Status:** ✅ Implemented
- **Description:** Users SHOULD be able to search for venues by name or type
- **Requirements:**
  - FR-EXPLORE-001.1: Provide search bar at top of Explore screen
  - FR-EXPLORE-001.2: Debounce search input (300ms)
  - FR-EXPLORE-001.3: Search both venue names and categories
  - FR-EXPLORE-001.4: Display search results in two sections:
    - Matching venues
    - Matching categories
  - FR-EXPLORE-001.5: Highlight matching text in results
  - FR-EXPLORE-001.6: Show "Cancel" button to exit search mode
  - FR-EXPLORE-001.7: Show empty state if no results
  - FR-EXPLORE-001.8: Clear search when Cancel tapped
- **Search Examples:**
  - Query: "beach" → Results: Beach Bar, Beach Hotel, Beach category
  - Query: "restaurant" → Results: All restaurants + Restaurant category
- **Acceptance Criteria:**
  - Search returns results within 1 second
  - Results are relevant to query
  - Cancel clears search

---

**FR-EXPLORE-002: Browse Categories**
- **Priority:** P1 (High)
- **Status:** ✅ Implemented
- **Description:** Users SHOULD be able to browse venues by category
- **Requirements:**
  - FR-EXPLORE-002.1: Display 6 categories:
    - Restaurants
    - Cafes
    - Bars
    - Shopping
    - Entertainment
    - Hotels
  - FR-EXPLORE-002.2: Each category has icon and label
  - FR-EXPLORE-002.3: Categories displayed as grid (2 columns on mobile)
  - FR-EXPLORE-002.4: Tapping category navigates to category listing page
  - FR-EXPLORE-002.5: Category page shows all venues in that category
- **Category Icons:**
  - Restaurants: Utensils icon
  - Cafes: Coffee cup icon
  - Bars: Martini glass icon
  - Shopping: Shopping bag icon
  - Entertainment: Film reel icon
  - Hotels: Hotel building icon
- **Acceptance Criteria:**
  - All 6 categories display
  - Tapping category navigates correctly
  - Icons are clear and recognizable

---

**FR-EXPLORE-003: Featured Venues Carousel**
- **Priority:** P2 (Nice to Have)
- **Status:** ✅ Implemented
- **Description:** The app SHOULD highlight featured venues in a carousel
- **Requirements:**
  - FR-EXPLORE-003.1: Display featured carousel below categories
  - FR-EXPLORE-003.2: Horizontal scrolling
  - FR-EXPLORE-003.3: Show 4-6 featured venues
  - FR-EXPLORE-003.4: Each card shows:
    - Venue image
    - Name
    - Category
    - Rating (stars)
  - FR-EXPLORE-003.5: Tapping card navigates to venue detail
  - FR-EXPLORE-003.6: Provide "See all" link to featured page
- **Acceptance Criteria:**
  - Carousel scrolls smoothly
  - Cards are visually appealing
  - "See all" navigates correctly

---

**FR-EXPLORE-004: Nearby Venues**
- **Priority:** P1 (High)
- **Status:** ✅ Implemented
- **Description:** Users SHOULD see venues near their current location
- **Requirements:**
  - FR-EXPLORE-004.1: Calculate distance from user's location to each venue
  - FR-EXPLORE-004.2: Sort venues by distance (nearest first)
  - FR-EXPLORE-004.3: Display distance on each venue card (e.g., "2.3 km away")
  - FR-EXPLORE-004.4: Update distances when user's location changes
  - FR-EXPLORE-004.5: Show "Nearby" section below featured carousel
  - FR-EXPLORE-004.6: List view (not carousel)
  - FR-EXPLORE-004.7: Each card shows:
    - Venue image
    - Name
    - Category
    - Distance
    - Rating
- **Acceptance Criteria:**
  - Distances are accurate
  - List updates when location changes
  - Venues sorted by proximity

---

### 3.3.2 Category Listing

**FR-EXPLORE-005: Filter Venues**
- **Priority:** P2 (Nice to Have)
- **Status:** ✅ Implemented
- **Description:** Users SHOULD be able to filter venues within a category
- **Requirements:**
  - FR-EXPLORE-005.1: Provide filter chips:
    - Top Rated (rating >= 4.5)
    - Near Me (distance <= 5km)
    - Quiet (ambiance = quiet)
  - FR-EXPLORE-005.2: Multiple filters can be active simultaneously
  - FR-EXPLORE-005.3: Filter chips toggle on/off on tap
  - FR-EXPLORE-005.4: Show filtered count (e.g., "12 venues")
  - FR-EXPLORE-005.5: Show empty state if no venues match filters
  - FR-EXPLORE-005.6: Provide "Reset Filters" button in empty state
- **Filter Logic:**
  - AND logic (all active filters must match)
  - Example: Top Rated AND Near Me → Only venues with rating >= 4.5 AND distance <= 5km
- **Acceptance Criteria:**
  - Filters work correctly
  - Empty state shows when no results
  - Reset clears all filters

---

**FR-EXPLORE-006: Pull to Refresh**
- **Priority:** P2 (Nice to Have)
- **Status:** ✅ Implemented
- **Description:** Users SHOULD be able to refresh venue listings
- **Requirements:**
  - FR-EXPLORE-006.1: Support pull-to-refresh gesture
  - FR-EXPLORE-006.2: Show loading indicator during refresh
  - FR-EXPLORE-006.3: Re-fetch venue data (or reload from cache)
  - FR-EXPLORE-006.4: Refresh completes within 2 seconds
- **Acceptance Criteria:**
  - Pull-to-refresh works
  - Loading indicator shows
  - List updates after refresh

---

### 3.3.3 Venue Detail

**FR-EXPLORE-007: Venue Information Display**
- **Priority:** P1 (High)
- **Status:** ✅ Implemented
- **Description:** Users SHOULD be able to view detailed venue information
- **Requirements:**
  - FR-EXPLORE-007.1: Display venue on map with marker
  - FR-EXPLORE-007.2: Show venue details:
    - Name
    - Category
    - Rating (stars) + review count
    - Description
    - Photos (carousel)
    - Amenities (icons + labels)
    - Hours (if available)
    - Contact info (phone, website)
  - FR-EXPLORE-007.3: Display distance from user's location
  - FR-EXPLORE-007.4: Provide "Get a Ride" button (primary CTA)
  - FR-EXPLORE-007.5: Allow sharing venue (future)
  - FR-EXPLORE-007.6: Allow saving venue to favorites (future)
- **Amenities Examples:**
  - WiFi, Outdoor Seating, Parking, Kid-Friendly, Pet-Friendly
- **Acceptance Criteria:**
  - All venue info displays correctly
  - Map shows venue marker
  - "Get a Ride" button works

---

**FR-EXPLORE-008: Get a Ride from Venue**
- **Priority:** P0 (Critical)
- **Status:** ⚠️ Partial (calculates route, but booking flow incomplete)
- **Description:** Users MUST be able to book a ride to a venue
- **Requirements:**
  - FR-EXPLORE-008.1: Provide "Get a Ride" button on venue detail
  - FR-EXPLORE-008.2: Tapping button opens RideCtaSheet (bottom sheet)
  - FR-EXPLORE-008.3: Bottom sheet shows:
    - Origin: Current location
    - Destination: Venue address
    - Estimated price
  - FR-EXPLORE-008.4: Provide "Get Official Quote & View Drivers" button
  - FR-EXPLORE-008.5: Tapping button calculates exact route
  - FR-EXPLORE-008.6: Navigate to trip-preview
  - FR-EXPLORE-008.7: Trip origin = current location
  - FR-EXPLORE-008.8: Trip destination = venue location
- **User Flow:**
  1. User views venue detail
  2. User taps "Get a Ride"
  3. Bottom sheet opens
  4. User sees price estimate
  5. User taps "Get Official Quote & View Drivers"
  6. Route calculated
  7. Navigate to trip-preview
  8. [Continue in booking flow - INCOMPLETE]
- **Acceptance Criteria:**
  - Bottom sheet displays correctly
  - Price estimate is accurate
  - Route calculation works

---

## 3.4 Driver Management

### 3.4.1 Driver Directory

**FR-DRIVER-001: Browse Drivers**
- **Priority:** P0 (Critical)
- **Status:** ✅ Implemented
- **Description:** Users MUST be able to browse available drivers
- **Requirements:**
  - FR-DRIVER-001.1: Display list of all drivers
  - FR-DRIVER-001.2: Each driver card shows:
    - Avatar (placeholder)
    - Name
    - Rating (stars)
    - Status badge (On Duty / Off Duty)
  - FR-DRIVER-001.3: Provide filter tabs:
    - All
    - On Duty
    - Off Duty
  - FR-DRIVER-001.4: Filter tabs update list in real-time
  - FR-DRIVER-001.5: Tapping driver card navigates to driver detail
  - FR-DRIVER-001.6: Sort drivers by status (On Duty first) then rating
- **Mock Data:**
  - 8 drivers with varied status and ratings
  - Data in: `src/features/drivers/data/drivers.ts`
- **Acceptance Criteria:**
  - All drivers display
  - Filters work correctly
  - Tapping card navigates to detail

---

**FR-DRIVER-002: Driver Status Indicators**
- **Priority:** P1 (High)
- **Status:** ✅ Implemented
- **Description:** The app SHOULD clearly indicate driver availability
- **Requirements:**
  - FR-DRIVER-002.1: Display status badge on driver card
  - FR-DRIVER-002.2: Badge colors:
    - On Duty: Green background
    - Off Duty: Gray background
  - FR-DRIVER-002.3: Badge text: "On Duty" or "Off Duty"
  - FR-DRIVER-002.4: Disable "Book Ride" button when driver is Off Duty
  - FR-DRIVER-002.5: Show tooltip "Driver is currently unavailable" when booking disabled
- **Acceptance Criteria:**
  - Status badges display correctly
  - Colors match design system
  - Booking disabled for Off Duty drivers

---

### 3.4.2 Driver Detail

**FR-DRIVER-003: Driver Profile Display**
- **Priority:** P1 (High)
- **Status:** ✅ Implemented
- **Description:** Users SHOULD be able to view driver profiles
- **Requirements:**
  - FR-DRIVER-003.1: Display driver information:
    - Large avatar
    - Full name
    - Rating (stars) + review count
    - Status badge (On/Off Duty)
    - Years of experience
    - Languages spoken
    - Bio
  - FR-DRIVER-003.2: Display contact section:
    - Phone number
    - Email address
  - FR-DRIVER-003.3: Display vehicle section:
    - Vehicle type (e.g., Sedan, SUV)
    - Make and model
    - License plate
    - Color
  - FR-DRIVER-003.4: Provide "Book Ride" button (primary CTA)
  - FR-DRIVER-003.5: Provide call/email quick actions
- **Acceptance Criteria:**
  - All driver info displays
  - Contact actions work
  - "Book Ride" button present

---

**FR-DRIVER-004: Contact Driver**
- **Priority:** P2 (Nice to Have)
- **Status:** ⚠️ Partial (alert placeholders, not functional)
- **Description:** Users SHOULD be able to contact drivers directly
- **Requirements:**
  - FR-DRIVER-004.1: Provide "Call" button → Opens phone dialer with driver's number
  - FR-DRIVER-004.2: Provide "Email" button → Opens email client with driver's email
  - FR-DRIVER-004.3: Use Linking.openURL for external app intents
  - FR-DRIVER-004.4: Handle errors if phone/email app not available
  - FR-DRIVER-004.5: Show confirmation before initiating contact (optional)
- **Platform Behaviors:**
  - iOS: Opens Phone app or Mail app
  - Android: Shows app picker if multiple apps available
- **Current Status:**
  - Favorite Drivers screen shows alerts instead of actual contact
  - Driver detail has call/email in contact section but not implemented
- **Acceptance Criteria:**
  - Call opens phone dialer
  - Email opens email client
  - Error handling works

---

**FR-DRIVER-005: Book Ride with Specific Driver**
- **Priority:** P0 (Critical)
- **Status:** ❌ Not Implemented (CODE BUG: just routes to /route-input)
- **Description:** Users MUST be able to book a ride with a specific driver
- **Requirements:**
  - FR-DRIVER-005.1: Provide "Book Ride" button on driver detail
  - FR-DRIVER-005.2: Show alert with two options:
    - "New Ride" → Create new route
    - "Not Taken Ride" → Assign driver to existing saved trip
  - FR-DRIVER-005.3: If "New Ride":
    - Navigate to /route-input
    - User selects origin/destination
    - Route calculated
    - Navigate to trip-preview
    - Trip created with driverId pre-assigned
  - FR-DRIVER-005.4: If "Not Taken Ride":
    - Navigate to /trip-selector (NOT IMPLEMENTED)
    - Display list of saved trips with status 'not_taken'
    - User selects trip
    - Update trip: status = 'pending', driverId = driver.id
    - Navigate to /trip-qr/[id] (NOT IMPLEMENTED)
  - FR-DRIVER-005.5: Disable "Book Ride" when driver is Off Duty
- **Current Code Issue:**
  - `app/driver/[id].tsx` line 60-62:
    ```typescript
    const handleBookRide = () => {
      router.push('/route-input');
    };
    ```
  - Expected alert logic commented out in design docs
- **Critical Missing Screens:**
  - `/trip-selector.tsx` - List of saved trips
  - `/trip-qr/[id].tsx` - QR code for driver verification
- **Acceptance Criteria:**
  - Alert shows two options
  - "New Ride" flow works end-to-end
  - "Not Taken Ride" assigns driver correctly

---

### 3.4.3 Favorite Drivers

**FR-DRIVER-006: Add to Favorites**
- **Priority:** P2 (Nice to Have)
- **Status:** ❌ Not Implemented
- **Description:** Users SHOULD be able to mark drivers as favorites
- **Requirements:**
  - FR-DRIVER-006.1: Provide star/heart icon on driver detail screen
  - FR-DRIVER-006.2: Icon toggles between filled (favorited) and outline (not favorited)
  - FR-DRIVER-006.3: Tapping icon adds/removes driver from favorites
  - FR-DRIVER-006.4: Show toast "Added to favorites" or "Removed from favorites"
  - FR-DRIVER-006.5: Provide haptic feedback
  - FR-DRIVER-006.6: Persist favorites to storage
- **Current Status:**
  - favorite-drivers-store exists
  - Favorite Drivers screen exists
  - NO "Add to Favorites" button in driver detail screen
- **Acceptance Criteria:**
  - Star icon toggles correctly
  - Toast and haptic work
  - Favorites persist across restarts

---

**FR-DRIVER-007: View Favorite Drivers**
- **Priority:** P2 (Nice to Have)
- **Status:** ✅ Implemented (UI only, no persistence)
- **Description:** Users SHOULD be able to view their favorite drivers
- **Requirements:**
  - FR-DRIVER-007.1: Provide "Favorite Drivers" link in Profile
  - FR-DRIVER-007.2: Navigate to /favorite-drivers
  - FR-DRIVER-007.3: Display list of favorite drivers
  - FR-DRIVER-007.4: Each card shows:
    - Avatar
    - Name
    - Rating
    - Status badge
    - Vehicle info
    - Languages
    - Bio preview
    - Star icon (to remove from favorites)
  - FR-DRIVER-007.5: Provide quick actions:
    - Call
    - Message
    - Book Ride
  - FR-DRIVER-007.6: Show empty state if no favorites
  - FR-DRIVER-007.7: Empty state has "Browse All Drivers" button
- **Acceptance Criteria:**
  - Favorite drivers display correctly
  - Star icon removes from list
  - Empty state shows when no favorites

---

**FR-DRIVER-008: Remove from Favorites**
- **Priority:** P2 (Nice to Have)
- **Status:** ✅ Implemented
- **Description:** Users SHOULD be able to remove drivers from favorites
- **Requirements:**
  - FR-DRIVER-008.1: Provide star icon on favorite driver card
  - FR-DRIVER-008.2: Tapping star shows confirmation alert
  - FR-DRIVER-008.3: Alert message: "Remove [Driver Name] from favorites?"
  - FR-DRIVER-008.4: Alert buttons: "Cancel" and "Remove"
  - FR-DRIVER-008.5: "Remove" removes driver from favorites list
  - FR-DRIVER-008.6: Card animates out of list
  - FR-DRIVER-008.7: Update favorites count
- **Acceptance Criteria:**
  - Confirmation alert shows
  - "Remove" removes driver
  - List updates immediately

---

## 3.5 Trip Management

### 3.5.1 Trip History

**FR-TRIP-001: View Trip History**
- **Priority:** P0 (Critical)
- **Status:** ✅ Implemented (UI only, NO PERSISTENCE)
- **Description:** Users MUST be able to view all past and saved trips
- **Requirements:**
  - FR-TRIP-001.1: Provide "Trip History" link in Profile
  - FR-TRIP-001.2: Navigate to /trip-history
  - FR-TRIP-001.3: Display list of all trips, newest first
  - FR-TRIP-001.4: Each trip card shows:
    - Route (origin → destination with icons)
    - Distance, duration, price
    - Status badge (color-coded)
    - Date/time
    - Driver name (if assigned)
    - Bookmark icon (if saved)
  - FR-TRIP-001.5: Provide filter tabs:
    - All
    - Not Taken
    - Pending
    - In Progress
    - Completed
    - Cancelled
    - Saved
  - FR-TRIP-001.6: Filter tabs update list in real-time
  - FR-TRIP-001.7: Show empty state if no trips match filter
  - FR-TRIP-001.8: Tapping trip card navigates to trip detail (NOT IMPLEMENTED)
- **Status Badge Colors:**
  - Not Taken: Gray (neutral)
  - Pending: Orange (warning)
  - In Progress: Blue (primary)
  - Completed: Green (success)
  - Cancelled: Red (danger)
- **Critical Issue:**
  - **NO PERSISTENCE** - All trips lost on app restart
  - Must implement AsyncStorage or backend persistence
- **Acceptance Criteria:**
  - All trips display correctly
  - Filters work
  - Trips persist across restarts (MISSING)

---

**FR-TRIP-002: Trip Status Lifecycle**
- **Priority:** P0 (Critical)
- **Status:** ⚠️ Partial (store supports statuses, but no transitions implemented)
- **Description:** Trips MUST transition through defined statuses
- **Requirements:**
  - FR-TRIP-002.1: Trip status enum:
    - `not_taken`: Trip created, no driver assigned
    - `pending`: Driver assigned, waiting for pickup
    - `in_progress`: Driver en route or passenger on board
    - `completed`: Trip finished successfully
    - `cancelled`: Trip cancelled by passenger or driver
  - FR-TRIP-002.2: Status transitions:
    - `not_taken` → `pending` (when driver assigned)
    - `pending` → `in_progress` (when driver arrives/trip starts)
    - `in_progress` → `completed` (when trip ends)
    - `not_taken` → `cancelled` (user cancels before booking)
    - `pending` → `cancelled` (user/driver cancels after booking)
  - FR-TRIP-002.3: Store status change timestamp
  - FR-TRIP-002.4: Show status history (optional)
  - FR-TRIP-002.5: Disable status changes in wrong direction (e.g., completed → pending)
- **Current Status:**
  - trip-history-store supports statuses
  - updateTripStatus() method exists
  - **NO UI for status transitions** (except auto-set to 'not_taken' on creation)
- **Acceptance Criteria:**
  - Status transitions follow lifecycle
  - Timestamps recorded
  - Invalid transitions prevented

---

**FR-TRIP-003: Save Trip for Later**
- **Priority:** P1 (High)
- **Status:** ✅ Implemented (NO PERSISTENCE)
- **Description:** Users SHOULD be able to bookmark trips for quick access
- **Requirements:**
  - FR-TRIP-003.1: Provide "Save Trip" button in trip-preview
  - FR-TRIP-003.2: Provide bookmark icon on trip history cards
  - FR-TRIP-003.3: Tapping bookmark toggles saved status
  - FR-TRIP-003.4: Saved trips have filled bookmark icon
  - FR-TRIP-003.5: Non-saved trips have outline bookmark icon
  - FR-TRIP-003.6: Show toast "Trip saved" or "Trip unsaved"
  - FR-TRIP-003.7: Saved trips accessible via "Saved" filter in Trip History
  - FR-TRIP-003.8: Persist saved status
- **Acceptance Criteria:**
  - Bookmark toggles correctly
  - Saved filter shows only saved trips
  - Saved status persists (MISSING)

---

**FR-TRIP-004: View Trip Detail**
- **Priority:** P1 (High)
- **Status:** ❌ Not Implemented
- **Description:** Users SHOULD be able to view full trip details
- **Requirements:**
  - FR-TRIP-004.1: Tapping trip card navigates to /trip-detail/[id]
  - FR-TRIP-004.2: Display complete trip information:
    - Route map with polyline
    - Origin and destination addresses
    - Distance, duration, price
    - Status with timestamp
    - Driver details (name, vehicle, rating)
    - Trip timeline (created, assigned, started, completed)
    - Receipt/invoice
  - FR-TRIP-004.3: Provide actions:
    - Share receipt
    - Download receipt (PDF)
    - Report issue
    - Rebook (create new trip with same route)
  - FR-TRIP-004.4: If status = 'completed', show rating section (future)
  - FR-TRIP-004.5: If status = 'pending', show "Cancel Trip" button
- **Missing Screen:**
  - `/trip-detail/[id].tsx` does not exist
- **Acceptance Criteria:**
  - All trip details display
  - Actions work correctly
  - Receipt downloadable

---

**FR-TRIP-005: Trip Persistence**
- **Priority:** P0 (Critical)
- **Status:** ❌ Not Implemented - **CRITICAL BLOCKER**
- **Description:** Trip data MUST persist across app restarts
- **Requirements:**
  - FR-TRIP-005.1: Save all trips to AsyncStorage
  - FR-TRIP-005.2: Storage key: `@rora/trips`
  - FR-TRIP-005.3: Save on every trip update (create, status change, saved toggle)
  - FR-TRIP-005.4: Hydrate trip store on app launch
  - FR-TRIP-005.5: Handle migration if data schema changes
  - FR-TRIP-005.6: Limit stored trips to last 100 (or implement backend)
- **Storage Format:**
  ```json
  {
    "trips": [
      {
        "id": "trip-1234567890",
        "timestamp": 1234567890000,
        "origin": { "placeId": "...", "name": "...", "coordinates": {...} },
        "destination": { ... },
        "routeData": { "distance": 10, "duration": 20, "price": 35, "coordinates": [...] },
        "status": "completed",
        "saved": true,
        "driverId": "driver-123",
        "createdAt": "2025-12-22T10:00:00Z"
      }
    ]
  }
  ```
- **Implementation:**
  - Create `src/services/trip-storage.service.ts`
  - Add hydrate() and persist() to trip-history-store
- **Acceptance Criteria:**
  - All trips persist across restarts
  - No data loss
  - Performance: Load < 500ms

---

### 3.5.2 Active Ride Tracking

**FR-TRIP-006: Active Ride Screen**
- **Priority:** P0 (Critical)
- **Status:** ❌ Not Implemented - **CRITICAL BLOCKER**
- **Description:** Users MUST be able to monitor rides in progress
- **Requirements:**
  - FR-TRIP-006.1: Create /active-ride.tsx screen
  - FR-TRIP-006.2: Automatically navigate to active-ride when trip status = 'in_progress'
  - FR-TRIP-006.3: Display:
    - Map with user's location, driver's location, and destination
    - Polyline showing route
    - Driver ETA (minutes remaining)
    - Driver info (name, vehicle, rating)
    - Trip details (destination, price)
  - FR-TRIP-006.4: Update driver location in real-time (every 5-10 seconds)
  - FR-TRIP-006.5: Update ETA based on current location
  - FR-TRIP-006.6: Provide "Contact Driver" quick actions (call/message)
  - FR-TRIP-006.7: Provide "Cancel Trip" button (with confirmation)
  - FR-TRIP-006.8: Show arrival notification when driver arrives
  - FR-TRIP-006.9: Transition to completion screen when trip ends
- **Real-time Updates:**
  - Use WebSocket or polling (every 5-10s)
  - Backend provides driver's current location
  - Recalculate ETA based on distance to destination
- **Acceptance Criteria:**
  - Map shows driver location in real-time
  - ETA updates dynamically
  - Arrival notification fires
  - Contact actions work

---

**FR-TRIP-007: Trip Completion & Rating**
- **Priority:** P1 (High)
- **Status:** ❌ Not Implemented
- **Description:** Users SHOULD be able to rate and review completed trips
- **Requirements:**
  - FR-TRIP-007.1: Navigate to completion screen when trip status = 'completed'
  - FR-TRIP-007.2: Display:
    - "Trip Completed" message
    - Trip summary (route, distance, duration, price)
    - Driver info
  - FR-TRIP-007.3: Provide star rating (1-5 stars)
  - FR-TRIP-007.4: Provide optional text review (textarea)
  - FR-TRIP-007.5: Provide tip amount selector (e.g., 10%, 15%, 20%, custom)
  - FR-TRIP-007.6: Provide receipt download button
  - FR-TRIP-007.7: Submit rating and navigate to Home
  - FR-TRIP-007.8: Store rating with trip record
- **Acceptance Criteria:**
  - Rating submits successfully
  - Tip amount calculated correctly
  - Receipt downloadable

---

## 3.6 User Profile & Settings

### 3.6.1 Profile Screen

**FR-PROFILE-001: View User Profile**
- **Priority:** P1 (High)
- **Status:** ✅ Implemented (hardcoded data, no authentication)
- **Description:** Users SHOULD be able to view their profile
- **Requirements:**
  - FR-PROFILE-001.1: Display user information:
    - Avatar (placeholder or uploaded photo)
    - Full name
    - Email address
    - Phone number (optional)
  - FR-PROFILE-001.2: Provide navigation to:
    - Personal Information (edit profile)
    - Settings
    - Trip History
    - Saved Locations
    - Favorite Drivers
    - Payment Methods
    - Help Center
    - Contact Us
  - FR-PROFILE-001.3: Provide "Sign Out" button
- **Current Status:**
  - Hardcoded data: "Joshua Bowers", "joshua@example.com"
  - Navigation implemented for Settings, Trip History, Saved Locations, Favorite Drivers
  - Personal Information, Payment Methods, Help Center, Contact Us show console.log placeholders
- **Acceptance Criteria:**
  - All navigation links work
  - Profile data loads from auth system (future)

---

**FR-PROFILE-002: Edit Profile**
- **Priority:** P2 (Nice to Have)
- **Status:** ❌ Not Implemented
- **Description:** Users SHOULD be able to edit their profile information
- **Requirements:**
  - FR-PROFILE-002.1: Tapping "Personal Information" navigates to edit screen
  - FR-PROFILE-002.2: Editable fields:
    - Full name
    - Email (requires verification)
    - Phone number
    - Avatar photo (upload)
  - FR-PROFILE-002.3: Provide "Save" button
  - FR-PROFILE-002.4: Validate inputs (email format, phone format)
  - FR-PROFILE-002.5: Show loading state during save
  - FR-PROFILE-002.6: Update backend/auth system
  - FR-PROFILE-002.7: Show success toast
- **Acceptance Criteria:**
  - Profile updates successfully
  - Validation works
  - Changes reflect immediately

---

**FR-PROFILE-003: Sign Out**
- **Priority:** P1 (High)
- **Status:** ⚠️ Partial (alert only, no actual sign out)
- **Description:** Users SHOULD be able to sign out of the app
- **Requirements:**
  - FR-PROFILE-003.1: Provide "Sign Out" button at bottom of Profile
  - FR-PROFILE-003.2: Show confirmation alert "Are you sure you want to sign out?"
  - FR-PROFILE-003.3: If confirmed:
    - Clear authentication tokens
    - Clear all user data from stores
    - Navigate to welcome/login screen
  - FR-PROFILE-003.4: If cancelled, close alert
- **Current Status:**
  - Shows alert with OK button
  - Does not actually sign out (no auth system)
- **Acceptance Criteria:**
  - Confirmation alert works
  - Sign out clears all data
  - Navigates to login screen

---

### 3.6.2 Settings

**FR-SETTINGS-001: Notification Preferences**
- **Priority:** P2 (Nice to Have)
- **Status:** ⚠️ Partial (UI only, no persistence)
- **Description:** Users SHOULD be able to configure notification preferences
- **Requirements:**
  - FR-SETTINGS-001.1: Provide toggle switches for:
    - Push notifications (master toggle)
    - Email notifications
    - Trip updates
    - Promotions
  - FR-SETTINGS-001.2: Save preferences to backend
  - FR-SETTINGS-001.3: If push notifications disabled, disable trip updates toggle
  - FR-SETTINGS-001.4: Register device token for push notifications
  - FR-SETTINGS-001.5: Unregister token when push disabled
- **Current Status:**
  - Toggles work (local state only)
  - No persistence, no backend integration
- **Acceptance Criteria:**
  - Preferences save successfully
  - Toggles persist across restarts
  - Push notifications respect settings

---

**FR-SETTINGS-002: Theme Selection**
- **Priority:** P2 (Nice to Have)
- **Status:** ⚠️ Partial (alert placeholder, no implementation)
- **Description:** Users SHOULD be able to choose app theme
- **Requirements:**
  - FR-SETTINGS-002.1: Provide theme selector with options:
    - Light
    - Dark
    - Auto (follow system)
  - FR-SETTINGS-002.2: Apply theme immediately when selected
  - FR-SETTINGS-002.3: Persist theme preference
  - FR-SETTINGS-002.4: Support dark mode colors in design system
  - FR-SETTINGS-002.5: Update status bar style based on theme
- **Current Status:**
  - Shows alert placeholder
  - Design system has light mode colors only
- **Acceptance Criteria:**
  - Theme changes apply immediately
  - Preference persists
  - Dark mode looks good

---

**FR-SETTINGS-003: Language Selection**
- **Priority:** P2 (Nice to Have)
- **Status:** ⚠️ Partial (alert placeholder, no implementation)
- **Description:** Users SHOULD be able to choose app language
- **Requirements:**
  - FR-SETTINGS-003.1: Provide language picker with options:
    - English
    - Español (Spanish)
    - Français (French)
  - FR-SETTINGS-003.2: Apply language immediately when selected
  - FR-SETTINGS-003.3: Persist language preference
  - FR-SETTINGS-003.4: Implement i18n (internationalization) library
  - FR-SETTINGS-003.5: Translate all UI text
  - FR-SETTINGS-003.6: Support RTL (right-to-left) if needed
- **Current Status:**
  - Shows alert placeholder
  - No i18n implementation
  - All text hardcoded in English
- **Acceptance Criteria:**
  - Language changes apply immediately
  - All text translates
  - Preference persists

---

**FR-SETTINGS-004: Privacy Settings**
- **Priority:** P2 (Nice to Have)
- **Status:** ⚠️ Partial (alert placeholders)
- **Description:** Users SHOULD be able to manage privacy settings
- **Requirements:**
  - FR-SETTINGS-004.1: Provide "Privacy Settings" link
  - FR-SETTINGS-004.2: Navigate to privacy screen with options:
    - Share location with drivers (toggle)
    - Share trip data for analytics (toggle)
    - Allow personalized ads (toggle)
  - FR-SETTINGS-004.3: Provide "Location Permissions" link → Opens system settings
  - FR-SETTINGS-004.4: Display Privacy Policy (webview or PDF)
  - FR-SETTINGS-004.5: Persist privacy preferences
- **Acceptance Criteria:**
  - Privacy toggles save
  - Location permissions link opens system settings
  - Privacy policy displays

---

**FR-SETTINGS-005: Payment Methods**
- **Priority:** P1 (High)
- **Status:** ⚠️ Partial (alert placeholder)
- **Description:** Users SHOULD be able to manage payment methods
- **Requirements:**
  - FR-SETTINGS-005.1: Provide "Payment Methods" link in Settings
  - FR-SETTINGS-005.2: Navigate to payment methods screen
  - FR-SETTINGS-005.3: Display list of saved payment methods:
    - Card last 4 digits
    - Card brand (Visa, Mastercard, etc.)
    - Expiry date
    - "Default" badge for primary card
  - FR-SETTINGS-005.4: Provide "Add Payment Method" button
  - FR-SETTINGS-005.5: Integrate with Stripe or similar payment processor
  - FR-SETTINGS-005.6: Allow removing payment methods
  - FR-SETTINGS-005.7: Allow setting default payment method
- **Acceptance Criteria:**
  - Payment methods display
  - Add/remove works
  - Stripe integration secure

---

**FR-SETTINGS-006: Help & Support**
- **Priority:** P2 (Nice to Have)
- **Status:** ⚠️ Partial (alert placeholders)
- **Description:** Users SHOULD be able to access help and support
- **Requirements:**
  - FR-SETTINGS-006.1: Provide "Help Center" link
  - FR-SETTINGS-006.2: Navigate to help center (webview or in-app)
  - FR-SETTINGS-006.3: Display FAQ, guides, tutorials
  - FR-SETTINGS-006.4: Provide "Contact Us" link
  - FR-SETTINGS-006.5: Navigate to contact form or chat
  - FR-SETTINGS-006.6: Integrate with support system (Zendesk, Intercom, etc.)
  - FR-SETTINGS-006.7: Display Terms of Service
  - FR-SETTINGS-006.8: Display app version
- **Current Status:**
  - Shows alert placeholders for Help Center, Contact Us, Terms, Privacy Policy
  - App version displays: "1.0.0" (hardcoded)
- **Acceptance Criteria:**
  - Help content accessible
  - Contact form submits
  - Terms/Privacy display

---

### 3.6.3 Saved Locations

**FR-LOCATIONS-001: View Saved Locations**
- **Priority:** P1 (High)
- **Status:** ✅ Implemented (NO PERSISTENCE)
- **Description:** Users SHOULD be able to view their saved locations
- **Requirements:**
  - FR-LOCATIONS-001.1: Provide "Saved Locations" link in Profile
  - FR-LOCATIONS-001.2: Navigate to /saved-locations
  - FR-LOCATIONS-001.3: Display two sections:
    - Quick Access: Home, Work (special treatment)
    - Custom Locations: All other saved locations
  - FR-LOCATIONS-001.4: Each location card shows:
    - Icon (home, work, or pin)
    - Label (e.g., "Home", "Gym")
    - Full address
    - Coordinates (optional)
  - FR-LOCATIONS-001.5: Provide actions for each location:
    - Edit
    - Get Directions
    - Remove
  - FR-LOCATIONS-001.6: Show empty state if no locations saved
  - FR-LOCATIONS-001.7: Provide info card explaining saved locations feature
- **Acceptance Criteria:**
  - All saved locations display
  - Actions work correctly
  - Empty state shows

---

**FR-LOCATIONS-002: Add Saved Location**
- **Priority:** P1 (High)
- **Status:** ❌ Not Implemented - **CRITICAL GAP**
- **Description:** Users MUST be able to add saved locations
- **Requirements:**
  - FR-LOCATIONS-002.1: Provide "Add Home", "Add Work", "Add Location" buttons
  - FR-LOCATIONS-002.2: Tapping button opens location search screen
  - FR-LOCATIONS-002.3: Use Google Places Autocomplete for search
  - FR-LOCATIONS-002.4: User types address → Select from suggestions
  - FR-LOCATIONS-002.5: Optionally provide custom label (if not Home/Work)
  - FR-LOCATIONS-002.6: Fetch place details (coordinates, formatted address)
  - FR-LOCATIONS-002.7: Save to saved-locations-store
  - FR-LOCATIONS-002.8: Persist to AsyncStorage or backend
  - FR-LOCATIONS-002.9: Navigate back to saved-locations screen
  - FR-LOCATIONS-002.10: Show toast "Location saved"
- **Current Status:**
  - Shows alert placeholder "This feature is coming soon"
- **Acceptance Criteria:**
  - Location search works
  - Location saves successfully
  - Persists across restarts

---

**FR-LOCATIONS-003: Edit Saved Location**
- **Priority:** P2 (Nice to Have)
- **Status:** ❌ Not Implemented
- **Description:** Users SHOULD be able to edit saved locations
- **Requirements:**
  - FR-LOCATIONS-003.1: Tapping "Edit" opens edit screen
  - FR-LOCATIONS-003.2: Editable fields:
    - Label (e.g., rename "Home" to "Mom's House")
    - Address (search for new address)
  - FR-LOCATIONS-003.3: Cannot change label for Home/Work (fixed labels)
  - FR-LOCATIONS-003.4: Provide "Save" button
  - FR-LOCATIONS-003.5: Update saved-locations-store
  - FR-LOCATIONS-003.6: Persist changes
  - FR-LOCATIONS-003.7: Show toast "Location updated"
- **Current Status:**
  - Shows alert placeholder
- **Acceptance Criteria:**
  - Edit screen displays
  - Updates save correctly
  - Changes persist

---

**FR-LOCATIONS-004: Remove Saved Location**
- **Priority:** P1 (High)
- **Status:** ✅ Implemented (NO PERSISTENCE)
- **Description:** Users SHOULD be able to remove saved locations
- **Requirements:**
  - FR-LOCATIONS-004.1: Tapping "Remove" shows confirmation alert
  - FR-LOCATIONS-004.2: Alert message: "Remove [Label]?"
  - FR-LOCATIONS-004.3: Alert buttons: "Cancel" and "Remove"
  - FR-LOCATIONS-004.4: "Remove" deletes location from store
  - FR-LOCATIONS-004.5: Card animates out of list
  - FR-LOCATIONS-004.6: Persist changes
  - FR-LOCATIONS-004.7: Show toast "Location removed"
- **Current Status:**
  - Confirmation alert works
  - Removes from store
  - **NO PERSISTENCE** - location reappears on restart
- **Acceptance Criteria:**
  - Confirmation alert works
  - Location removes
  - Change persists

---

**FR-LOCATIONS-005: Get Directions to Saved Location**
- **Priority:** P1 (High)
- **Status:** ❌ Not Implemented
- **Description:** Users SHOULD be able to quickly book rides to saved locations
- **Requirements:**
  - FR-LOCATIONS-005.1: Tapping "Get Directions" on location card
  - FR-LOCATIONS-005.2: Pre-fill route-input with:
    - Origin: Current location
    - Destination: Saved location
  - FR-LOCATIONS-005.3: Calculate route automatically
  - FR-LOCATIONS-005.4: Navigate to trip-preview
  - FR-LOCATIONS-005.5: User can book ride from there
- **Current Status:**
  - Shows alert placeholder
- **Acceptance Criteria:**
  - Route pre-fills correctly
  - Route calculation works
  - Navigates to trip-preview

---

**FR-LOCATIONS-006: Integrate Saved Locations in Route Input**
- **Priority:** P1 (High)
- **Status:** ❌ Not Implemented
- **Description:** Saved locations SHOULD appear as autocomplete suggestions
- **Requirements:**
  - FR-LOCATIONS-006.1: When user types in route-input origin/destination
  - FR-LOCATIONS-006.2: Show saved locations at top of autocomplete results
  - FR-LOCATIONS-006.3: Section header: "Saved Locations"
  - FR-LOCATIONS-006.4: Display saved locations matching search query
  - FR-LOCATIONS-006.5: Highlight matching text
  - FR-LOCATIONS-006.6: Selecting saved location fills field
  - FR-LOCATIONS-006.7: Show all saved locations if query is empty
- **Acceptance Criteria:**
  - Saved locations appear in autocomplete
  - Selecting saved location works
  - Search filters saved locations

---

## 3.7 Authentication & User Management

### 3.7.1 Authentication

**FR-AUTH-001: User Registration**
- **Priority:** P0 (Critical)
- **Status:** ❌ Not Implemented - **CRITICAL BLOCKER**
- **Description:** New users MUST be able to create accounts
- **Requirements:**
  - FR-AUTH-001.1: Create /signup screen
  - FR-AUTH-001.2: Registration fields:
    - Full name (required)
    - Email address (required, validated)
    - Phone number (optional)
    - Password (required, min 8 chars, strength indicator)
    - Confirm password (required, must match)
  - FR-AUTH-001.3: Show Terms of Service and Privacy Policy checkboxes
  - FR-AUTH-001.4: Provide "Sign Up" button (disabled until form valid)
  - FR-AUTH-001.5: Validate inputs in real-time
  - FR-AUTH-001.6: Show validation errors below fields
  - FR-AUTH-001.7: Submit registration to backend/auth service
  - FR-AUTH-001.8: Send email verification link
  - FR-AUTH-001.9: Navigate to email verification screen
  - FR-AUTH-001.10: Provide "Already have an account? Sign In" link
- **Auth Provider Options:**
  - Supabase (recommended for MVP)
  - Firebase Auth
  - Custom backend with JWT
- **Acceptance Criteria:**
  - Registration creates account
  - Email verification sent
  - Validation works correctly

---

**FR-AUTH-002: User Login**
- **Priority:** P0 (Critical)
- **Status:** ❌ Not Implemented - **CRITICAL BLOCKER**
- **Description:** Existing users MUST be able to sign in
- **Requirements:**
  - FR-AUTH-002.1: Create /login screen
  - FR-AUTH-002.2: Login fields:
    - Email address (required)
    - Password (required)
  - FR-AUTH-002.3: Provide "Sign In" button
  - FR-AUTH-002.4: Provide "Forgot Password?" link
  - FR-AUTH-002.5: Submit credentials to auth service
  - FR-AUTH-002.6: Store auth token securely (Keychain/Keystore)
  - FR-AUTH-002.7: Navigate to Home screen on success
  - FR-AUTH-002.8: Show error message on failure
  - FR-AUTH-002.9: Provide "Don't have an account? Sign Up" link
  - FR-AUTH-002.10: Support biometric login (Face ID/Touch ID) - future
- **Acceptance Criteria:**
  - Login authenticates user
  - Token stored securely
  - Navigates to Home on success
  - Error messages display

---

**FR-AUTH-003: Password Reset**
- **Priority:** P1 (High)
- **Status:** ❌ Not Implemented
- **Description:** Users SHOULD be able to reset forgotten passwords
- **Requirements:**
  - FR-AUTH-003.1: Create /forgot-password screen
  - FR-AUTH-003.2: Field: Email address (required)
  - FR-AUTH-003.3: Provide "Send Reset Link" button
  - FR-AUTH-003.4: Submit email to auth service
  - FR-AUTH-003.5: Send password reset email
  - FR-AUTH-003.6: Show success message "Check your email for reset link"
  - FR-AUTH-003.7: Navigate back to login after 3 seconds
  - FR-AUTH-003.8: Handle deep link from reset email
  - FR-AUTH-003.9: Create /reset-password screen (from email link)
  - FR-AUTH-003.10: Fields: New password, Confirm password
  - FR-AUTH-003.11: Submit new password to auth service
  - FR-AUTH-003.12: Navigate to login on success
- **Acceptance Criteria:**
  - Reset email sends
  - Deep link opens app
  - Password resets successfully

---

**FR-AUTH-004: Email Verification**
- **Priority:** P1 (High)
- **Status:** ❌ Not Implemented
- **Description:** Users SHOULD verify their email addresses
- **Requirements:**
  - FR-AUTH-004.1: Send verification email on signup
  - FR-AUTH-004.2: Create /verify-email screen
  - FR-AUTH-004.3: Display message "Check your email for verification link"
  - FR-AUTH-004.4: Provide "Resend Email" button
  - FR-AUTH-004.5: Handle deep link from verification email
  - FR-AUTH-004.6: Mark email as verified in backend
  - FR-AUTH-004.7: Navigate to Home on verification
  - FR-AUTH-004.8: Optionally require verification before booking rides
- **Acceptance Criteria:**
  - Verification email sends
  - Deep link verifies email
  - Email status updates

---

**FR-AUTH-005: Session Management**
- **Priority:** P0 (Critical)
- **Status:** ❌ Not Implemented
- **Description:** The app MUST manage user sessions securely
- **Requirements:**
  - FR-AUTH-005.1: Store auth token in secure storage (expo-secure-store)
  - FR-AUTH-005.2: Include token in all API requests (Authorization header)
  - FR-AUTH-005.3: Refresh token before expiry
  - FR-AUTH-005.4: Handle token expiry gracefully (redirect to login)
  - FR-AUTH-005.5: Implement "Remember Me" option (keep logged in)
  - FR-AUTH-005.6: Clear token on sign out
  - FR-AUTH-005.7: Detect session expiry and prompt re-login
- **Acceptance Criteria:**
  - Token stored securely
  - API requests authenticated
  - Session persists across restarts

---

**FR-AUTH-006: Protected Routes**
- **Priority:** P0 (Critical)
- **Status:** ❌ Not Implemented
- **Description:** The app MUST restrict access to authenticated users
- **Requirements:**
  - FR-AUTH-006.1: Implement auth guard component
  - FR-AUTH-006.2: Check auth status on app launch
  - FR-AUTH-006.3: If not authenticated → Redirect to /welcome or /login
  - FR-AUTH-006.4: If authenticated → Load user data and show Home
  - FR-AUTH-006.5: Protected routes:
    - All tabs (Home, Drivers, Explore, Profile)
    - Trip History, Saved Locations, Favorite Drivers
    - Settings, Payment Methods
  - FR-AUTH-006.6: Public routes:
    - Welcome, Signup, Login, Forgot Password, Verify Email
- **Acceptance Criteria:**
  - Auth guard blocks unauthenticated access
  - Redirects work correctly
  - User data loads on auth

---

### 3.7.2 User Data Management

**FR-USER-001: Load User Profile**
- **Priority:** P0 (Critical)
- **Status:** ❌ Not Implemented
- **Description:** The app MUST load user profile data on login
- **Requirements:**
  - FR-USER-001.1: Fetch user profile from backend after login
  - FR-USER-001.2: Store user data in user-store (Zustand)
  - FR-USER-001.3: User data includes:
    - User ID
    - Full name
    - Email address
    - Phone number
    - Avatar URL
    - Account created date
    - Email verified status
  - FR-USER-001.4: Display user info in Profile screen
  - FR-USER-001.5: Update user data when profile edited
- **Acceptance Criteria:**
  - User data loads on login
  - Data displays in Profile
  - Updates propagate

---

**FR-USER-002: Sync User Data**
- **Priority:** P1 (High)
- **Status:** ❌ Not Implemented
- **Description:** User data SHOULD sync across devices
- **Requirements:**
  - FR-USER-002.1: Store all user data in backend (not just AsyncStorage)
  - FR-USER-002.2: User data to sync:
    - Trip history
    - Saved locations
    - Favorite drivers
    - Settings preferences
  - FR-USER-002.3: Sync on app launch (fetch from backend)
  - FR-USER-002.4: Sync on data change (save to backend)
  - FR-USER-002.5: Handle conflicts (last-write-wins or manual resolution)
  - FR-USER-002.6: Show sync status indicator (optional)
- **Acceptance Criteria:**
  - Data syncs across devices
  - Conflicts resolved
  - No data loss

---

**FR-USER-003: Account Deletion**
- **Priority:** P2 (Nice to Have)
- **Status:** ❌ Not Implemented
- **Description:** Users SHOULD be able to delete their accounts
- **Requirements:**
  - FR-USER-003.1: Provide "Delete Account" link in Settings
  - FR-USER-003.2: Show warning alert:
    - "This action is permanent and cannot be undone."
    - "All your data will be deleted."
  - FR-USER-003.3: Require password confirmation
  - FR-USER-003.4: Submit deletion request to backend
  - FR-USER-003.5: Delete all user data:
    - Profile info
    - Trip history
    - Saved locations
    - Favorite drivers
    - Payment methods
  - FR-USER-003.6: Sign out user
  - FR-USER-003.7: Navigate to welcome screen
  - FR-USER-003.8: Send confirmation email
- **Acceptance Criteria:**
  - Account deletes
  - All data removed
  - Confirmation email sent

---

## 3.8 Payment Processing

### 3.8.1 Payment Methods

**FR-PAYMENT-001: Add Payment Method**
- **Priority:** P1 (High)
- **Status:** ❌ Not Implemented
- **Description:** Users SHOULD be able to add payment methods
- **Requirements:**
  - FR-PAYMENT-001.1: Provide "Add Payment Method" button
  - FR-PAYMENT-001.2: Support credit/debit cards
  - FR-PAYMENT-001.3: Use Stripe or similar for card processing
  - FR-PAYMENT-001.4: Card input fields:
    - Card number (validated)
    - Expiry date (MM/YY)
    - CVC (3-4 digits)
    - Cardholder name
    - Billing ZIP code
  - FR-PAYMENT-001.5: Validate card in real-time (Stripe.js)
  - FR-PAYMENT-001.6: Tokenize card (do NOT store full card number)
  - FR-PAYMENT-001.7: Save card token to backend
  - FR-PAYMENT-001.8: Display saved card in payment methods list
  - FR-PAYMENT-001.9: Set as default if first card
- **Acceptance Criteria:**
  - Card tokenizes successfully
  - Validation works
  - Card saves to backend

---

**FR-PAYMENT-002: Set Default Payment Method**
- **Priority:** P2 (Nice to Have)
- **Status:** ❌ Not Implemented
- **Description:** Users SHOULD be able to set a default payment method
- **Requirements:**
  - FR-PAYMENT-002.1: Display "Default" badge on default card
  - FR-PAYMENT-002.2: Provide "Set as Default" button on other cards
  - FR-PAYMENT-002.3: Update default in backend
  - FR-PAYMENT-002.4: Use default card for automatic payments
  - FR-PAYMENT-002.5: Allow changing default at any time
- **Acceptance Criteria:**
  - Default card sets correctly
  - Badge displays
  - Payments use default

---

**FR-PAYMENT-003: Remove Payment Method**
- **Priority:** P2 (Nice to Have)
- **Status:** ❌ Not Implemented
- **Description:** Users SHOULD be able to remove payment methods
- **Requirements:**
  - FR-PAYMENT-003.1: Provide "Remove" button on each card
  - FR-PAYMENT-003.2: Show confirmation alert
  - FR-PAYMENT-003.3: If removing default card, prompt to set new default
  - FR-PAYMENT-003.4: Delete card token from backend
  - FR-PAYMENT-003.5: Remove from list
  - FR-PAYMENT-003.6: Show toast "Card removed"
- **Acceptance Criteria:**
  - Confirmation works
  - Card deletes
  - Default prompts if needed

---

### 3.8.2 Payments

**FR-PAYMENT-004: Process Trip Payment**
- **Priority:** P0 (Critical)
- **Status:** ❌ Not Implemented - **CRITICAL BLOCKER**
- **Description:** The app MUST process payments for completed trips
- **Requirements:**
  - FR-PAYMENT-004.1: Charge user's default payment method when trip status = 'completed'
  - FR-PAYMENT-004.2: Charge amount = trip price + tip (if applicable)
  - FR-PAYMENT-004.3: Show payment processing indicator
  - FR-PAYMENT-004.4: Handle payment success:
    - Update trip record (paid = true)
    - Generate receipt
    - Send email receipt
    - Show success message
  - FR-PAYMENT-004.5: Handle payment failure:
    - Show error message
    - Prompt to try again or use different card
    - Do not mark trip as completed until payment succeeds
  - FR-PAYMENT-004.6: Support retries for failed payments
  - FR-PAYMENT-004.7: Store transaction ID with trip
- **Acceptance Criteria:**
  - Payment processes successfully
  - Receipt generates
  - Failures handled gracefully

---

**FR-PAYMENT-005: View Payment History**
- **Priority:** P2 (Nice to Have)
- **Status:** ❌ Not Implemented
- **Description:** Users SHOULD be able to view payment history
- **Requirements:**
  - FR-PAYMENT-005.1: Provide "Payment History" link in Profile or Settings
  - FR-PAYMENT-005.2: Display list of all payments:
    - Date
    - Trip (origin → destination)
    - Amount
    - Payment method (last 4 digits)
    - Status (Success/Failed/Refunded)
  - FR-PAYMENT-005.3: Provide filters: Date range, Status
  - FR-PAYMENT-005.4: Tapping payment shows receipt
  - FR-PAYMENT-005.5: Provide download receipt button
- **Acceptance Criteria:**
  - Payment history displays
  - Filters work
  - Receipts downloadable

---

**FR-PAYMENT-006: Refunds**
- **Priority:** P2 (Nice to Have)
- **Status:** ❌ Not Implemented
- **Description:** Users SHOULD be able to request refunds for problematic trips
- **Requirements:**
  - FR-PAYMENT-006.1: Provide "Request Refund" button on trip detail (if paid)
  - FR-PAYMENT-006.2: Only allow refunds within 7 days of trip
  - FR-PAYMENT-006.3: Show refund request form:
    - Reason dropdown (e.g., Driver no-show, Wrong destination)
    - Additional comments (optional)
  - FR-PAYMENT-006.4: Submit refund request to backend
  - FR-PAYMENT-006.5: Admin reviews and approves/denies
  - FR-PAYMENT-006.6: Process refund to original payment method
  - FR-PAYMENT-006.7: Update trip record (refunded = true)
  - FR-PAYMENT-006.8: Send email notification of refund status
- **Acceptance Criteria:**
  - Refund requests submit
  - Approved refunds process
  - Notifications send

---

## 3.9 Offline & Error Handling

### 3.9.1 Offline Detection

**FR-OFFLINE-001: Detect Network Status**
- **Priority:** P1 (High)
- **Status:** ❌ Not Implemented
- **Description:** The app SHOULD detect when user is offline
- **Requirements:**
  - FR-OFFLINE-001.1: Use @react-native-community/netinfo
  - FR-OFFLINE-001.2: Monitor network connection continuously
  - FR-OFFLINE-001.3: Store network status in store
  - FR-OFFLINE-001.4: Show offline banner at top of screen when disconnected
  - FR-OFFLINE-001.5: Hide banner when reconnected
  - FR-OFFLINE-001.6: Disable actions requiring network when offline:
    - Route calculation
    - Venue search
    - Driver search
    - Booking rides
  - FR-OFFLINE-001.7: Show offline message when user attempts network action
- **Acceptance Criteria:**
  - Network status accurate
  - Banner shows/hides correctly
  - Actions disabled when offline

---

**FR-OFFLINE-002: Offline Data Access**
- **Priority:** P2 (Nice to Have)
- **Status:** ⚠️ Partial (location data persists, but nothing else)
- **Description:** Users SHOULD be able to access cached data offline
- **Requirements:**
  - FR-OFFLINE-002.1: Cache user profile data
  - FR-OFFLINE-002.2: Cache trip history
  - FR-OFFLINE-002.3: Cache saved locations
  - FR-OFFLINE-002.4: Cache favorite drivers
  - FR-OFFLINE-002.5: Load cached data when offline
  - FR-OFFLINE-002.6: Show indicator that data may be stale
  - FR-OFFLINE-002.7: Sync changes when reconnected
- **Acceptance Criteria:**
  - Cached data accessible offline
  - Indicator shows
  - Sync works on reconnect

---

### 3.9.2 Error Boundaries

**FR-ERROR-001: Global Error Boundary**
- **Priority:** P0 (Critical)
- **Status:** ❌ Not Implemented - **CRITICAL BLOCKER**
- **Description:** The app MUST gracefully handle unexpected errors
- **Requirements:**
  - FR-ERROR-001.1: Implement React error boundary component
  - FR-ERROR-001.2: Wrap app root layout with error boundary
  - FR-ERROR-001.3: Catch all unhandled errors
  - FR-ERROR-001.4: Display error screen with:
    - Friendly error message
    - "Restart App" button
    - "Report Issue" button (optional)
  - FR-ERROR-001.5: Log error to error tracking service (Sentry)
  - FR-ERROR-001.6: Include error details:
    - Error message
    - Stack trace
    - User ID (if logged in)
    - Device info
    - App version
  - FR-ERROR-001.7: Provide fallback UI (not crash)
- **Acceptance Criteria:**
  - App doesn't crash on error
  - Error screen displays
  - Errors logged to Sentry

---

**FR-ERROR-002: API Error Handling**
- **Priority:** P1 (High)
- **Status:** ⚠️ Partial (google-maps.service has error handling, but inconsistent elsewhere)
- **Description:** The app SHOULD handle API errors gracefully
- **Requirements:**
  - FR-ERROR-002.1: Catch all API request errors
  - FR-ERROR-002.2: Display user-friendly error messages:
    - Network error: "Unable to connect. Check your internet."
    - 400 Bad Request: "Invalid request. Please try again."
    - 401 Unauthorized: "Session expired. Please log in again."
    - 404 Not Found: "Resource not found."
    - 500 Server Error: "Server error. Please try again later."
  - FR-ERROR-002.3: Provide retry button for transient errors
  - FR-ERROR-002.4: Log errors to Sentry
  - FR-ERROR-002.5: Show loading state during retry
  - FR-ERROR-002.6: Limit retries (max 3 attempts)
- **Acceptance Criteria:**
  - Errors display friendly messages
  - Retry works
  - Errors logged

---

**FR-ERROR-003: Form Validation Errors**
- **Priority:** P1 (High)
- **Status:** ⚠️ Partial (route-input has some validation, but inconsistent)
- **Description:** The app SHOULD validate user input and show clear errors
- **Requirements:**
  - FR-ERROR-003.1: Validate inputs in real-time (on blur or change)
  - FR-ERROR-003.2: Display validation errors below input fields
  - FR-ERROR-003.3: Error messages:
    - Required field: "[Field] is required"
    - Email format: "Please enter a valid email"
    - Password strength: "Password must be at least 8 characters"
    - Mismatch: "Passwords do not match"
  - FR-ERROR-003.4: Disable submit button until form valid
  - FR-ERROR-003.5: Highlight invalid fields (red border)
  - FR-ERROR-003.6: Clear errors when user corrects input
- **Acceptance Criteria:**
  - Validation works in real-time
  - Error messages clear
  - Submit disabled when invalid

---

## 3.10 Notifications

### 3.10.1 Push Notifications

**FR-NOTIF-001: Register for Push Notifications**
- **Priority:** P2 (Nice to Have)
- **Status:** ❌ Not Implemented
- **Description:** The app SHOULD register devices for push notifications
- **Requirements:**
  - FR-NOTIF-001.1: Request push notification permission
  - FR-NOTIF-001.2: Use expo-notifications
  - FR-NOTIF-001.3: Register device token with backend
  - FR-NOTIF-001.4: Support iOS and Android
  - FR-NOTIF-001.5: Handle permission granted/denied
  - FR-NOTIF-001.6: Unregister token on sign out
- **Acceptance Criteria:**
  - Token registers successfully
  - Backend receives token
  - Unregister works

---

**FR-NOTIF-002: Trip Status Notifications**
- **Priority:** P1 (High)
- **Status:** ❌ Not Implemented
- **Description:** Users SHOULD receive notifications for trip updates
- **Requirements:**
  - FR-NOTIF-002.1: Send push notification when:
    - Driver assigned (status → pending)
    - Driver en route (status → in_progress)
    - Driver arrived
    - Trip completed
    - Trip cancelled
  - FR-NOTIF-002.2: Notification includes:
    - Title (e.g., "Driver Assigned")
    - Body (e.g., "John is on the way. ETA: 5 min")
    - Trip ID (for deep linking)
  - FR-NOTIF-002.3: Tapping notification opens app to trip detail or active ride
  - FR-NOTIF-002.4: Respect notification preferences (FR-SETTINGS-001)
- **Acceptance Criteria:**
  - Notifications send correctly
  - Deep links work
  - Preferences respected

---

**FR-NOTIF-003: Promotional Notifications**
- **Priority:** P3 (Low)
- **Status:** ❌ Not Implemented
- **Description:** Users MAY receive promotional notifications (opt-in)
- **Requirements:**
  - FR-NOTIF-003.1: Only send if user enabled "Promotions" in Settings
  - FR-NOTIF-003.2: Notification types:
    - Discounts/coupons
    - New drivers available
    - New venues added
  - FR-NOTIF-003.3: Limit frequency (max 1 per week)
  - FR-NOTIF-003.4: Provide unsubscribe option
- **Acceptance Criteria:**
  - Only sends if opted in
  - Frequency limited
  - Unsubscribe works

---

### 3.10.2 In-App Notifications

**FR-NOTIF-004: Toast Notifications**
- **Priority:** P2 (Nice to Have)
- **Status:** ✅ Implemented (toast provider exists)
- **Description:** The app SHOULD show toast messages for user actions
- **Requirements:**
  - FR-NOTIF-004.1: Display toast for:
    - Trip saved
    - Location saved
    - Favorite added/removed
    - Settings saved
    - Errors (brief)
  - FR-NOTIF-004.2: Toast auto-dismisses after 3 seconds
  - FR-NOTIF-004.3: Toast positioned at bottom of screen
  - FR-NOTIF-004.4: Toast types: success, error, info, warning
  - FR-NOTIF-004.5: Only one toast visible at a time (queue if multiple)
- **Current Status:**
  - ToastProvider exists in `src/ui/providers/toast-provider.tsx`
  - Used in trip-preview for "Trip saved successfully"
- **Acceptance Criteria:**
  - Toasts display correctly
  - Auto-dismiss works
  - Types styled correctly

---

## 3.11 Accessibility

**FR-A11Y-001: Screen Reader Support**
- **Priority:** P2 (Nice to Have)
- **Status:** ⚠️ Partial (some components have accessibility props, but inconsistent)
- **Description:** The app SHOULD be accessible to screen reader users
- **Requirements:**
  - FR-A11Y-001.1: Add accessibility labels to all interactive elements
  - FR-A11Y-001.2: Add accessibility hints for complex actions
  - FR-A11Y-001.3: Add accessibility roles (button, link, header, etc.)
  - FR-A11Y-001.4: Ensure semantic structure (headings, lists)
  - FR-A11Y-001.5: Test with VoiceOver (iOS) and TalkBack (Android)
  - FR-A11Y-001.6: Announce dynamic content changes
- **Acceptance Criteria:**
  - All elements have labels
  - Screen readers navigate correctly
  - Dynamic changes announced

---

**FR-A11Y-002: Keyboard Navigation**
- **Priority:** P3 (Low)
- **Status:** ❌ Not Implemented
- **Description:** The app MAY support keyboard navigation (for external keyboards)
- **Requirements:**
  - FR-A11Y-002.1: Support Tab key to navigate between fields
  - FR-A11Y-002.2: Support Enter key to submit forms
  - FR-A11Y-002.3: Support Escape key to close modals
  - FR-A11Y-002.4: Visible focus indicators
- **Acceptance Criteria:**
  - Tab navigation works
  - Enter submits forms
  - Focus visible

---

**FR-A11Y-003: Color Contrast**
- **Priority:** P2 (Nice to Have)
- **Status:** ⚠️ Partial (design system has colors, but contrast not verified)
- **Description:** The app SHOULD meet WCAG AA color contrast standards
- **Requirements:**
  - FR-A11Y-003.1: Text contrast ratio >= 4.5:1 (normal text)
  - FR-A11Y-003.2: Text contrast ratio >= 3:1 (large text, 18pt+)
  - FR-A11Y-003.3: UI element contrast >= 3:1
  - FR-A11Y-003.4: Test with contrast checker tools
  - FR-A11Y-003.5: Avoid relying on color alone for information
- **Acceptance Criteria:**
  - Contrast ratios meet WCAG AA
  - Color not sole indicator

---

**FR-A11Y-004: Text Scaling**
- **Priority:** P2 (Nice to Have)
- **Status:** ❌ Not Implemented
- **Description:** The app SHOULD support dynamic text sizing
- **Requirements:**
  - FR-A11Y-004.1: Respect system text size settings
  - FR-A11Y-004.2: UI adapts to larger text sizes
  - FR-A11Y-004.3: Test at 200% text size
  - FR-A11Y-004.4: No text truncation at larger sizes
- **Acceptance Criteria:**
  - Text scales with system settings
  - UI doesn't break at large sizes

---

## 4. User Roles & Permissions

### 4.1 Roles

**Passenger (Current Scope)**
- Can search for locations and venues
- Can plan routes and view price estimates
- Can browse drivers
- Can book rides (when implemented)
- Can view trip history
- Can save locations and favorite drivers
- Can manage profile and settings

**Driver (Out of Scope - Requires Separate Driver App)**
- Can receive ride requests
- Can accept/decline rides
- Can navigate to pickup/dropoff
- Can update ride status
- Can contact passengers
- Can view earnings

**Admin (Future Scope - Web Dashboard)**
- Can view all users and drivers
- Can view all trips
- Can approve refunds
- Can manage app content (venues, categories)
- Can send notifications
- Can view analytics

### 4.2 Permissions

All features in current app scope are available to **authenticated passengers** only.

**Unauthenticated Users:**
- Can view Welcome screen
- Can sign up
- Can log in
- **Cannot** access any other app features

---

## 5. Data Requirements

### 5.1 Data Models

#### 5.1.1 User
```typescript
interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### 5.1.2 Trip
```typescript
interface Trip {
  id: string;
  userId: string;
  timestamp: number;
  origin: PlaceDetails;
  destination: PlaceDetails;
  routeData: {
    distance: number; // km
    duration: number; // minutes
    price: number; // USD
    coordinates: LatLng[]; // polyline
  };
  status: 'not_taken' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
  saved: boolean;
  driverId?: string;
  paid: boolean;
  paymentId?: string;
  rating?: number; // 1-5
  review?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 5.1.3 Saved Location
```typescript
interface SavedLocation {
  id: string;
  userId: string;
  label: string; // "Home", "Work", or custom
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  placeId?: string;
  createdAt: string;
}
```

#### 5.1.4 Driver
```typescript
interface Driver {
  id: string;
  fullName: string;
  avatarUrl?: string;
  rating: number; // 0-5
  reviewCount: number;
  status: 'on_duty' | 'off_duty';
  phone: string;
  email: string;
  languages: string[];
  bio: string;
  yearsExperience: number;
  vehicle: {
    type: string; // "Sedan", "SUV", etc.
    make: string;
    model: string;
    color: string;
    licensePlate: string;
  };
  currentLocation?: LatLng; // for active rides
  createdAt: string;
}
```

#### 5.1.5 Venue
```typescript
interface Venue {
  id: string;
  name: string;
  description: string;
  category: string; // "restaurant", "cafe", etc.
  location: {
    address: string;
    coordinates: LatLng;
    placeId?: string;
  };
  rating: number;
  reviewCount: number;
  photos: string[]; // URLs
  amenities: string[];
  hours?: string;
  phone?: string;
  website?: string;
  featured: boolean;
  createdAt: string;
}
```

#### 5.1.6 Payment Method
```typescript
interface PaymentMethod {
  id: string;
  userId: string;
  stripeTokenId: string;
  brand: string; // "Visa", "Mastercard", etc.
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  createdAt: string;
}
```

### 5.2 Data Storage

**Current State:**
- **AsyncStorage:** Location data only
- **In-Memory (Zustand):** All other data (lost on restart)

**Required State:**
- **AsyncStorage:** Cache for offline access
- **Backend (PostgreSQL/Supabase):** Source of truth for all user data
- **Secure Storage (expo-secure-store):** Auth tokens only

**Data to Persist:**
- User profile
- Trip history
- Saved locations
- Favorite drivers
- Settings preferences
- Payment methods

---

## 6. Integration Requirements

### 6.1 Google Maps APIs

**Required APIs:**
1. **Places Autocomplete API** - Location search
2. **Places Details API** - Fetch place coordinates
3. **Directions API** - Route calculation
4. **Distance Matrix API** - Distance/duration for multiple pairs
5. **Geocoding API** - Coordinates to address (via expo-location)

**Current Integration:**
- ✅ All APIs accessible via Cloud Run proxy
- ✅ Proxy deployed and functional
- ⚠️ API key exposed in proxy (should use environment variable)
- ⚠️ No rate limiting on proxy

**Required Improvements:**
- Add rate limiting to proxy
- Enable billing alerts on Google Cloud
- Optimize API calls (caching, debouncing)
- Monitor API usage and costs

---

### 6.2 Authentication Provider

**Options:**
1. **Supabase** (Recommended)
   - Built-in auth
   - PostgreSQL database
   - Real-time subscriptions
   - Row-level security
   - Free tier: 50,000 users
   - Cost: $25/month for 100K users

2. **Firebase Auth**
   - Mature platform
   - Email/password, social logins
   - Free tier: Unlimited users
   - Cost: Pay for database/storage separately

3. **Custom Backend**
   - Full control
   - More development time
   - Requires JWT implementation

**Recommendation:** **Supabase** for MVP (auth + database in one)

---

### 6.3 Payment Processor

**Options:**
1. **Stripe** (Recommended)
   - Industry standard
   - Mobile SDK for React Native
   - PCI compliant
   - Fee: 2.9% + $0.30 per transaction
   - Easy integration with Supabase

2. **Square**
   - Good for in-person payments
   - Fee: 2.6% + $0.10 per transaction
   - Less mobile-focused

**Recommendation:** **Stripe** for MVP

---

### 6.4 Error Tracking

**Options:**
1. **Sentry** (Recommended)
   - Best-in-class error tracking
   - React Native SDK
   - Source maps for stack traces
   - Free tier: 5,000 events/month
   - Cost: $26/month for 50K events

2. **Bugsnag**
   - Similar to Sentry
   - Good React Native support

**Recommendation:** **Sentry** for MVP

---

### 6.5 Analytics

**Options:**
1. **PostHog** (Recommended for MVP)
   - Open-source
   - Self-hosted or cloud
   - User analytics + session replay
   - Free tier: 1M events/month

2. **Mixpanel**
   - User analytics
   - Funnel analysis
   - Free tier: 100K users/month

3. **Google Analytics**
   - Free
   - Limited mobile support

**Recommendation:** **PostHog** for MVP

---

## 7. Platform Requirements

### 7.1 iOS

**Minimum Version:** iOS 13.0 (to match Expo SDK 54)

**Required Permissions (Info.plist):**
- `NSLocationWhenInUseUsageDescription` - "We need your location to find nearby venues and book rides."
- `NSCameraUsageDescription` - "We need camera access to update your profile photo." (future)
- `NSPhotoLibraryUsageDescription` - "We need photo library access to update your profile photo." (future)

**App Store Requirements:**
- Privacy Policy URL
- Terms of Service URL
- Support URL
- App Store screenshots (6+ required)
- App icon (1024x1024px)
- App description and keywords
- Age rating: 4+
- Categories: Travel, Navigation
- Apple Developer account ($99/year)

---

### 7.2 Android

**Minimum Version:** Android 6.0 (API level 23)

**Required Permissions (AndroidManifest.xml):**
- `ACCESS_FINE_LOCATION` - GPS location
- `ACCESS_COARSE_LOCATION` - Network location
- `INTERNET` - API calls
- `CAMERA` - Profile photo (future)
- `READ_EXTERNAL_STORAGE` - Photo library (future)

**Play Store Requirements:**
- Privacy Policy URL
- Terms of Service URL
- Support email
- Play Store screenshots (4+ required)
- Feature graphic (1024x500px)
- App icon (512x512px)
- App description
- Content rating questionnaire
- Categories: Maps & Navigation
- Google Play Developer account ($25 one-time)

---

### 7.3 Build Configuration

**Expo Application Services (EAS):**
- ✅ Use EAS Build for production builds
- ✅ Configure eas.json with profiles:
  - `development` - Dev client
  - `preview` - Internal testing
  - `production` - App Store/Play Store
- ✅ Set up app identifiers:
  - iOS: `com.rora.roraexpo`
  - Android: `com.rora.roraexpo`
- ✅ Configure environment variables (API keys, tokens)
- ✅ Set up code signing:
  - iOS: App Store Connect credentials
  - Android: Keystore

---

## 8. Implementation Status

### 8.1 Completion Summary

**Overall Progress: ~60% Complete**

| Module | Status | Completion | Critical Gaps |
|--------|--------|------------|---------------|
| Location Services | ✅ Complete | 100% | None |
| Route Planning | ⚠️ Partial | 80% | Booking flow incomplete |
| Venue Discovery | ✅ Complete | 100% | None |
| Driver Management | ⚠️ Partial | 70% | Booking logic, favorites integration |
| Trip Management | ⚠️ Partial | 40% | No persistence, no detail screen, no active ride |
| User Profile | ⚠️ Partial | 50% | Hardcoded data, no auth |
| Settings | ⚠️ Partial | 30% | No persistence, no backend integration |
| Saved Locations | ⚠️ Partial | 60% | No add/edit flows, no persistence |
| Favorite Drivers | ⚠️ Partial | 70% | No add button, no persistence |
| Authentication | ❌ Missing | 0% | **CRITICAL BLOCKER** |
| Payment Processing | ❌ Missing | 0% | **CRITICAL BLOCKER** |
| Active Ride Tracking | ❌ Missing | 0% | **CRITICAL BLOCKER** |
| Offline Handling | ❌ Missing | 0% | **CRITICAL BLOCKER** |
| Error Boundaries | ❌ Missing | 0% | **P0 BLOCKER** |
| Notifications | ❌ Missing | 0% | Nice to have |
| Accessibility | ⚠️ Partial | 20% | Nice to have |

---

### 8.2 Fully Implemented Features ✅

1. **Location Services** (100%)
   - Permission handling with custom modal
   - GPS tracking with continuous updates
   - Reverse geocoding
   - Persistence to AsyncStorage

2. **Route Planning** (80%)
   - Google Places Autocomplete
   - Origin/destination selection
   - Route calculation (Directions API)
   - Price calculation
   - Map visualization with polyline
   - Swap locations

3. **Venue Discovery** (100%)
   - Search venues
   - Browse categories
   - Featured carousel
   - Nearby venues with distance calculation
   - Filter venues (Top Rated, Near Me, Quiet)
   - Venue detail page
   - "Get a Ride" integration

4. **Driver Directory** (70%)
   - Browse drivers
   - Filter by status (On Duty/Off Duty)
   - Driver detail page with profile info
   - Contact info display

5. **Trip Preview** (90%)
   - Trip details display
   - QR code generation
   - Swipeable pages
   - Auto-save to trip history
   - "Save Trip" button

---

### 8.3 Partially Implemented Features ⚠️

1. **Ride Booking Flow** (40%)
   - ✅ Route planning
   - ✅ Trip preview
   - ✅ Driver browsing
   - ❌ "Find Driver" button missing
   - ❌ Driver assignment logic missing
   - ❌ Trip status transitions missing
   - ❌ `/trip-selector` screen missing
   - ❌ `/trip-qr/[id]` screen missing

2. **Trip History** (40%)
   - ✅ UI with filters
   - ✅ Trip cards with all info
   - ✅ Status badges
   - ✅ Empty states
   - ❌ No persistence (all data lost on restart) **CRITICAL**
   - ❌ Trip detail screen missing
   - ❌ No receipt generation

3. **Settings** (30%)
   - ✅ UI for all settings sections
   - ✅ Toggle switches work
   - ❌ No persistence
   - ❌ No theme switching logic
   - ❌ No language switching logic
   - ❌ No payment methods integration

4. **Saved Locations** (60%)
   - ✅ View saved locations
   - ✅ Remove locations
   - ✅ Quick access for Home/Work
   - ❌ No add/edit flows **CRITICAL GAP**
   - ❌ No persistence
   - ❌ Not integrated in route-input autocomplete

5. **Favorite Drivers** (70%)
   - ✅ View favorites list
   - ✅ Remove from favorites
   - ✅ Quick actions UI
   - ❌ No "Add to Favorites" button in driver detail
   - ❌ No persistence
   - ❌ Call/Message placeholders only

---

### 8.4 Missing Features ❌

#### **P0 Critical Blockers** (Must Implement Before Launch)

1. **Authentication System** (0%)
   - No signup/login screens
   - No auth provider integration
   - No session management
   - No protected routes
   - **Impact:** Cannot have user accounts, cannot personalize, cannot monetize

2. **Trip Persistence** (0%)
   - All trip data lost on app restart
   - No AsyncStorage integration for trips
   - No backend integration
   - **Impact:** DATA LOSS - Users lose all trip history

3. **Complete Booking Flow** (40%)
   - Missing 3 screens: `/find-driver-info`, `/trip-selector`, `/trip-qr/[id]`
   - No driver assignment logic
   - No status transitions
   - **Impact:** Cannot complete ride booking end-to-end

4. **Active Ride Tracking** (0%)
   - No `/active-ride` screen
   - No real-time driver location updates
   - No ETA countdown
   - No trip completion screen
   - **Impact:** Users cannot monitor rides in progress

5. **Error Boundaries** (0%)
   - No React error boundary component
   - App crashes on unexpected errors
   - No error logging
   - **Impact:** Poor user experience, no crash visibility

6. **Debug Code Removal** (0%)
   - DEBUG_LOG calls in route-store.ts
   - Agent logging in google-maps.service.ts
   - Sends data to localhost
   - **Impact:** App will crash in production builds

#### **P1 High Priority** (Should Implement Before Launch)

7. **Payment Processing** (0%)
   - No Stripe integration
   - No payment method management
   - No trip payment flow
   - **Impact:** Cannot monetize

8. **Offline Handling** (0%)
   - No network detection
   - No offline banner
   - App hangs when offline
   - **Impact:** Poor UX, confusing errors

9. **Saved Locations Add/Edit** (0%)
   - Cannot add custom locations
   - Cannot edit existing locations
   - **Impact:** Feature incomplete, users frustrated

10. **Trip Detail Screen** (0%)
    - Cannot view full trip details
    - No receipt generation
    - No rebook option
    - **Impact:** Limited trip history usefulness

#### **P2 Nice to Have** (Post-Launch)

11. **Push Notifications** (0%)
12. **Onboarding Flow** (0%)
13. **Accessibility** (20% - partial)
14. **Theme Switching** (0%)
15. **Language Switching** (0%)
16. **Payment History** (0%)
17. **Refunds** (0%)

---

## 9. Gap Analysis

### 9.1 Critical Gaps to MVP

To reach **Minimum Viable Product (MVP)** status, the app MUST:

1. **Remove Debug Code** (2 days)
   - Remove all DEBUG_LOG calls
   - Remove agent logging
   - Add production build check

2. **Implement Authentication** (2 weeks)
   - Integrate Supabase Auth
   - Create signup/login/forgot password screens
   - Implement protected routes
   - Add session management
   - Migrate hardcoded user data to auth system

3. **Add Trip Persistence** (3 days)
   - Create trip-storage.service.ts
   - Integrate with AsyncStorage
   - Add hydrate/persist to trip-history-store
   - Test data persistence

4. **Complete Booking Flow** (1 week)
   - Create `/find-driver-info.tsx`
   - Create `/trip-selector.tsx`
   - Create `/trip-qr/[id].tsx`
   - Fix driver detail booking logic (add alert)
   - Implement driver assignment
   - Add status transition logic

5. **Implement Active Ride Tracking** (2 weeks)
   - Create `/active-ride.tsx`
   - Add real-time driver location updates (WebSocket or polling)
   - Add ETA calculation
   - Create trip completion screen
   - Add rating/review flow

6. **Add Error Boundaries** (2 days)
   - Create ErrorBoundary component
   - Wrap app layout
   - Integrate Sentry
   - Add error logging

7. **Implement Offline Detection** (3 days)
   - Add NetInfo integration
   - Create offline banner
   - Disable network actions when offline

8. **Add Saved Locations Flows** (1 week)
   - Create location search flow
   - Implement add/edit screens
   - Add persistence
   - Integrate with route-input autocomplete

**Total Estimated Time to MVP: 6-8 weeks** (1-2 developers)

---

### 9.2 Gaps to Full Launch

To be **App Store/Play Store Ready**, the app MUST also:

9. **Integrate Payment Processing** (2 weeks)
   - Set up Stripe account
   - Add Stripe SDK
   - Create payment methods screen
   - Implement trip payment flow
   - Add receipt generation

10. **Create Legal Documents** (1 week)
    - Write Privacy Policy
    - Write Terms of Service
    - Purchase domain and host documents
    - Add links in app

11. **Configure App Store Metadata** (1 week)
    - Write app descriptions
    - Create screenshots (6+ per platform)
    - Design app icon
    - Set up Apple Developer account
    - Set up Google Play Developer account

12. **Testing & QA** (2 weeks)
    - Write unit tests (70% coverage)
    - Write integration tests
    - Manual testing on physical devices
    - Fix all bugs

13. **Performance Optimization** (1 week)
    - Optimize images
    - Reduce bundle size
    - Add skeleton screens
    - Add loading states

14. **Push Notifications** (1 week)
    - Set up push notification service
    - Add trip status notifications
    - Test on devices

**Total Estimated Time to Launch: 10-14 weeks** (1-2 developers)

---

## 10. Appendix

### 10.1 Glossary

- **MVP:** Minimum Viable Product - Core features needed for launch
- **P0:** Priority 0 - Critical blocker, must fix before launch
- **P1:** Priority 1 - High priority, should fix before launch
- **P2:** Priority 2 - Nice to have, can ship without
- **P3:** Priority 3 - Low priority, future enhancement
- **FRD:** Functional Requirements Document
- **EAS:** Expo Application Services
- **AsyncStorage:** React Native local storage API
- **Zustand:** Lightweight state management library
- **expo-location:** Expo module for GPS access
- **react-native-maps:** Maps component for React Native

### 10.2 File References

**Key Files:**
- `/Users/joshuabowers/RoraExpo/app/(tabs)/index.tsx` - Home screen
- `/Users/joshuabowers/RoraExpo/app/route-input.tsx` - Route planning
- `/Users/joshuabowers/RoraExpo/app/trip-preview.tsx` - Trip preview
- `/Users/joshuabowers/RoraExpo/app/trip-history.tsx` - Trip history
- `/Users/joshuabowers/RoraExpo/app/driver/[id].tsx` - Driver detail
- `/Users/joshuabowers/RoraExpo/src/store/trip-history-store.ts` - Trip data store
- `/Users/joshuabowers/RoraExpo/src/services/google-maps.service.ts` - Maps API wrapper
- `/Users/joshuabowers/RoraExpo/maps-proxy/server.js` - Cloud Run proxy

### 10.3 External Resources

- **Expo Docs:** https://docs.expo.dev/
- **React Native Docs:** https://reactnative.dev/
- **Google Maps APIs:** https://developers.google.com/maps
- **Supabase Docs:** https://supabase.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **Sentry Docs:** https://docs.sentry.io/

---

**END OF FUNCTIONAL REQUIREMENTS DOCUMENT**
