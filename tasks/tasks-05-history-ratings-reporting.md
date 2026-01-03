# tasks-05-history-ratings-reporting.md

## Spec References
- SPEC: Section 14 (Ratings & Reporting)
- SPEC: Section 15 (Ride History)
- FR-48 to FR-54

## Relevant Files
- `src/features/history/` - Ride history screens
- `src/features/ratings/` - Rating components
- `src/features/reports/` - Report issue flow
- `supabase/functions/submit-rating/` - Edge Function for ratings
- `supabase/functions/submit-report/` - Edge Function for reports

## Notes
- Only authenticated riders can rate (guests cannot)
- Ratings are optional, aggregated, not shown until 5-10 minimum
- Drivers cannot rate riders
- Reports go to admin queue silently (driver not notified unless action taken)
- Ride history minimal in list view, full detail in detail screen

## Instructions for Completing Tasks
**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`.

---

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 `git checkout -b feature/history-ratings-reporting`

## Ride History

- [ ] 1.0 Implement Ride History API (Backend)
  - **Spec refs:** FR-53, FR-54
  - **Done means:** API returns rider's ride history with minimal + full detail modes
  - [ ] 1.1 Create Edge Function: `supabase functions new get-ride-history`
  - [ ] 1.2 Input: `{ rider_user_id, limit, offset }`
  - [ ] 1.3 Query `ride_sessions` where `rider_user_id = user OR guest_token_id matches claimed token`
  - [ ] 1.4 Join with `ride_offers` to get agreed amount + selected driver
  - [ ] 1.5 Return minimal fields for list: `{ id, origin_label, dest_label, agreed_amount, completed_at }`
  - [ ] 1.6 Create separate endpoint for detail: `get-ride-detail`
  - [ ] 1.7 Return full fields: driver info, timestamps, pricing metadata
  - [ ] 1.8 Test: fetch history, verify completed rides shown, verify detail fetches correctly

- [ ] 2.0 Build Ride History List Screen (UI)
  - **Spec refs:** SPEC §25 Screen 11 (Ride History), FR-53
  - **Done means:** List of completed rides displayed, tap to view detail
  - [ ] 2.1 Create `src/features/history/screens/RideHistoryScreen.tsx`
  - [ ] 2.2 Fetch ride history from API on mount
  - [ ] 2.3 Display list: date, origin → destination, amount
  - [ ] 2.4 No driver info shown in list (privacy)
  - [ ] 2.5 Empty state: "No rides yet. Start your first ride!"
  - [ ] 2.6 Infinite scroll / pagination (if >20 rides)
  - [ ] 2.7 Tap ride to navigate to RideDetailScreen
  - [ ] 2.8 Test: view history, tap ride

- [ ] 3.0 Build Ride Detail Screen (UI)
  - **Spec refs:** SPEC §25 Screen 12 (Ride Detail), FR-54
  - **Done means:** Full ride detail shown, favorite and report actions available
  - [ ] 3.1 Create `src/features/history/screens/RideDetailScreen.tsx`
  - [ ] 3.2 Fetch ride detail from API
  - [ ] 3.3 Display full route, agreed fare, driver name + photo
  - [ ] 3.4 Display timestamps: created, confirmed, completed
  - [ ] 3.5 Add "Favorite this driver" button (if not already favorited)
  - [ ] 3.6 Add "Report Issue" button (opens report modal)
  - [ ] 3.7 Show pricing metadata breakdown (optional: collapsible section)
  - [ ] 3.8 Test: view detail, favorite driver, open report modal

## Ratings

- [ ] 4.0 Implement Rating Submission (Backend)
  - **Spec refs:** FR-48, FR-49
  - **Done means:** API accepts rating, stores in `ratings` table, aggregates score
  - [ ] 4.1 Create Edge Function: `supabase functions new submit-rating`
  - [ ] 4.2 Input: `{ ride_session_id, driver_user_id, score (1-5) }`
  - [ ] 4.3 Validate: rider is authenticated (not guest)
  - [ ] 4.4 Validate: ride is completed and belongs to rider
  - [ ] 4.5 Insert into `ratings` table (unique constraint: one rating per rider+ride)
  - [ ] 4.6 Update driver aggregate rating (via trigger or computed field)
  - [ ] 4.7 Track analytics: `rating_submitted`
  - [ ] 4.8 Test: submit rating, verify stored, verify aggregate updated

- [ ] 5.0 Implement Rating Display Logic
  - **Spec refs:** FR-49, FR-50
  - **Done means:** Driver profiles show aggregate rating only if ≥5 ratings
  - [ ] 5.1 Add computed field or view: `driver_avg_rating` (AVG of ratings.score)
  - [ ] 5.2 Add computed field: `driver_rating_count` (COUNT of ratings)
  - [ ] 5.3 In driver profile API, include `avg_rating` and `rating_count`
  - [ ] 5.4 Only return rating if `rating_count >= 5`
  - [ ] 5.5 Test: driver with <5 ratings (no rating shown), driver with ≥5 ratings (rating shown)

- [ ] 6.0 Build Rating Prompt (UI)
  - **Spec refs:** SPEC §15 (Completion Flow), FR-48
  - **Done means:** After completion, optional rating prompt appears
  - [ ] 6.1 On CompletionSummaryScreen, show optional rating prompt
  - [ ] 6.2 Display 1-5 stars (tappable)
  - [ ] 6.3 Prompt: "How was your ride with [Driver Name]?"
  - [ ] 6.4 Add "Skip" button (dismisses prompt)
  - [ ] 6.5 On star tap, submit rating to API
  - [ ] 6.6 Show success toast: "Thanks for your feedback!"
  - [ ] 6.7 If user is guest, hide rating prompt
  - [ ] 6.8 Test: complete ride as authenticated user, rate driver
  - [ ] 6.9 Test: complete ride as guest, verify rating prompt not shown

- [ ] 7.0 Display Driver Rating in UI
  - **Spec refs:** FR-49
  - **Done means:** Driver cards and profiles show star rating (if available)
  - [ ] 7.1 In DriverCard component, display star rating + count if available
  - [ ] 7.2 Format: "⭐ 4.7 (23)" or "No ratings yet"
  - [ ] 7.3 In DriverProfileScreen, display rating prominently
  - [ ] 7.4 Test: view driver with rating, view driver without rating

## Reporting

- [ ] 8.0 Implement Report Submission (Backend)
  - **Spec refs:** FR-51, FR-52
  - **Done means:** API accepts report, creates admin ticket, driver not notified
  - [ ] 8.1 Create Edge Function: `supabase functions new submit-report`
  - [ ] 8.2 Input: `{ ride_session_id, reporter_user_id, category, notes (optional) }`
  - [ ] 8.3 Validate: ride belongs to reporter
  - [ ] 8.4 Categories: 'wrong_fare', 'no_show', 'unsafe_behavior', 'other'
  - [ ] 8.5 Insert into `ride_reports` table (status = 'pending')
  - [ ] 8.6 Do NOT notify driver (only admin sees report)
  - [ ] 8.7 Track analytics: `issue_reported`
  - [ ] 8.8 Test: submit report, verify stored, verify driver not notified

- [ ] 9.0 Build Report Issue Modal (UI)
  - **Spec refs:** FR-51
  - **Done means:** Report modal shows categories + optional notes, submits to API
  - [ ] 9.1 Create `src/features/reports/components/ReportIssueModal.tsx`
  - [ ] 9.2 Display category options (radio buttons):
    - Wrong fare
    - No-show
    - Unsafe behavior
    - Other
  - [ ] 9.3 Add optional freeform notes textarea
  - [ ] 9.4 Add "Submit" and "Cancel" buttons
  - [ ] 9.5 On submit, call API and show success toast
  - [ ] 9.6 Test: open modal from ride detail, select category, add notes, submit

- [ ] 10.0 Create Admin Report Queue View (Retool/Appsmith)
  - **Spec refs:** FR-52
  - **Done means:** Admin can view pending reports with ride context
  - [ ] 10.1 In Retool/Appsmith, create "Reports Queue" page
  - [ ] 10.2 Query: `SELECT * FROM ride_reports WHERE status = 'pending' ORDER BY created_at DESC`
  - [ ] 10.3 Display: ride_session_id, reporter, category, notes, created_at
  - [ ] 10.4 Add actions: "Mark Resolved", "Warn Driver", "Suspend Driver"
  - [ ] 10.5 On action, update report status and optionally notify driver (per FR-52: only if action taken)
  - [ ] 10.6 Test: submit report, view in admin queue, resolve it

---

**Next:** After completing history/ratings/reporting, proceed to `tasks-06-admin-dashboard.md`
