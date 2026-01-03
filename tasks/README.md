# Rora Ride MVP — Task Lists

**Generated from:** [SPEC.md](../SPEC.md)
**Generated on:** 2026-01-02
**Status:** Phase 1 Complete (High-Level Parent Tasks)

---

## Scope Map

### MVP In (Rider App Only)
✅ **Authentication & Guest Mode**
- SMS OTP + Email magic link authentication
- Guest tokens (30-day TTL)
- Guest-to-authenticated migration

✅ **Core Ride Loop**
- Route selection (origin/destination via map, search, pin)
- Rora Fare calculation (zone-based + distance fallback)
- QR session generation (JWT tokens)
- Multi-driver bidding (discovery waves with service area priority)
- Offer selection + price context labels
- Hold → Confirmation → Active → Completion flow
- State machine enforcement

✅ **Driver Directory**
- Browse verified drivers with filters (service area, capacity, languages, Rora Pro)
- Driver profiles with contact info (phone/WhatsApp)
- Direct driver requests
- Favorites (Wave 0 notification priority)

✅ **Pricing Engine**
- 3 MVP zones (Airport, Cruise Port, Maho Beach)
- Zone-to-zone fixed fares + distance-based fallback
- Haversine offline estimation (1.3x multiplier)
- Pricing modifiers (night/peak/event) — admin-configurable per region
- Versioned pricing rules for audit trail

✅ **Notifications & Real-Time**
- Expo Push Notifications for critical events
- In-app notification inbox (fallback)
- Supabase Realtime for instant offer updates
- Deep linking from push notifications
- Notification bundling (multiple offers → single notification)

✅ **Ride History, Ratings & Reporting**
- Ride history (minimal list view + detail view)
- Optional 1-5 star ratings (authenticated riders only)
- Aggregate ratings (shown after 5-10 ratings)
- Report issue flow (categories + notes → admin queue)

✅ **Admin Dashboard (Retool/Appsmith)**
- Driver approval queue (invite-only for pilot)
- Verification management (GOVERNMENT_REGISTERED, RORA_VERIFIED)
- Driver status control (Suspend/Unverify)
- Rora Pro management
- Pricing zones + fixed fares + rule versions + modifiers
- Report queue + audit log
- Basic analytics dashboard

✅ **Foundation**
- Supabase (Postgres + Auth + Realtime + Edge Functions)
- PostHog (self-hosted analytics)
- Sentry (error tracking)
- Google Maps (Places + Directions API)
- React Native / Expo

---

### Explicit Non-Goals (Out of Scope for MVP)
❌ In-app payments
❌ Surge pricing
❌ Auto dispatch / automatic driver matching
❌ Live ride tracking during trip
❌ Loyalty, referrals, levels, marketplace
❌ Scheduled rides (deferred to v0.2)
❌ Driver app (separate product)
❌ Multi-language support (English only for MVP)
❌ Dark mode

---

### Parking Lot (v0.2+)
📦 In-app payments + receipts
📦 Scheduled rides
📦 Live driver availability on map
📦 Live ride tracking
📦 Multi-language support
📦 Dark mode
📦 Driver ratings of riders (mutual)
📦 Partnerships (hotels, excursions)
📦 Multi-island expansion (Anguilla, St Barths)
📦 Government aggregate reporting exports
📦 Advanced Rora Pro benefits (analytics, visibility boost)

---

## Task Files (Phase 1 — High-Level Parent Tasks)

| File | Domain | Status |
|------|--------|--------|
| [tasks-00-foundation.md](tasks-00-foundation.md) | Database schema, Supabase, analytics, error tracking | ✅ Ready |
| [tasks-01-auth.md](tasks-01-auth.md) | Guest tokens, SMS OTP, email magic link, migration | ✅ Ready |
| [tasks-02-core-ride-loop.md](tasks-02-core-ride-loop.md) | Maps, pricing, QR, discovery, offers, ride lifecycle | ✅ Ready |
| [tasks-03-driver-directory.md](tasks-03-driver-directory.md) | Driver profiles, filters, favorites, direct requests | ✅ Ready |
| [tasks-04-notifications.md](tasks-04-notifications.md) | Push notifications, inbox, deep links, bundling | ✅ Ready |
| [tasks-05-history-ratings-reporting.md](tasks-05-history-ratings-reporting.md) | Ride history, ratings, report issue flow | ✅ Ready |
| [tasks-06-admin-dashboard.md](tasks-06-admin-dashboard.md) | Retool/Appsmith dashboard for verification, pricing, reports | ✅ Ready |
| [tasks-07-testing-qa.md](tasks-07-testing-qa.md) | Unit tests, integration tests, QA checklists | ✅ Ready |

---

## How to Use These Task Lists

### Phase 1: High-Level Planning (Current)
Each task file contains:
- **Parent tasks** (e.g., "1.0 Implement Guest Token System")
- **Spec references** (FR numbers, SPEC sections)
- **"Done means"** acceptance criteria per parent task
- **Relevant files** that will be created/modified

**Total parent tasks across all files:** ~75
**Estimated MVP completion:** 6-8 weeks (with 1-2 developers)

### Phase 2: Sub-Task Breakdown (Next Step)
When ready to start implementation, reply **"Go"** to generate detailed sub-tasks for each parent task.

Sub-tasks will include:
- Specific implementation steps (0.5-1 day chunks)
- DB migrations, RLS policies, API routes, UI screens
- Edge case handling
- Instrumentation (analytics + error tracking)
- QA checklists per feature

---

## Recommended Implementation Order

### Sprint 1: Foundation (1-2 weeks)
1. [tasks-00-foundation.md](tasks-00-foundation.md) — Database + Supabase + analytics/error tracking
2. [tasks-01-auth.md](tasks-01-auth.md) — Guest tokens + SMS/Email auth

### Sprint 2: Core Loop Part 1 (2 weeks)
3. [tasks-02-core-ride-loop.md](tasks-02-core-ride-loop.md) — Maps, pricing, QR generation (Phase A-C)

### Sprint 3: Core Loop Part 2 (2 weeks)
4. [tasks-02-core-ride-loop.md](tasks-02-core-ride-loop.md) — Discovery, offers, ride lifecycle (Phase D-F)

### Sprint 4: Directory & Notifications (1-2 weeks)
5. [tasks-03-driver-directory.md](tasks-03-driver-directory.md) — Driver directory, favorites, direct requests
6. [tasks-04-notifications.md](tasks-04-notifications.md) — Push notifications, inbox, deep links

### Sprint 5: History, Ratings & Admin (1 week)
7. [tasks-05-history-ratings-reporting.md](tasks-05-history-ratings-reporting.md) — Ride history, ratings, reports
8. [tasks-06-admin-dashboard.md](tasks-06-admin-dashboard.md) — Retool/Appsmith setup

### Sprint 6: Testing & QA (1 week)
9. [tasks-07-testing-qa.md](tasks-07-testing-qa.md) — Tests + QA checklists + pilot prep

---

## Phase 1 Complete ✅

**I've generated high-level parent tasks from SPEC.md.**

**Ready to generate sub-tasks?**
Reply **"Go"** and I'll expand each parent task into detailed implementation steps.

---

## Notes

- Keep tasks small and check off as completed (`- [ ]` → `- [x]`)
- Prefer integration tests for critical flows (QR scan, offer selection, ride completion)
- Do not log PII in analytics or error tracking
- All admin actions must be logged to audit log
- Test both guest and authenticated user flows thoroughly
