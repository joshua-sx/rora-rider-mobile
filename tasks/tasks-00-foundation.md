# tasks-00-foundation.md

## Spec References
- SPEC: Section 23 (Tech Stack)
- SPEC: Section 22 (Data Model)
- NFR-1, NFR-2, NFR-3, NFR-4, NFR-5, NFR-6

## Relevant Files
- `supabase/` - Database migrations, Edge Functions, RLS policies
- `src/lib/supabase.ts` - Supabase client initialization
- `src/lib/sentry.ts` - Error tracking setup
- `src/lib/posthog.ts` - Analytics tracking setup
- `src/types/database.ts` - Generated TypeScript types from Supabase

## Notes
- All database migrations must be created incrementally and tested
- RLS policies are critical for security — test thoroughly
- Do not log PII in PostHog or Sentry
- Use Supabase CLI for migrations and type generation

## Instructions for Completing Tasks
**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`.

---

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 `git checkout -b feature/mvp-foundation`

- [ ] 1.0 Initialize Supabase Project & Local Development
  - **Spec refs:** SPEC §23 (Tech Stack)
  - **Done means:** Supabase project created, local dev environment configured, auth working
  - [ ] 1.1 Create Supabase project (cloud or self-hosted)
  - [ ] 1.2 Install Supabase CLI: `npm install -g supabase`
  - [ ] 1.3 Link local project: `supabase link --project-ref <ref>`
  - [ ] 1.4 Initialize local Supabase: `supabase init`
  - [ ] 1.5 Configure environment variables in `.env.local`
  - [ ] 1.6 Test connection: create a simple test query

- [ ] 2.0 Set Up Core Database Schema (Regions & Users)
  - **Spec refs:** SPEC §22 (Data Model), FR-4
  - **Done means:** `regions`, `users`, `guest_tokens` tables exist with RLS
  - [ ] 2.1 Create migration: `supabase migration create setup_regions_and_users`
  - [ ] 2.2 Define `regions` table (see SPEC §22)
  - [ ] 2.3 Define `users` table (extends Supabase auth.users)
  - [ ] 2.4 Define `guest_tokens` table with 30-day TTL logic
  - [ ] 2.5 Add indexes: `regions.is_active`, `guest_tokens.token`, `guest_tokens.expires_at`
  - [ ] 2.6 Apply migration: `supabase db push`
  - [ ] 2.7 Generate TypeScript types: `supabase gen types typescript --local > src/types/database.ts`

- [ ] 3.0 Set Up Pricing Tables Schema
  - **Spec refs:** SPEC §11 (Pricing System), §22 (Data Model), FR-11 to FR-16
  - **Done means:** Pricing zones, rules, modifiers tables exist with versioning support
  - [ ] 3.1 Create migration: `supabase migration create setup_pricing`
  - [ ] 3.2 Define `pricing_zones` table (center lat/lng, radius, zone name)
  - [ ] 3.3 Define `pricing_rule_versions` table (base fare, per_km, region_id, is_active)
  - [ ] 3.4 Define `pricing_fixed_fares` table (origin_zone_id, dest_zone_id, amount)
  - [ ] 3.5 Define `pricing_modifiers` table (type, enabled, threshold config JSON)
  - [ ] 3.6 Add RLS policies: admin can edit, all can read active rules
  - [ ] 3.7 Apply migration and regenerate types

- [ ] 4.0 Set Up Ride & Offer Tables Schema
  - **Spec refs:** SPEC §8 (Ride Flow), §22 (Data Model), FR-35 to FR-39
  - **Done means:** `ride_sessions`, `ride_offers`, `ride_events` tables exist with state machine enforcement
  - [ ] 4.1 Create migration: `supabase migration create setup_rides`
  - [ ] 4.2 Define `ride_sessions` table (see SPEC §22 schema)
  - [ ] 4.3 Define `ride_offers` table (driver offers: accept/counter)
  - [ ] 4.4 Define `ride_events` table (append-only event log)
  - [ ] 4.5 Create enum types for: `ride_status`, `offer_type`, `request_type`, `price_label`
  - [ ] 4.6 Add indexes: `ride_sessions.status`, `ride_sessions.rider_user_id`, `ride_offers.ride_session_id`
  - [ ] 4.7 Add unique constraint on `qr_token_jti`
  - [ ] 4.8 Apply migration and regenerate types

- [ ] 5.0 Set Up Driver, Ratings, Favorites, Reports Tables
  - **Spec refs:** SPEC §12, §13, §14, FR-40 to FR-55
  - **Done means:** Driver profiles, verifications, ratings, favorites, reports tables exist
  - [ ] 5.1 Create migration: `supabase migration create setup_drivers_and_social`
  - [ ] 5.2 Define `driver_profiles` table (name, photos, seats, languages, service_area_tags JSON)
  - [ ] 5.3 Define `driver_verifications` table (type, verified_at, verified_by_user_id)
  - [ ] 5.4 Define `ratings` table (rider_user_id, driver_user_id, score, ride_session_id)
  - [ ] 5.5 Define `favorites` table (rider_user_id, driver_user_id, created_at)
  - [ ] 5.6 Define `ride_reports` table (ride_session_id, reporter_user_id, category, notes, status)
  - [ ] 5.7 Add RLS policies for each table
  - [ ] 5.8 Apply migration and regenerate types

- [ ] 6.0 Set Up Notifications & Devices Tables
  - **Spec refs:** SPEC §18 (Notifications), FR-56 to FR-59
  - **Done means:** `devices`, `notifications_inbox` tables exist
  - [ ] 6.1 Create migration: `supabase migration create setup_notifications`
  - [ ] 6.2 Define `devices` table (user_id, push_token, platform, is_active)
  - [ ] 6.3 Define `notifications_inbox` table (user_id, type, title, body, metadata JSON, read_at, created_at)
  - [ ] 6.4 Add indexes: `notifications_inbox.user_id`, `notifications_inbox.created_at`
  - [ ] 6.5 Add RLS: users can read own notifications, system can insert
  - [ ] 6.6 Apply migration and regenerate types

- [ ] 7.0 Initialize Analytics (PostHog Self-Hosted)
  - **Spec refs:** SPEC §23, §27 (Analytics Events)
  - **Done means:** PostHog SDK integrated, test event tracked successfully
  - [ ] 7.1 Install PostHog: `npm install posthog-react-native`
  - [ ] 7.2 Create `src/lib/posthog.ts` with initialization logic
  - [ ] 7.3 Configure PostHog host + API key in `.env.local`
  - [ ] 7.4 Add `PostHogProvider` to app root
  - [ ] 7.5 Create typed event tracking helper: `trackEvent(name, properties)`
  - [ ] 7.6 Test with a sample event: `app_launched`
  - [ ] 7.7 Verify event appears in PostHog dashboard

- [ ] 8.0 Initialize Error Tracking (Sentry)
  - **Spec refs:** SPEC §23
  - **Done means:** Sentry SDK integrated, test error captured successfully
  - [ ] 8.1 Install Sentry: `npm install @sentry/react-native`
  - [ ] 8.2 Initialize Sentry in app entry point
  - [ ] 8.3 Configure Sentry DSN in `.env.local`
  - [ ] 8.4 Add source map upload to build process
  - [ ] 8.5 Set user context (exclude PII)
  - [ ] 8.6 Test with a sample error: `Sentry.captureException(new Error('Test'))`
  - [ ] 8.7 Verify error appears in Sentry dashboard

- [ ] 9.0 Create Shared TypeScript Types & Utilities
  - **Spec refs:** SPEC §22 (Data Model)
  - **Done means:** Reusable types and utilities exist for pricing, ride states, etc.
  - [ ] 9.1 Create `src/types/ride.ts` (RideStatus, RideSession, RideOffer types)
  - [ ] 9.2 Create `src/types/pricing.ts` (PricingRule, PriceLabel, Modifier types)
  - [ ] 9.3 Create `src/utils/constants.ts` (default values from SPEC appendices)
  - [ ] 9.4 Create `src/utils/validators.ts` (Zod schemas for API responses)
  - [ ] 9.5 Create `src/utils/geo.ts` (haversine distance, point-in-circle helpers)

---

**Next:** After completing foundation, proceed to `tasks-01-auth.md`
