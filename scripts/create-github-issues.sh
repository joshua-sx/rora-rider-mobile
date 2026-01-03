#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

REPO="joshua-sx/RoraExpo"

echo -e "${BLUE}Creating GitHub Issues for Rora Ride MVP...${NC}\n"

# Function to create an issue
create_issue() {
  local title="$1"
  local body="$2"
  local labels="$3"
  local milestone="$4"

  gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --body "$body" \
    --label "$labels" \
    --milestone "$milestone" || true

  echo -e "${GREEN}✓${NC} Created: $title"
}

# ============================================================================
# PHASE 0: FOUNDATION & INFRASTRUCTURE
# ============================================================================

echo -e "\n${YELLOW}Creating Phase 0 issues...${NC}"

# Supabase Setup
create_issue \
  "Setup Supabase project and local development environment" \
  "## Tasks
- [ ] Create Supabase project (dev + prod)
- [ ] Configure project settings (timezone, region)
- [ ] Set up environment variables (.env)
- [ ] Install Supabase CLI
- [ ] Initialize Supabase locally
- [ ] Link to remote project

## Acceptance Criteria
- Local Supabase instance running
- Connected to remote dev project
- Environment variables documented" \
  "phase-0-foundation,infrastructure,priority-critical" \
  "Phase 0: Foundation & Infrastructure"

# Database Schema - Core Tables
create_issue \
  "Create core database tables (orgs, profiles, memberships)" \
  "## Tables to Create
