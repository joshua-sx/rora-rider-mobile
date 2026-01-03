# tasks-03-driver-directory.md

## Spec References
- SPEC: Section 12 (Driver Directory)
- SPEC: Section 13 (Verification & Rora Pro)
- SPEC: Section 16 (Favorites)
- SPEC: Section 9 (Direct Driver Request)
- FR-31 to FR-34, FR-40 to FR-47, FR-55

## Relevant Files
- `src/features/drivers/` - Driver directory and profile screens
- `src/features/drivers/screens/` - Directory list, profile, favorites
- `src/features/drivers/components/` - Driver cards, filters, badges
- `src/store/drivers-store.ts` - Driver directory state (Zustand)
- `supabase/functions/get-drivers/` - Edge Function for directory listing
- `supabase/functions/direct-request/` - Edge Function for direct driver requests

## Notes
- Driver profiles cached locally (24h TTL)
- Filters: service area tags, capacity, languages, Rora Pro
- Favorited drivers get Wave 0 notification priority
- Direct requests notify only target driver
- Contact info (phone/WhatsApp) always visible if driver opted in

## Instructions for Completing Tasks
**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`.

---

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 `git checkout -b feature/driver-directory`

- [ ] 1.0 Seed Sample Driver Data (for MVP testing)
  - **Spec refs:** FR-40, FR-44
  - **Done means:** 10-15 sample drivers exist in database with realistic data
  - [ ] 1.1 Create migration: `supabase migration create seed_drivers`
  - [ ] 1.2 Insert sample `users` (driver role)
  - [ ] 1.3 Insert sample `driver_profiles` with:
    - Display names
    - Service area tags: ['airport', 'cruise_port', 'vip']
    - Seats: 4, 6, 8
    - Languages: ['en', 'es', 'fr', 'nl']
    - Vehicle type
    - Contact info (phone/WhatsApp, opt-in)
  - [ ] 1.4 Insert sample `driver_verifications` (mix of GOVERNMENT_REGISTERED and RORA_VERIFIED)
  - [ ] 1.5 Mark a few drivers as `is_rora_pro = true`
  - [ ] 1.6 Apply migration

- [ ] 2.0 Implement Driver Directory API (Backend)
  - **Spec refs:** FR-40, FR-41, FR-42
  - **Done means:** Edge Function returns driver list with filters applied
  - [ ] 2.1 Create Edge Function: `supabase functions new get-drivers`
  - [ ] 2.2 Input: `{ region_id, filters: { service_areas[], min_seats, languages[], rora_pro_only } }`
  - [ ] 2.3 Query `driver_profiles` joined with `driver_verifications`
  - [ ] 2.4 Apply filters (service_area_tags, seats, languages, is_rora_pro)
  - [ ] 2.5 Only return drivers with status = 'ACTIVE'
  - [ ] 2.6 Return: `{ drivers: [ { id, name, photo_url, badges, seats, languages, service_areas, contact_info } ] }`
  - [ ] 2.7 Test: no filters, with filters, Rora Pro only filter

- [ ] 3.0 Build Driver Directory Screen (UI)
  - **Spec refs:** SPEC §25 Screen 9 (Drivers Directory), FR-40, FR-41
  - **Done means:** Driver list displayed, filters working, search functional
  - [ ] 3.1 Create `src/features/drivers/screens/DriverDirectoryScreen.tsx`
  - [ ] 3.2 Fetch drivers from API on mount
  - [ ] 3.3 Cache drivers locally (AsyncStorage) with 24h TTL
  - [ ] 3.4 Display driver cards in scrollable list
  - [ ] 3.5 Add search input (filter locally by name)
  - [ ] 3.6 Add filters button (opens filter sheet)
  - [ ] 3.7 Implement filter sheet with toggles: Service Areas, Capacity, Languages, Rora Pro
  - [ ] 3.8 Filters off by default, combinable
  - [ ] 3.9 Track analytics: `filter_applied` when filters changed
  - [ ] 3.10 Test: browse drivers, apply filters, search by name

- [ ] 4.0 Build Driver Card Component
  - **Spec refs:** FR-40, FR-46
  - **Done means:** Reusable driver card shows photo, name, badges, key details
  - [ ] 4.1 Create `src/features/drivers/components/DriverCard.tsx`
  - [ ] 4.2 Display driver photo (or placeholder)
  - [ ] 4.3 Display name, verification badge icon (if verified)
  - [ ] 4.4 Display Rora Pro badge (if applicable)
  - [ ] 4.5 Display seats, languages (icons or text)
  - [ ] 4.6 Display service area tags as chips
  - [ ] 4.7 Add onPress handler (navigates to driver profile)
  - [ ] 4.8 Test: render card for verified driver, Rora Pro driver, unverified driver

- [ ] 5.0 Build Driver Profile Screen (UI)
  - **Spec refs:** SPEC §25 Screen 10 (Driver Profile), FR-43, FR-46
  - **Done means:** Full driver profile displayed, contact info visible, actions available
  - [ ] 5.1 Create `src/features/drivers/screens/DriverProfileScreen.tsx`
  - [ ] 5.2 Display large photo, name, verification badges, Rora Pro badge
  - [ ] 5.3 Display seats, languages, vehicle type, service area tags
  - [ ] 5.4 Display contact info (phone/WhatsApp) with call/message buttons (if opted in)
  - [ ] 5.5 Add "Favorite" button (toggle favorite status)
  - [ ] 5.6 Add "Request this driver" button (or "Not accepting requests" text if disabled)
  - [ ] 5.7 Track analytics: `driver_profile_viewed`
  - [ ] 5.8 Test: view profile, tap call button, tap favorite, tap request

- [ ] 6.0 Implement Favorites System (Backend)
  - **Spec refs:** FR-55
  - **Done means:** API adds/removes favorites, Wave 0 priority applied in discovery
  - [ ] 6.1 Create Edge Function: `supabase functions new toggle-favorite`
  - [ ] 6.2 Input: `{ rider_user_id, driver_user_id, action: 'add' | 'remove' }`
  - [ ] 6.3 If add: insert into `favorites` table (unique constraint on rider+driver)
  - [ ] 6.4 If remove: delete from `favorites`
  - [ ] 6.5 Return: `{ is_favorited: boolean }`
  - [ ] 6.6 Update discovery logic (in `tasks-02-core-ride-loop.md` task 9.5) to query favorites for Wave 0
  - [ ] 6.7 Test: favorite driver, verify Wave 0 notification sent

- [ ] 7.0 Build Favorites Screen (UI)
  - **Spec refs:** SPEC §25 Screen 13 (Favorites)
  - **Done means:** List of favorited drivers displayed, tap to view profile
  - [ ] 7.1 Create `src/features/drivers/screens/FavoritesScreen.tsx`
  - [ ] 7.2 Fetch favorited drivers from `favorites` joined with `driver_profiles`
  - [ ] 7.3 Display driver cards (reuse DriverCard component)
  - [ ] 7.4 Empty state: "You haven't favorited any drivers yet."
  - [ ] 7.5 Tap card to navigate to driver profile
  - [ ] 7.6 Test: favorite a driver, view favorites list, unfavorite

- [ ] 8.0 Implement Direct Driver Request (Backend)
  - **Spec refs:** SPEC §9, FR-31, FR-32, FR-33
  - **Done means:** Direct request notifies only target driver, escalates after 10 min
  - [ ] 8.1 Modify `create-ride-session` Edge Function to support `request_type: 'direct'`
  - [ ] 8.2 If direct request, store `target_driver_id` in session
  - [ ] 8.3 Notify only target driver (push + inbox)
  - [ ] 8.4 Track analytics: `direct_request_sent`
  - [ ] 8.5 Create background job: `check-direct-request-timeout`
  - [ ] 8.6 Query sessions where `request_type = 'direct'` and no offer after 10 min
  - [ ] 8.7 Notify rider: "No response yet. Want to search nearby drivers instead?"
  - [ ] 8.8 If rider chooses expand, switch to broadcast mode (update `request_type = 'broadcast'`, start discovery)
  - [ ] 8.9 Track analytics: `direct_request_escalated`
  - [ ] 8.10 Test: send direct request, mock no response, verify escalation prompt

- [ ] 9.0 Implement "Request this driver" Flow (UI)
  - **Spec refs:** SPEC §9, FR-31, FR-34
  - **Done means:** From driver profile, rider can initiate direct request
  - [ ] 9.1 On driver profile, "Request this driver" button opens route builder
  - [ ] 9.2 Reuse RouteEstimateScreen with context: `directDriverId`
  - [ ] 9.3 On "Generate QR", call API with `request_type: 'direct'` and `target_driver_id`
  - [ ] 9.4 Navigate to QR session screen (same flow as broadcast)
  - [ ] 9.5 If driver has `allow_direct_requests = false`, show text: "Not accepting requests"
  - [ ] 9.6 Test: request specific driver, verify only that driver notified

- [ ] 10.0 Implement Driver Allow/Disallow Direct Requests (Backend)
  - **Spec refs:** FR-34
  - **Done means:** Driver can toggle "Allow direct requests" setting (via driver app, mock for now)
  - [ ] 10.1 Add column to `driver_profiles`: `allow_direct_requests BOOLEAN DEFAULT true`
  - [ ] 10.2 Create Edge Function: `supabase functions new update-driver-settings`
  - [ ] 10.3 Input: `{ driver_user_id, allow_direct_requests: boolean }`
  - [ ] 10.4 Update `driver_profiles.allow_direct_requests`
  - [ ] 10.5 Test: toggle setting, verify rider sees "Not accepting requests"

---

**Next:** After completing driver directory, proceed to `tasks-04-notifications.md`
