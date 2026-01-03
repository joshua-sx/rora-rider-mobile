# tasks-06-admin-dashboard.md

## Spec References
- SPEC: Section 6 (Personas & Permissions - Admin)
- SPEC: Section 13 (Verification & Rora Pro)
- SPEC: Section 11 (Pricing System - Admin Config)
- FR-14, FR-27, FR-28, FR-32 to FR-35, FR-44 to FR-47

## Relevant Files
- Retool or Appsmith workspace (separate from Expo app)
- `supabase/` - Database accessed by admin dashboard
- Admin Edge Functions for actions (optional, or use direct DB queries)

## Notes
- Use Retool or Appsmith for MVP admin dashboard
- Admin can: verify/suspend drivers, manage pricing zones/rules, view reports, view analytics
- All admin actions must be logged for audit trail
- Admin dashboard is web-based, not mobile

## Instructions for Completing Tasks
**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`.

---

## Tasks

- [ ] 0.0 Create feature branch (if using custom Edge Functions)
  - [ ] 0.1 `git checkout -b feature/admin-dashboard`

- [ ] 1.0 Set Up Retool/Appsmith Workspace
  - **Spec refs:** SPEC §23 (Admin Dashboard)
  - **Done means:** Retool/Appsmith connected to Supabase, basic navigation working
  - [ ] 1.1 Sign up for Retool or Appsmith account
  - [ ] 1.2 Create new app: "Rora Ride Admin"
  - [ ] 1.3 Connect to Supabase database (Postgres connection string)
  - [ ] 1.4 Test connection: query `SELECT * FROM users LIMIT 10`
  - [ ] 1.5 Create navigation menu: Drivers, Pricing, Reports, Analytics

## Driver Verification & Management

- [ ] 2.0 Build Driver Approval Queue
  - **Spec refs:** FR-5, FR-6 (Driver Onboarding), FR-44
  - **Done means:** Admin can view pending driver signups and approve/reject
  - [ ] 2.1 Create "Driver Approvals" page
  - [ ] 2.2 Query: drivers with status = 'pending_approval' (add this status to driver_profiles)
  - [ ] 2.3 Display: name, email, phone, documents (if uploaded), signup date
  - [ ] 2.4 Add "Approve" button → updates status to 'ACTIVE'
  - [ ] 2.5 Add "Reject" button → updates status to 'rejected', adds reason (optional)
  - [ ] 2.6 Test: mock driver signup, approve/reject from dashboard

- [ ] 3.0 Build Driver Verification Management
  - **Spec refs:** FR-32, FR-33, FR-44, FR-45
  - **Done means:** Admin can add/remove verifications for drivers
  - [ ] 3.1 Create "Driver Verifications" page or section
  - [ ] 3.2 Search drivers by name/email
  - [ ] 3.3 Display driver's current verifications (GOVERNMENT_REGISTERED, RORA_VERIFIED)
  - [ ] 3.4 Add "Add Verification" button:
    - Select type: GOVERNMENT_REGISTERED or RORA_VERIFIED
    - Add evidence metadata (e.g., license number, doc reference)
    - Insert into `driver_verifications` table
  - [ ] 3.5 Add "Remove Verification" button (soft delete or mark inactive)
  - [ ] 3.6 Log all verification changes to audit log
  - [ ] 3.7 Test: add verification, remove verification

- [ ] 4.0 Build Driver Status Management (Suspend/Unverify)
  - **Spec refs:** FR-34, FR-35, FR-47
  - **Done means:** Admin can suspend or unverify drivers
  - [ ] 4.1 On driver detail page, show current status: ACTIVE, UNVERIFIED, SUSPENDED
  - [ ] 4.2 Add "Unverify" button:
    - Removes verification badges
    - Updates status to UNVERIFIED
    - Driver can still use app
  - [ ] 4.3 Add "Suspend" button:
    - Blocks driver from participating in rides
    - Updates status to SUSPENDED
    - Optionally add suspension reason + duration
  - [ ] 4.4 Add "Reactivate" button (for suspended drivers)
  - [ ] 4.5 Log all status changes to audit log
  - [ ] 4.6 Test: suspend driver, verify they can't accept rides (requires driver app integration, mock for now)

- [ ] 5.0 Build Rora Pro Management
  - **Spec refs:** FR-46
  - **Done means:** Admin can toggle Rora Pro status for drivers
  - [ ] 5.1 On driver detail page, show Rora Pro status (boolean toggle)
  - [ ] 5.2 Add "Enable Rora Pro" / "Disable Rora Pro" button
  - [ ] 5.3 Update `driver_profiles.is_rora_pro`
  - [ ] 5.4 Log change to audit log
  - [ ] 5.5 Test: enable Rora Pro, verify badge shows in rider app

## Pricing Management

- [ ] 6.0 Build Pricing Zones Manager
  - **Spec refs:** FR-13, FR-14
  - **Done means:** Admin can create/edit/delete pricing zones
  - [ ] 6.1 Create "Pricing Zones" page
  - [ ] 6.2 Display table: zone name, center coords, radius, is_active
  - [ ] 6.3 Add "Create Zone" form:
    - Name (e.g., "PJIAE Airport")
    - Center latitude, longitude
    - Radius (meters)
    - Region (dropdown)
  - [ ] 6.4 Add "Edit" button per zone
  - [ ] 6.5 Add "Delete" or "Deactivate" button
  - [ ] 6.6 Test: create zone, edit radius, deactivate zone

- [ ] 7.0 Build Fixed Fare Rules Manager
  - **Spec refs:** FR-14
  - **Done means:** Admin can create zone-to-zone fixed fares
  - [ ] 7.1 Create "Fixed Fares" page
  - [ ] 7.2 Display table: origin zone, destination zone, amount, is_active
  - [ ] 7.3 Add "Create Fixed Fare" form:
    - Origin zone (dropdown)
    - Destination zone (dropdown or "Any")
    - Amount (USD)
  - [ ] 7.4 Add "Edit" and "Delete" buttons
  - [ ] 7.5 Test: create fixed fare (Airport → Maho = $20), verify pricing API uses it

- [ ] 8.0 Build Pricing Rule Versions Manager
  - **Spec refs:** FR-14, FR-15
  - **Done means:** Admin can create/edit base pricing rules (base fare, per_km rate)
  - [ ] 8.1 Create "Pricing Rules" page
  - [ ] 8.2 Display current active rule: base_fare, per_km_rate, haversine_multiplier
  - [ ] 8.3 Add "Create New Rule Version" form:
    - Base fare (USD)
    - Per-km rate (USD)
    - Haversine multiplier (default 1.3)
    - Region (dropdown)
  - [ ] 8.4 On create, mark old version as inactive, new version as active
  - [ ] 8.5 Store version history for audit
  - [ ] 8.6 Test: create new rule, verify new rides use it

- [ ] 9.0 Build Pricing Modifiers Manager
  - **Spec refs:** FR-16
  - **Done means:** Admin can toggle night/peak/event modifiers per region
  - [ ] 9.1 Create "Pricing Modifiers" page
  - [ ] 9.2 Display table: modifier type (night/peak/event), enabled, region, percent/fixed adjustment
  - [ ] 9.3 Add toggle switches to enable/disable each modifier
  - [ ] 9.4 Add "Edit" button to configure modifier parameters (time range, adjustment %)
  - [ ] 9.5 Test: enable night modifier (10pm-6am +20%), verify pricing API applies it

## Analytics & Reporting

- [ ] 10.0 Build Analytics Dashboard
  - **Spec refs:** SPEC §27 (Analytics Events)
  - **Done means:** Admin can view aggregate ride metrics
  - [ ] 10.1 Create "Analytics" page
  - [ ] 10.2 Display key metrics (from PostHog or direct DB queries):
    - Total rides (by status: completed, canceled, expired)
    - Conversion funnel: estimate → QR → offer → confirmed → completed
    - 7-day returning riders
    - Guest claim rate (% of guest rides claimed)
  - [ ] 10.3 Add date range filter
  - [ ] 10.4 Add region filter
  - [ ] 10.5 Test: view analytics, verify numbers match PostHog

- [ ] 11.0 Build Audit Log Viewer
  - **Spec refs:** NFR-3 (Auditability)
  - **Done means:** Admin can view all admin actions + ride state transitions
  - [ ] 11.1 Create `admin_audit_log` table (if not exists):
    - admin_user_id, action, target (driver_id, zone_id, etc.), metadata JSON, created_at
  - [ ] 11.2 Log all admin actions (verification, suspension, pricing changes) to this table
  - [ ] 11.3 Create "Audit Log" page
  - [ ] 11.4 Display: admin, action, target, timestamp
  - [ ] 11.5 Add filters: admin user, action type, date range
  - [ ] 11.6 Test: perform admin action, verify logged

## Support Queue (Already covered in tasks-05)

- [ ] 12.0 Verify Report Queue Integration
  - **Spec refs:** FR-52
  - **Done means:** Admin can view and resolve rider reports (already built in `tasks-05-history-ratings-reporting.md` task 10)
  - [ ] 12.1 Verify "Reports Queue" page exists and is accessible
  - [ ] 12.2 Verify actions work: Mark Resolved, Warn Driver, Suspend Driver
  - [ ] 12.3 Test end-to-end: rider submits report → admin resolves

---

**Next:** After completing admin dashboard, proceed to `tasks-07-testing-qa.md`