- \`orgs\` - island/organization entities
- \`profiles\` - extends auth.users
- \`org_memberships\` - user-org-role join table

## Schema Requirements
- All tables have proper primary keys
- Foreign keys with appropriate ON DELETE constraints
- Created/updated timestamps
- Proper data types per spec

## Acceptance Criteria
- Migration files created
- Tables created in local DB
- Schema matches technical spec v0.4" \
  "phase-0-foundation,database,priority-critical" \
  "Phase 0: Foundation & Infrastructure"

create_issue \
  "Create driver & vehicle tables" \
  "## Tables to Create
- \`drivers\` - driver profiles
- \`vehicles\` - driver vehicles
- \`driver_verifications\` - verification badges

## Schema Requirements
- Link drivers to profiles (user_id FK)
- Link vehicles to drivers
- Verification types: govt_id, vehicle_reg, insurance, background_check
- Status tracking: pending, approved, expired, rejected

## Acceptance Criteria
- Migration files created
- Tables support driver directory features
- Can track multiple vehicles per driver" \
  "phase-0-foundation,database,priority-critical" \
  "Phase 0: Foundation & Infrastructure"

create_issue \
  "Create ride system tables" \
  "## Tables to Create
- \`price_quotes\` - route quotes
- \`rides\` - ride requests/bookings
- \`ride_offers\` - driver offers (with counter-offer support)
- \`ride_events\` - append-only audit log
- \`qr_tokens\` - ride confirmation tokens

## Schema Requirements
- Ride state machine support (open, assigned, confirmed, completed, canceled, expired)
- Offer negotiation support (initial, counter offers)
- QR tokens: single-use, expiring, scanned_at tracking
- Event types for all state transitions

## Acceptance Criteria
- All ride lifecycle states supported
- Counter-offer threading via parent_offer_id
- QR security (expiry, single-use, driver validation)" \
  "phase-0-foundation,database,priority-critical" \
  "Phase 0: Foundation & Infrastructure"

create_issue \
  "Create places & favorites tables" \
  "## Tables to Create
- \`places\` - curated destinations
- \`place_photos\` - place image gallery
- \`place_submissions\` - vendor-proposed places
- \`favorite_drivers\` - rider favorites
- \`favorite_places\` - rider favorites

## Schema Requirements
- Places: type, lat/lng, hours (jsonb), featured flag
- Place submissions: vendor-only access, admin review workflow
- Favorites: composite PKs (org_id, user_id, target_id)

## Acceptance Criteria
- Explore tab data model complete
- Vendor submission workflow supported
- Favorites linked to users" \
  "phase-0-foundation,database,priority-medium" \
  "Phase 0: Foundation & Infrastructure"

create_issue \
  "Create notification & subscription tables" \
  "## Tables to Create
- \`rider_devices\` - push notification tokens
- \`driver_devices\` - push notification tokens
- \`subscriptions\` - rider subscription status (or add field to profiles)

## Schema Requirements
- Device tokens: unique, platform (ios/android), last_seen_at
- Subscriptions: tier, expires_at, payment provider reference

## Acceptance Criteria
- Push notification delivery supported
- Subscription gate for driver directory enforceable
- Device management (upsert on token change)" \
  "phase-0-foundation,database,priority-high" \
  "Phase 0: Foundation & Infrastructure"

# Database Indexes
create_issue \
  "Add database performance indexes" \
  "## Indexes to Create
- \`price_quotes(org_id, rider_id, created_at)\`
- \`rides(org_id, rider_id, created_at)\`
- \`rides(org_id, status, created_at)\`
- \`rides(org_id, assigned_driver_id, status)\`
- \`ride_offers(ride_id, driver_id, created_at)\`
- \`ride_events(ride_id, created_at)\`
- \`drivers(org_id, is_active)\`
- \`places(org_id, type, is_featured)\`

## Acceptance Criteria
- All critical query paths indexed
- Query plans reviewed (EXPLAIN ANALYZE)
- No full table scans on large tables" \
  "phase-0-foundation,database,priority-high" \
  "Phase 0: Foundation & Infrastructure"

# RLS Policies
create_issue \
  "Implement RLS policies for profiles & orgs" \
  "## RLS Policies Needed
- \`profiles\`: users can read/update own profile
- \`orgs\`: members can read their org
- \`org_memberships\`: members can read, admins can write

## Acceptance Criteria
- RLS enabled on all tables
- Users isolated to their orgs
- Test: user A cannot read user B's profile
- Test: user cannot access orgs they're not a member of" \
  "phase-0-foundation,security,priority-critical" \
  "Phase 0: Foundation & Infrastructure"

create_issue \
  "Implement RLS policies for drivers & vehicles" \
  "## RLS Policies Needed
- \`drivers\`: public read within org, driver can update own
- \`vehicles\`: public read within org, driver can update own
- \`driver_verifications\`: public read within org, admins write

## Acceptance Criteria
- Drivers visible to all org members (directory)
- Drivers can only edit their own profile
- Admins can manage verifications
- Test: driver A cannot edit driver B's profile" \
  "phase-0-foundation,security,priority-critical" \
  "Phase 0: Foundation & Infrastructure"

create_issue \
  "Implement RLS policies for rides & offers" \
  "## RLS Policies Needed
- \`price_quotes\`: rider can read/create own
- \`rides\`: rider/driver can read own rides, no direct writes
- \`ride_offers\`: rider sees offers for their rides, driver sees own offers
- \`ride_events\`: rider/driver can read events for their rides
- \`qr_tokens\`: no direct client access (Edge Function only)

## Acceptance Criteria
- Riders isolated to their rides
- Drivers only see offers they created
- All writes go through Edge Functions
- Test: rider A cannot see rider B's rides/offers
- Test: direct writes to rides table fail from client" \
  "phase-0-foundation,security,priority-critical" \
  "Phase 0: Foundation & Infrastructure"

create_issue \
  "Implement RLS policies for places & favorites" \
  "## RLS Policies Needed
- \`places\`: public read within org, admins write
- \`place_submissions\`: submitter + admins read, submitter create
- \`favorite_drivers\`: user can read/write own
- \`favorite_places\`: user can read/write own

## Acceptance Criteria
- Places visible to all org members
- Vendors can only see their own submissions
- Users can manage their own favorites
- Test: vendor A cannot see vendor B's submissions" \
  "phase-0-foundation,security,priority-high" \
  "Phase 0: Foundation & Infrastructure"

# Storage Buckets
create_issue \
  "Configure Supabase storage buckets" \
  "## Buckets to Create
- \`driver-photos\` (private, signed URLs)
- \`vehicle-photos\` (private, signed URLs)
- \`place-photos\` (public read)

## Configuration
- File size limits (e.g., 5MB per image)
- Allowed MIME types (image/jpeg, image/png, image/webp)
- Upload policies (who can upload)

## Acceptance Criteria
- All buckets created
- Policies configured
- Test upload from client
- Signed URLs working for private buckets" \
  "phase-0-foundation,infrastructure,priority-high" \
  "Phase 0: Foundation & Infrastructure"

# Authentication
create_issue \
  "Configure Supabase Auth and email templates" \
  "## Tasks
- [ ] Configure email/password auth provider
- [ ] Optional: Add OAuth (Google, Apple)
- [ ] Customize email templates (welcome, password reset)
- [ ] Set up post-signup trigger → create profile row
- [ ] Configure redirect URLs for mobile app

## Acceptance Criteria
- Users can sign up via email/password
- Email verification working
- Profile row auto-created on signup
- Test signup/login/logout flow" \
  "phase-0-foundation,infrastructure,priority-critical" \
  "Phase 0: Foundation & Infrastructure"

# ============================================================================
# PHASE 1: BACKEND CORE (EDGE FUNCTIONS)
# ============================================================================

echo -e "\n${YELLOW}Creating Phase 1 issues...${NC}"

create_issue \
  "Setup Edge Functions directory and shared utilities" \
  "## Tasks
- [ ] Initialize \`supabase/functions/\` directory
- [ ] Create shared utilities (DB helpers, auth validation)
- [ ] Configure CORS for mobile app requests
- [ ] Set up TypeScript types for requests/responses

## Acceptance Criteria
- Edge Functions framework ready
- Auth middleware working
- CORS configured for Expo app
- Helper functions for common tasks" \
  "phase-1-backend,edge-function,priority-critical" \
  "Phase 1: Backend Core"

create_issue \
  "Implement Quote Edge Function (POST /quote)" \
  "## Requirements
- Accept: org_id, origin/destination (text + lat/lng), optional passengers_count
- Validate org membership
- Load org pricing_rules from DB
- Calculate distance via Google Maps Distance Matrix API
- Compute estimate_low/high + breakdown
- Insert price_quotes row
- Return: quote_id, estimate, currency, breakdown

## Acceptance Criteria
- Quote generation working
- Pricing rules applied correctly
- Distance calculation accurate
- Unit tests passing
- Error handling for invalid routes" \
  "phase-1-backend,edge-function,priority-critical" \
  "Phase 1: Backend Core"

create_issue \
  "Define pricing rules JSONB schema and seed test data" \
  "## Schema Definition
\`\`\`json
{
  \"base_fare\": 5.00,
  \"per_km_rate\": 2.00,
  \"per_minute_rate\": 0.50,
  \"minimum_fare\": 10.00,
  \"currency\": \"XCD\",
  \"estimate_variance\": 0.15
}
\`\`\`

## Tasks
- [ ] Document pricing rules schema
- [ ] Add validation function
- [ ] Seed test org with pricing rules

## Acceptance Criteria
- Schema documented
- Test org has valid pricing rules
- Quote function uses rules correctly" \
  "phase-1-backend,database,priority-high" \
  "Phase 1: Backend Core"

create_issue \
  "Implement Ride Creation Edge Function (POST /rides/create)" \
  "## Requirements
- Accept: org_id, quote_id, optional target_driver_id, optional notes
- Validate quote ownership
- Validate driver exists (if targeted)
- Check subscription (if targeted request)
- Insert rides row (status=open, expires_at=NOW()+15min)
- Insert ride_events row (ride_requested)
- Return: ride_id, status, expiry

## Acceptance Criteria
- Open request creation working
- Targeted request creation working
- Subscription gate enforced
- Expiry logic correct
- Unit tests passing" \
  "phase-1-backend,edge-function,priority-critical" \
  "Phase 1: Backend Core"

create_issue \
  "Implement Offer Creation Edge Function (POST /rides/:id/offer)" \
  "## Requirements (Driver creates offer)
- Accept: ride_id, offer_type (initial|counter), price, eta_minutes, optional parent_offer_id
- Validate driver membership
- Validate ride is open and not expired
- If counter: validate parent_offer_id, mark parent as countered
- Insert ride_offers row (status=offered)
- Insert ride_events row (offer_created)
- Trigger push notification to rider
- Return: offer_id

## Acceptance Criteria
- Initial offer creation working
- Counter-offer creation working
- Parent offer marked as countered
- Expired rides reject offers
- Notification sent to rider" \
  "phase-1-backend,edge-function,priority-critical" \
  "Phase 1: Backend Core"

create_issue \
  "Implement Offer Selection Edge Function (POST /rides/:id/select-offer)" \
  "## Requirements (Rider chooses offer - ATOMIC)
- Accept: org_id, offer_id
- Validate rider owns ride
- Validate ride is open and not expired
- Validate offer is offered and not withdrawn
- **Transaction:**
  - Update ride (status=assigned, assigned_driver_id, assigned_offer_id)
  - Update selected offer (status=accepted)
  - Mark other offers as rejected_by_rider
  - Insert ride_events (ride_assigned)
  - Generate QR token (32-char random, expires 15min)
- Return: ride summary, driver info, qr_token

## Acceptance Criteria
- Atomic assignment (no race conditions)
- Double-assignment prevented
- QR token generated
- Other offers rejected
- Notification sent to driver" \
  "phase-1-backend,edge-function,priority-critical" \
  "Phase 1: Backend Core"

create_issue \
  "Implement QR Confirmation Edge Function (POST /rides/:id/confirm)" \
  "## Requirements (Driver scans QR)
- Accept: ride_id, qr_token
- Validate token exists, not scanned, not expired
- Validate ride is assigned
- Validate scanner is assigned_driver_id
- **Transaction:**
  - Update ride (status=confirmed, confirmed_at=NOW())
  - Update QR token (scanned_at=NOW(), scanned_by)
  - Insert ride_events (ride_confirmed)
- Return: success

## Acceptance Criteria
- QR validation working
- Expired tokens rejected
- Already-scanned tokens rejected (replay prevention)
- Wrong driver rejected
- Notification sent to rider" \
  "phase-1-backend,edge-function,priority-critical" \
  "Phase 1: Backend Core"

create_issue \
  "Implement Ride Completion Edge Function (POST /rides/:id/complete)" \
  "## Requirements (Driver marks complete)
- Accept: ride_id, optional final_price
- Validate driver owns ride
- Validate ride is confirmed or in_progress
- Update ride (status=completed, completed_at=NOW(), final_price)
- Insert ride_events (ride_completed)
- Return: success

## Acceptance Criteria
- Completion flow working
- Final price recorded
- Notification sent to rider
- Earnings calculated correctly" \
  "phase-1-backend,edge-function,priority-high" \
  "Phase 1: Backend Core"

create_issue \
  "Implement Ride Cancellation Edge Function (POST /rides/:id/cancel)" \
  "## Requirements
- Accept: ride_id, canceled_by (rider|driver), optional reason
- Validate caller owns ride
- Validate ride not already completed
- Update ride (status=canceled, canceled_at=NOW())
- Insert ride_events (ride_canceled_by_rider or ride_canceled_by_driver)
- Return: success

## Acceptance Criteria
- Rider cancellation working
- Driver cancellation working
- Completed rides cannot be canceled
- Event log records who canceled" \
  "phase-1-backend,edge-function,priority-medium" \
  "Phase 1: Backend Core"

create_issue \
  "Implement Device Registration Edge Functions" \
  "## Edge Functions
1. **POST /rider/register-device**
   - Accept: org_id, device_token, platform
   - Upsert rider_devices

2. **POST /driver/register-device**
   - Accept: org_id, device_token, platform
   - Upsert driver_devices

## Acceptance Criteria
- Device token storage working
- Upsert on token change
- Old tokens cleaned up (optional)" \
  "phase-1-backend,edge-function,priority-high" \
  "Phase 1: Backend Core"

create_issue \
  "Setup push notification delivery system (FCM/APNs)" \
  "## Tasks
- [ ] Create Firebase project (for FCM)
- [ ] Configure APNs certificates
- [ ] Write helper function to send push notifications
- [ ] Trigger notifications on:
  - New ride request (to eligible drivers)
  - New offer received (to rider)
  - Ride assigned (to driver)
  - Ride confirmed (to rider)
  - Ride completed (to both)

## Acceptance Criteria
- FCM working for Android
- APNs working for iOS
- Notification payloads include deep link data
- Test delivery on real devices" \
  "phase-1-backend,infrastructure,priority-high" \
  "Phase 1: Backend Core"

create_issue \
  "Define driver eligibility and wave notification strategy" \
  "## Strategy Definition
- **Wave 1:** Drivers within 5km + online + has_seats ≥ passengers
- **Wave 2 (2min delay):** Expand radius to 10km
- **Wave 3 (5min delay):** Broadcast to all online drivers in org

## Implementation
- Add logic to ride creation function
- Query eligible drivers based on wave criteria
- Schedule delayed wave notifications

## Acceptance Criteria
- Nearby drivers prioritized
- Wave escalation working
- No spam to far-away drivers
- Documented for future tuning" \
  "phase-1-backend,edge-function,priority-medium" \
  "Phase 1: Backend Core"

# ============================================================================
# PHASE 2: RIDER APP
# ============================================================================

echo -e "\n${YELLOW}Creating Phase 2 issues...${NC}"

create_issue \
  "Initialize Expo app and install dependencies" \
  "## Tasks
- [ ] Initialize Expo app
- [ ] Install dependencies:
  - @supabase/supabase-js
  - React Navigation (tabs + stack)
  - React Native Maps
  - Google Places Autocomplete
  - QR code display library
  - expo-notifications
- [ ] Configure environment variables
- [ ] Set up Supabase client singleton

## Acceptance Criteria
- App builds on iOS + Android
- Supabase connection working
- Navigation skeleton ready" \
  "phase-2-rider-app,mobile-app,priority-critical" \
  "Phase 2: Rider App"

create_issue \
  "Build authentication screens (Login, Signup, Password Reset)" \
  "## Screens
- Login (email/password)
- Signup (email/password)
- Password Reset

## Features
- Form validation
- Error handling
- Auth state management (Context/Zustand)
- Auto-redirect (logged in → Home, logged out → Login)

## Acceptance Criteria
- Users can sign up
- Users can log in
- Users can reset password
- Auth state persists across app restarts" \
  "phase-2-rider-app,mobile-app,priority-critical" \
  "Phase 2: Rider App"

create_issue \
  "Setup tab navigation (Home, Drivers, Explore, Profile)" \
  "## Tasks
- [ ] Create bottom tab navigator
- [ ] Add tab icons + labels
- [ ] Create placeholder screens for each tab
- [ ] Test tab switching

## Acceptance Criteria
- 4 tabs visible
- Navigation working
- Active tab highlighted" \
  "phase-2-rider-app,mobile-app,priority-high" \
  "Phase 2: Rider App"

create_issue \
  "Build Home tab: Map view with origin/destination inputs" \
  "## Features
- Map displaying user location (request permissions)
- Origin/destination autocomplete inputs (Google Places)
- 'Use current location' button
- Swap origin/destination button
- Render origin/destination markers on map

## Acceptance Criteria
- Map shows user location
- Autocomplete working
- Markers render correctly
- Permissions handled gracefully" \
  "phase-2-rider-app,mobile-app,priority-critical" \
  "Phase 2: Rider App"

create_issue \
  "Build Home tab: Quote display and request flow" \
  "## Features
- Call POST /quote Edge Function
- Display estimate range (low-high)
- Show price breakdown (base, per-km, etc.)
- 'Request Ride' button → create ride
- Navigate to Offers screen

## Acceptance Criteria
- Quote displayed correctly
- Request ride creates ride record
- Loading states working
- Error handling (invalid route, etc.)" \
  "phase-2-rider-app,mobile-app,priority-critical" \
  "Phase 2: Rider App"

create_issue \
  "Build Offers screen (driver offers list)" \
  "## Features
- Poll/subscribe to ride_offers for active ride
- Display driver cards (photo, name, vehicle, price, ETA)
- 'Accept Offer' button → select offer
- Counter-offer display (thread view)
- Navigate to Ride Confirmation on acceptance

## Acceptance Criteria
- Offers displayed in real-time
- Rider can accept offer
- Counter-offers shown clearly
- Loading/empty states working" \
  "phase-2-rider-app,mobile-app,priority-critical" \
  "Phase 2: Rider App"

create_issue \
  "Build Ride Confirmation screen (QR code + driver info)" \
  "## Features
- Display QR code (from qr_token)
- Show driver info (name, photo, vehicle, plate)
- Show ride details (origin, destination, price)
- Poll ride status → when confirmed, show 'Trip Started'
- 'Cancel Ride' button (before confirmation)

## Acceptance Criteria
- QR code renders correctly
- Driver info displayed
- Status updates in real-time
- Cancel button working" \
  "phase-2-rider-app,mobile-app,priority-critical" \
  "Phase 2: Rider App"

create_issue \
  "Build Drivers tab: Directory list with subscription gate" \
  "## Features
- Check subscription status
- If not subscribed: show paywall/upgrade prompt
- If subscribed: show driver list
- Fetch drivers (with vehicles, verifications)
- Display driver cards (photo, name, verification badges)
- Filter/sort options (verified only, alphabetical, etc.)

## Acceptance Criteria
- Subscription gate enforced
- Driver list displayed
- Filters working
- Performance good (100+ drivers)" \
  "phase-2-rider-app,mobile-app,priority-high" \
  "Phase 2: Rider App"

create_issue \
  "Build Driver Profile screen (bio, vehicle, get-ride CTA)" \
  "## Features
- Show driver photo, bio, vehicle details, photos
- Show verification badges
- 'Get a Ride' button → prefill Home with target_driver_id
- 'Add to Favorites' button

## Acceptance Criteria
- Driver profile displays correctly
- 'Get a Ride' prefills targeted request
- Favorites toggle working" \
  "phase-2-rider-app,mobile-app,priority-high" \
  "Phase 2: Rider App"

create_issue \
  "Build Explore tab: Places list and filtering" \
  "## Features
- Fetch places (filter by type, search)
- Display place cards (photo, name, type, distance)
- Category filter tabs (All, Restaurants, Hotels, Beaches, etc.)

## Acceptance Criteria
- Places displayed
- Filters working
- Search working
- Performance good (100+ places)" \
  "phase-2-rider-app,mobile-app,priority-medium" \
  "Phase 2: Rider App"

create_issue \
  "Build Place Detail screen (photos, info, get-ride CTA)" \
  "## Features
- Show photos (carousel)
- Show description, address, phone, website, hours
- 'Get a Ride' button → prefill Home destination
- 'Add to Favorites' button

## Acceptance Criteria
- Place detail displays correctly
- 'Get a Ride' prefills destination
- Favorites toggle working
- External links (phone, website) working" \
  "phase-2-rider-app,mobile-app,priority-medium" \
  "Phase 2: Rider App"

create_issue \
  "Build Profile tab: User info and edit screen" \
  "## Features
- Display user name, email, phone
- Edit profile button → edit screen
- Update profile via Supabase

## Acceptance Criteria
- Profile displays correctly
- Edit screen working
- Updates persist
- Validation working" \
  "phase-2-rider-app,mobile-app,priority-medium" \
  "Phase 2: Rider App"

create_issue \
  "Build Trip History list and Trip Detail screen" \
  "## Features
- Fetch rides (where rider_id = user)
- Display trip cards (date, driver, origin→destination, price)
- Tap card → Trip Detail screen
- Trip Detail: show timeline (ride_events), driver info, price

## Acceptance Criteria
- Trip history displayed
- Timeline accurate
- 'Report Issue' button present (placeholder)
- Performance good (paginated if needed)" \
  "phase-2-rider-app,mobile-app,priority-medium" \
  "Phase 2: Rider App"

create_issue \
  "Build Favorites screens (drivers + places)" \
  "## Features
- 'Favorite Drivers' list (from favorite_drivers)
- 'Favorite Places' list (from favorite_places)
- Tap to navigate to driver/place detail
- Remove from favorites

## Acceptance Criteria
- Favorites displayed
- Navigation working
- Remove working
- Empty state displayed" \
  "phase-2-rider-app,mobile-app,priority-low" \
  "Phase 2: Rider App"

create_issue \
  "Build Settings screen (org, currency, notifications, logout)" \
  "## Features
- Default island/org selector
- Currency preference
- Notification preferences toggle
- Privacy policy / Terms links
- Logout button

## Acceptance Criteria
- Settings persist
- Org selector working (if multi-org)
- Logout clears auth state
- External links working" \
  "phase-2-rider-app,mobile-app,priority-low" \
  "Phase 2: Rider App"

create_issue \
  "Implement push notifications (rider app)" \
  "## Tasks
- [ ] Request notification permissions
- [ ] Register device token (POST /rider/register-device)
- [ ] Handle foreground notifications (show alert)
- [ ] Handle background notifications (navigate)
- [ ] Test delivery (offer received, ride assigned, etc.)

## Acceptance Criteria
- Permissions requested on launch
- Token registered
- Notifications displayed
- Deep links working" \
  "phase-2-rider-app,mobile-app,priority-high" \
  "Phase 2: Rider App"

create_issue \
  "Implement subscription paywall and in-app purchases" \
  "## Tasks
- [ ] Build subscription screen (pricing, features)
- [ ] Integrate App Store / Google Play IAP
- [ ] Update profiles.subscription_tier on purchase
- [ ] Handle subscription restoration

## Acceptance Criteria
- Paywall displayed for non-subscribers
- Purchase flow working (sandbox)
- Subscription unlocks driver directory
- Restore purchases working" \
  "phase-2-rider-app,mobile-app,priority-medium" \
  "Phase 2: Rider App"

# ============================================================================
# PHASE 3: DRIVER APP
# ============================================================================

echo -e "\n${YELLOW}Creating Phase 3 issues...${NC}"

create_issue \
  "Setup driver app project and branding" \
  "## Tasks
- [ ] Fork/clone rider app OR create separate app
- [ ] Configure driver-specific branding (colors, name, icons)
- [ ] Set up driver navigation (Online Toggle, Requests, Earnings, Profile)

## Acceptance Criteria
- Driver app builds separately
- Branding distinct from rider app
- Navigation structure ready" \
  "phase-3-driver-app,mobile-app,priority-critical" \
  "Phase 3: Driver App"

create_issue \
  "Build driver authentication and verification gate" \
  "## Features
- Reuse Login/Signup screens
- Add driver verification gate (check drivers table)
- Prevent non-drivers from accessing app

## Acceptance Criteria
- Only verified drivers can access
- Non-drivers see 'pending verification' screen
- Auth flow working" \
  "phase-3-driver-app,mobile-app,priority-critical" \
  "Phase 3: Driver App"

create_issue \
  "Build driver home: Online toggle and requests list" \
  "## Features
- Online toggle (update drivers.is_active)
- Visual feedback (online=green, offline=gray)
- Subscribe to rides (status=open, eligible)
- Display request cards (origin→destination, passengers, quote)
- 'View Details' → Request Detail screen

## Acceptance Criteria
- Online toggle working
- Requests displayed in real-time
- Only eligible requests shown
- Performance good (many concurrent requests)" \
  "phase-3-driver-app,mobile-app,priority-critical" \
  "Phase 3: Driver App"

create_issue \
  "Build request detail screen (accept/counter/decline)" \
  "## Features
- Show request info (rider name, origin, destination, notes)
- 'Accept' button → create initial offer
- 'Counter' input + button → create counter-offer
- 'Decline' button → dismiss request

## Acceptance Criteria
- Request details displayed
- Accept creates offer (POST /rides/:id/offer)
- Counter creates offer with parent_offer_id
- Decline removes from list" \
  "phase-3-driver-app,mobile-app,priority-critical" \
  "Phase 3: Driver App"

create_issue \
  "Build assigned ride screen (navigation + QR scanner)" \
  "## Features
- Show 'You got the ride!' notification
- Display rider info, pickup, destination
- 'Start Navigation' button (Google Maps/Waze)
- 'Scan QR' button → open QR scanner
- QR Scanner: scan rider QR, call POST /rides/:id/confirm
- On success: navigate to In-Progress screen

## Acceptance Criteria
- Assignment notification working
- Navigation deep links working
- QR scanner functional
- Confirmation flow working" \
  "phase-3-driver-app,mobile-app,priority-critical" \
  "Phase 3: Driver App"

create_issue \
  "Build in-progress and complete ride screens" \
  "## Features
- In-Progress: show destination, 'Complete Ride' button
- Optional: input final price (if different from quote)
- Call POST /rides/:id/complete
- Completion: show success, display earnings, 'Back to Requests'

## Acceptance Criteria
- Completion flow working
- Earnings displayed correctly
- Final price editable (optional)
- Navigation back to requests" \
  "phase-3-driver-app,mobile-app,priority-high" \
  "Phase 3: Driver App"

create_issue \
  "Build driver earnings summary screen" \
  "## Features
- Fetch completed rides (assigned_driver_id = user)
- Display daily/weekly/monthly earnings (sum final_price)
- Show ride count
- Optional: earnings chart

## Acceptance Criteria
- Earnings calculated correctly
- Time period selector working
- Performance good (paginated)" \
  "phase-3-driver-app,mobile-app,priority-medium" \
  "Phase 3: Driver App"

create_issue \
  "Build driver profile edit screen" \
  "## Features
- Edit bio, phone, profile photo
- Edit vehicle info (make, model, plate, color, seats)
- Upload vehicle photos
- Display verification status (badges)

## Acceptance Criteria
- Profile updates persist
- Vehicle updates persist
- Photo uploads working (to storage buckets)
- Verification status displayed" \
  "phase-3-driver-app,mobile-app,priority-medium" \
  "Phase 3: Driver App"

create_issue \
  "Build verification document upload screen" \
  "## Features
- Upload govt ID, vehicle registration, insurance
- Show pending/approved/expired status
- Link to admin review

## Acceptance Criteria
- Document upload working
- Status displayed correctly
- Admin can review (via dashboard)" \
  "phase-3-driver-app,mobile-app,priority-low" \
  "Phase 3: Driver App"

create_issue \
  "Implement push notifications (driver app)" \
  "## Tasks
- [ ] Request notification permissions
- [ ] Register device token (POST /driver/register-device)
- [ ] Handle notifications:
  - New ride request
  - Offer accepted
  - Ride canceled

## Acceptance Criteria
- Token registered
- Notifications displayed
- Deep links working" \
  "phase-3-driver-app,mobile-app,priority-high" \
  "Phase 3: Driver App"

# ============================================================================
# PHASE 4: ADMIN DASHBOARD
# ============================================================================

echo -e "\n${YELLOW}Creating Phase 4 issues...${NC}"

create_issue \
  "Setup admin dashboard (Next.js or React)" \
  "## Tasks
- [ ] Initialize web app (Next.js/React)
- [ ] Set up Supabase client
- [ ] Authenticate as admin (check org_memberships.role = 'admin')
- [ ] Create dashboard layout

## Acceptance Criteria
- Dashboard builds
- Admin auth working
- Layout ready" \
  "phase-4-admin,priority-medium" \
  "Phase 4: Admin Dashboard"

create_issue \
  "Build org management screen" \
  "## Features
- View/edit org settings (name, pricing rules, currency)
- Seed initial org data
- Manage org memberships

## Acceptance Criteria
- Org settings editable
- Pricing rules editor working
- Changes persist" \
  "phase-4-admin,priority-medium" \
  "Phase 4: Admin Dashboard"

create_issue \
  "Build driver management screen" \
  "## Features
- View all drivers (with verification status)
- Approve/reject driver verifications
- Manually add/remove drivers
- View driver details + photos

## Acceptance Criteria
- Driver list displayed
- Verification approval working
- Admin can manage drivers" \
  "phase-4-admin,priority-medium" \
  "Phase 4: Admin Dashboard"

create_issue \
  "Build place management screen" \
  "## Features
- View curated places
- Add/edit/delete places
- Upload place photos
- Review place submissions (from vendors)
- Approve/reject submissions → promote to places

## Acceptance Criteria
- Place CRUD working
- Photo upload working
- Vendor submissions reviewable
- Approval promotes to places" \
  "phase-4-admin,priority-medium" \
  "Phase 4: Admin Dashboard"

create_issue \
  "Build ride monitoring screen" \
  "## Features
- View recent rides (all statuses)
- View ride events timeline
- View ride reports (if user reports issue)
- Filter by status, date, driver

## Acceptance Criteria
- Ride list displayed
- Event timeline visible
- Reports visible (basic)" \
  "phase-4-admin,priority-low" \
  "Phase 4: Admin Dashboard"

# ============================================================================
# PHASE 5: TESTING & QA
# ============================================================================

echo -e "\n${YELLOW}Creating Phase 5 issues...${NC}"

create_issue \
  "Write unit tests for Edge Functions" \
  "## Test Coverage
- Quote calculation logic
- Ride creation validation
- Offer selection (atomic assignment)
- QR confirmation validation
- RLS policy enforcement

## Acceptance Criteria
- 80%+ code coverage
- Critical paths tested
- Edge cases covered" \
  "phase-5-testing,priority-high" \
  "Phase 5: Testing & QA"

create_issue \
  "Write integration tests for ride flows" \
  "## Test Scenarios
- Full flow: quote → request → offer → assign → confirm → complete
- Counter-offer flow
- Targeted request flow
- Subscription gate (non-subscribers blocked)
- Ride expiry (expired rides reject offers)
- QR expiry + replay prevention

## Acceptance Criteria
- All critical flows tested end-to-end
- Tests run in CI/CD
- No flaky tests" \
  "phase-5-testing,priority-high" \
  "Phase 5: Testing & QA"

create_issue \
  "Manual QA on real devices (iOS + Android)" \
  "## Test Checklist
- [ ] Rider app: full flow on iOS
- [ ] Rider app: full flow on Android
- [ ] Driver app: full flow on iOS
- [ ] Driver app: full flow on Android
- [ ] Push notifications (real FCM/APNs)
- [ ] Photo uploads
- [ ] Edge cases (cancellations, expirations, wrong QR, etc.)

## Acceptance Criteria
- No critical bugs found
- UX smooth on both platforms
- Notifications reliable" \
  "phase-5-testing,priority-critical" \
  "Phase 5: Testing & QA"

create_issue \
  "Performance testing (100+ drivers, 100+ rides)" \
  "## Test Cases
- Scroll performance (driver directory with 100+ drivers)
- Trip history (100+ rides, pagination)
- Concurrent offer selection (race condition test)
- Database query performance (check indexes)

## Acceptance Criteria
- No lag on large datasets
- Pagination working
- Race conditions prevented
- Query times < 500ms" \
  "phase-5-testing,priority-medium" \
  "Phase 5: Testing & QA"

# ============================================================================
# PHASE 6: DEPLOYMENT
# ============================================================================

echo -e "\n${YELLOW}Creating Phase 6 issues...${NC}"

create_issue \
  "Deploy Edge Functions to production" \
  "## Tasks
- [ ] Deploy all Edge Functions to Supabase production
- [ ] Configure production secrets (Google Maps API, FCM keys)
- [ ] Test Edge Functions in prod environment

## Acceptance Criteria
- All functions deployed
- Secrets configured
- Smoke tests passing" \
  "phase-6-deployment,edge-function,priority-critical" \
  "Phase 6: Deployment"

create_issue \
  "Run production database migrations" \
  "## Tasks
- [ ] Review migration files
- [ ] Backup production DB (if existing data)
- [ ] Run migrations
- [ ] Verify schema matches spec

## Acceptance Criteria
- All tables created
- Indexes applied
- RLS policies enabled
- No data loss" \
  "phase-6-deployment,database,priority-critical" \
  "Phase 6: Deployment"

create_issue \
  "Seed production data (org, pricing, drivers, places)" \
  "## Data to Seed
- Initial org (first island)
- Pricing rules
- Initial verified drivers (10-20)
- Curated places (20-30)

## Acceptance Criteria
- Test org functional
- Drivers verified + visible
- Places browsable" \
  "phase-6-deployment,database,priority-critical" \
  "Phase 6: Deployment"

create_issue \
  "Build and submit Rider app to App Store + Google Play" \
  "## Tasks
- [ ] Build production iOS app (Xcode)
- [ ] Build production Android app (Android Studio)
- [ ] Create app store listings (screenshots, descriptions)
- [ ] Submit for review
- [ ] Handle review feedback

## Acceptance Criteria
- Apps submitted
- Approved for release
- Available in stores (or TestFlight/beta)" \
  "phase-6-deployment,mobile-app,priority-critical" \
  "Phase 6: Deployment"

create_issue \
  "Build and submit Driver app to App Store + Google Play" \
  "## Tasks
- [ ] Build production iOS app
- [ ] Build production Android app
- [ ] Create app store listings
- [ ] Submit for review
- [ ] Handle review feedback

## Acceptance Criteria
- Apps submitted
- Approved for release
- Available in stores (or TestFlight/beta)" \
  "phase-6-deployment,mobile-app,priority-critical" \
  "Phase 6: Deployment"

create_issue \
  "Deploy admin dashboard to production" \
  "## Tasks
- [ ] Build production bundle
- [ ] Deploy to Vercel/Netlify/Cloudflare Pages
- [ ] Configure production environment variables
- [ ] Test admin flows in prod

## Acceptance Criteria
- Dashboard live
- Admin auth working
- All features functional" \
  "phase-6-deployment,priority-medium" \
  "Phase 6: Deployment"

create_issue \
  "Setup monitoring and error tracking" \
  "## Tools
- Supabase logs (Edge Function errors)
- Sentry or Bugsnag (app crash reporting)
- PostHog/Mixpanel (analytics)

## Acceptance Criteria
- Error tracking configured
- Alerts set up for critical errors
- Analytics events firing" \
  "phase-6-deployment,infrastructure,priority-high" \
  "Phase 6: Deployment"

create_issue \
  "Write user documentation and support materials" \
  "## Documents
- User guide (how to request a ride)
- Driver onboarding guide (how to accept requests, QR scan)
- FAQ page (pricing, safety, verification)
- Support channel setup (email/WhatsApp)

## Acceptance Criteria
- Docs published
- Support channel live
- FAQ comprehensive" \
  "phase-6-deployment,priority-medium" \
  "Phase 6: Deployment"

# ============================================================================
# PHASE 7: LAUNCH & ITERATION
# ============================================================================

echo -e "\n${YELLOW}Creating Phase 7 issues...${NC}"

create_issue \
  "Recruit beta testers (riders + drivers)" \
  "## Goals
- 10-20 beta riders
- 5-10 beta drivers
- Diverse user profiles (tourists + locals)

## Acceptance Criteria
- Beta group formed
- Test devices registered
- Onboarding materials sent" \
  "phase-7-launch,priority-critical" \
  "Phase 7: Launch & Iteration"

create_issue \
  "Run 2-week beta test and collect feedback" \
  "## Activities
- Monitor ride volume daily
- Conduct user interviews (riders + drivers)
- Collect feedback surveys
- Track bugs/issues
- Fix critical bugs

## Acceptance Criteria
- 50+ rides completed
- Feedback collected
- Critical bugs fixed
- UX improvements identified" \
  "phase-7-launch,priority-critical" \
  "Phase 7: Launch & Iteration"

create_issue \
  "Public launch: announce and onboard initial users" \
  "## Tasks
- [ ] Announce launch (social media, local press)
- [ ] Onboard initial drivers (verify in-person if needed)
- [ ] Monitor first 100 rides closely
- [ ] Respond to user feedback quickly

## Acceptance Criteria
- Launch announced
- 100+ rides completed in first month
- No critical issues
- User feedback positive" \
  "phase-7-launch,priority-critical" \
  "Phase 7: Launch & Iteration"

create_issue \
  "Setup post-launch monitoring and metrics tracking" \
  "## Metrics to Track
- Daily ride volume
- Driver/rider retention (weekly/monthly)
- Average time-to-assignment (open request → assigned)
- Quote accuracy (avg quote vs final price)
- User-reported issues

## Acceptance Criteria
- Dashboard showing key metrics
- Weekly review process
- Alerts for anomalies" \
  "phase-7-launch,priority-high" \
  "Phase 7: Launch & Iteration"

create_issue \
  "Iterate based on launch data (pricing, features, UX)" \
  "## Potential Iterations
- Adjust pricing rules (if quotes too high/low)
- Refine driver eligibility/wave strategy
- Add most-requested features (e.g., scheduling)
- UX improvements (based on feedback)

## Acceptance Criteria
- Data-driven decisions
- At least 2 iterations in first 2 months
- User satisfaction improving" \
  "phase-7-launch,priority-medium" \
  "Phase 7: Launch & Iteration"

create_issue \
  "Plan expansion to second island (replicate org setup)" \
  "## Tasks
- [ ] Identify second island
- [ ] Recruit drivers
- [ ] Curate places
- [ ] Set island-specific pricing rules
- [ ] Launch soft beta

## Acceptance Criteria
- Second org operational
- Multi-tenant isolation verified
- Lessons from first island applied" \
  "phase-7-launch,priority-low" \
  "Phase 7: Launch & Iteration"

echo -e "\n${GREEN}✓ All issues created!${NC}"
echo -e "\nNext steps:"
echo -e "1. Visit https://github.com/joshua-sx/RoraExpo/issues to see all issues"
echo -e "2. Visit your project board to organize issues into columns"
echo -e "3. Start working through Phase 0 issues"
