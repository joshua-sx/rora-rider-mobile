Table of Contents

Executive Summary

Product Overview

Functional Requirements by Module

Roles & Permissions

Data Requirements

Integrations

Platform Requirements

Implementation Status

Gap Analysis (MVP blockers)

Appendix

1. Executive Summary
1.1 Purpose

Define functional requirements for RoraExpo, a mobile app that provides:

Official route quote (distance, ETA, price estimate)

Verified passengers

Government-verified driver directory

Trip confirmation + logging via QR

1.2 Scope (v1.1)

In scope (Passenger App)

Location + route calculation + quote

Browse verified drivers + profiles

Identity verification (KYC/IDV)

Trip QR generation + trip logging

Trip history + persistence

Basic offline + error handling

In scope (Driver Self-Service)

Driver sign-in

Claim profile

Edit allowed fields (photo, languages, bio, contact, availability)

In scope (Admin/Ops – lightweight)

Import/sync government driver registry

Audit logs for registry changes + claims

Review/approve change requests on locked fields (optional, but recommended)

Out of scope (MVP)

In-app payments

Dispatch / driver acceptance marketplace

Real-time active ride tracking (can be future if you build driver location feed)

1.3 Target Users

Passengers: locals and tourists in Sint Maarten

Drivers: licensed/registered drivers (government provided list)

Admin/Ops: small internal team

1.4 Success Criteria (MVP)

App is “MVP complete” when:

Users can sign up / log in, then complete identity verification.

Users can generate a route quote (origin → destination → map + price).

Users can browse a government-sourced verified driver directory.

Users can select a driver, generate a Trip QR, and log a confirmed trip.

Trip history + saved items persist across restarts.

2. Product Overview
2.1 Product Vision

RoraExpo is soft infrastructure for island transport:

verifies who is riding

verifies who is driving

logs what was agreed

helps users move confidently without disrupting the local taxi economy.

2.2 Core Value Propositions

Verified riders + verified drivers

Transparent quote before the ride

QR agreement logging (disputes become “here’s the record,” not vibes)

Simple driver discovery (not dispatch)

2.3 Key Features (v1.1)

Location services + map

Route planning + quote

Passenger ID verification (Persona)

Government driver registry + driver profiles

Trip QR generation + confirmation logging

Trip history + persistence

Driver claim + driver profile self-service

3. Functional Requirements by Module
3.1 Location Services (mostly unchanged)

Keep your existing LOC requirements. The only change: manual location entry becomes more important because verification flows often need stable location + address context.

FR-LOC-001 → FR-LOC-006 remain valid.
Critical fix: integrate FR-LOC-005 Manual Entry fully into fallback flow.

3.2 Route Planning & Quote

This is now officially Quote, not “booking with payment”.

FR-ROUTE-001: Origin/Destination Selection (keep)
FR-ROUTE-003: Route Calculation (keep)
FR-ROUTE-004: Price Calculation (keep, but rename output to “Quote”)
FR-ROUTE-006: Trip Details Display (keep, but update logic below)

FR-QUOTE-001: Quote Record Creation (NEW, P0)

Description: After route calc, app MUST create a Quote (can be stored as a Trip draft).

Requirements:

Create quote/trip record with:

origin, destination, routeData (distance/duration/polyline)

estimatedPrice

createdAt timestamp

status = not_taken (quote created)

Acceptance: quote appears consistently in trip-preview and trip-history.

FR-ROUTE-006 Update: Stop auto-saving junk (P0 correction)

Your v1.0 auto-saves on screen mount. That will pollute history with “accidental trips”.

New rule:

Auto-save is allowed only as a “Quote Draft” and should be easy to discard.

Provide “Discard Quote” action.

3.3 Identity Verification (KYC/IDV) – CORE MODULE (NEW)

Recommendation: Persona (or similar). You store status + vendor reference, not ID images.

FR-KYC-001: Verification Status Model (P0)

Status enum:

unverified, pending, verified, failed, manual_review

Store minimal metadata:

provider, referenceId, status, timestamps (startedAt, verifiedAt)

FR-KYC-002: Verification Flow Screens (P0)

Required screens:

/verify-identity (intro + why it matters)

vendor SDK flow (embedded)

/verify-identity/pending

/verify-identity/success

/verify-identity/failed (retry + support)

Acceptance: user can complete verification end-to-end.

FR-KYC-003: Gating Rules (P0)

Unverified users MAY:

browse venues

browse driver directory (limited)

generate a quote preview (optional)

Unverified users MUST NOT:

view full driver contact details

generate/share Trip QR

confirm a trip

Verified users unlock full flow.

FR-KYC-004: Error Handling (P1)

Handle:

vendor downtime

user cancellation

document mismatch

manual review delay

Provide clear messaging and retry.

3.4 Government Driver Registry (NEW CORE MODULE)

Government list is source of truth. Drivers can edit presentation fields, not legitimacy fields.

FR-REG-001: Driver Registry Import (Admin) (P0)

Admin can import government driver list via CSV (MVP).

System validates:

duplicates

required fields

expiry dates

System records audit log for import.

FR-REG-002: Locked vs Editable Fields (P0)

Locked (government-verified):

legal name (or official name), license/permit status, plate number, registration ID, expiry dates

Editable (driver-managed):

profile photo, bio, languages, contact phone/email (with verification), availability (on/off duty), service notes

FR-REG-003: Automatic De-listing (P0)

If government marks driver inactive/expired:

driver becomes unlisted immediately

profile shows “inactive” (if accessed directly)

3.5 Driver Claim + Self-Service (Driver Sign-in)

Drivers should “claim” the government record and manage their public profile.

FR-DRIVER-CLAIM-001: Driver Auth (P0)

Driver can sign in (Supabase Auth recommended) and must be linked to a government driver record.

No link → cannot edit a profile.

FR-DRIVER-CLAIM-002: Claim Methods (P0)

MVP options (pick one, but document both):

Option A: Claim code issued by taxi association/government.

Option B: Plate + phone OTP + match government record.

FR-DRIVER-CLAIM-003: Driver Profile Edit (P1)

Drivers can edit only editable fields (see FR-REG-002).

Changes persist and show in passenger directory.

FR-DRIVER-CLAIM-004: Change Request for Locked Fields (P2)

Driver submits request; admin approves/denies; audit logged.

3.6 Driver Directory (Passenger)

Keep most of your existing driver UI requirements, but change the meaning.

FR-DRIVER-001 Browse Drivers (keep)
FR-DRIVER-002 Status Indicators (keep)
FR-DRIVER-003 Driver Profile Display (keep, but ensure locked field styling)

FR-DRIVER-009: Verified Badge Source (P0)

Driver card MUST show a badge if government-verified and active.

Badge source: registry status, not self-claimed.

FR-DRIVER-004 Contact Driver (P1)

Contact buttons are enabled only if passenger is verified (FR-KYC-003).

If not verified: show locked state + CTA to verify.

3.7 Trip Confirmation & Logging (replaces “Active Ride Tracking”)

This is the heart: log the agreement.

FR-TRIP-001 Trip History (P0)

Must exist, must persist, must not lose data on restart.

FR-TRIP-005 Trip Persistence (P0 BLOCKER)

Store trips locally (AsyncStorage) + sync to backend (Supabase) as source of truth.

FR-TRIP-010 Trip QR Generation (P0)

(Replace old QR requirement with “confirmation QR”.)

QR encodes:

tripId, driverId, passengerId, quote snapshot (price/distance), timestamp, signature/token

QR can be used to confirm trip.

FR-TRIP-011 Trip Confirmation Method (P0)

Confirmation methods:

qr_scan (preferred)

manual_code (fallback)

A confirmed trip becomes status = confirmed.

FR-TRIP-002 Trip Status Lifecycle (UPDATED, P0)

New statuses:

not_taken (quote created)

pending (driver selected, awaiting confirmation)

confirmed (QR scanned / code confirmed)

completed (manual completion by passenger OR driver portal)

cancelled

Prevent invalid transitions.

FR-TRIP-012 Trip Completion (P1)

MVP completion options:

Passenger marks completed (weak trust)

Driver marks completed in portal (stronger)

Log who completed it + timestamp.

Real talk: if you want “official logging,” you eventually want driver confirmation, not passenger-only.

3.8 Authentication & Sessions (still P0)

Your app cannot be “verified users” without auth.

Keep the structure but tighten it.

FR-AUTH-001 Registration (P0) – required
FR-AUTH-002 Login (P0) – required
FR-AUTH-005 Session Mgmt (P0) – required
FR-AUTH-006 Protected Routes (P0) – required

Important: Some browsing can be public, but QR + contact details must be protected and gated.

3.9 Offline + Error Handling (keep, but focus)

FR-OFFLINE-001 NetInfo offline banner (P1)
FR-ERROR-001 Global Error Boundary + Sentry (P0)

Also add:

FR-OPS-001: Remove Debug Code (P0)

No localhost calls, no debug logs in production, no leaking keys.

3.10 Removed Modules (explicit)
Payments (REMOVED)

All FR-PAYMENT-001 → FR-PAYMENT-006 are REMOVED (Out of Scope).
Reason: product does not process payments; it only logs trip confirmation and agreed quote.

4. Roles & Permissions
Passenger

Browse venues/drivers

Create quote

Must verify identity to confirm trip and view driver contacts

View trip history

Driver

Claim profile

Update editable fields

Confirm trip (QR scan or code entry) and optionally complete trip

Admin/Ops

Import government registry

Review audit logs

Handle locked-field change requests (optional)

5. Data Requirements (updated models)
User (updated)
interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;

  verificationStatus: 'unverified' | 'pending' | 'verified' | 'failed' | 'manual_review';
  verificationProvider?: 'persona' | 'other';
  verificationReferenceId?: string;
  verifiedAt?: string;

  createdAt: string;
  updatedAt: string;
}

Driver (updated)
interface Driver {
  id: string;

  // Government-verified (locked)
  governmentStatus: 'active' | 'inactive' | 'expired' | 'suspended';
  legalName: string;
  licensePlate: string;
  permitId: string;
  permitExpiresAt: string;
  lastSyncedAt: string;

  // Driver-editable
  displayName?: string;
  avatarUrl?: string;
  rating?: number;
  reviewCount?: number;
  status: 'on_duty' | 'off_duty';
  phone?: string;
  email?: string;
  languages: string[];
  bio?: string;
  vehicle?: { type: string; make?: string; model?: string; color?: string };

  claimedByUserId?: string;
}

Trip (updated)
type TripStatus = 'not_taken' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface Trip {
  id: string;
  userId: string;
  driverId?: string;

  origin: PlaceDetails;
  destination: PlaceDetails;

  routeData: {
    distanceKm: number;
    durationMin: number;
    polyline: LatLng[];
  };

  quote: {
    estimatedPrice: number;
    currency: 'USD';
    pricingVersion: string;
    createdAt: string;
  };

  confirmationMethod?: 'qr_scan' | 'manual_code';
  confirmedAt?: string;
  completedAt?: string;
  completedBy?: 'passenger' | 'driver';

  status: TripStatus;
  saved: boolean;

  createdAt: string;
  updatedAt: string;
}


Privacy rule: Never store ID images or document scans in your DB.

6. Integrations (updated)
6.1 Maps (keep)

Places Autocomplete, Places Details, Directions via proxy.

Fix:

env vars for API key

rate limiting

billing alerts + usage monitoring

6.2 Auth

Supabase Auth recommended (email/password + magic link optional).

6.3 Identity Verification

Persona recommended:

create verification session

launch SDK

receive result via webhook

update verificationStatus

6.4 Error Tracking

Sentry (P0) for crash + error visibility.

7. Platform Requirements

Keep your existing iOS/Android baseline requirements.
Add: camera permission may be needed for verification flows depending on vendor SDK.

8. Implementation Status (updated, realistic)

Location Services: strong

Route planning + quote: strong

Explore: strong

Driver directory UI: good, but needs government data model + claim system

Auth: missing (P0)

Verification: missing (P0)

Trip persistence: missing (P0)

Trip confirmation: partial (QR exists, but not confirmation workflow)

Offline + error boundary: missing (P0/P1)

9. Gap Analysis (MVP blockers)
P0 Must-fix before MVP

Auth (signup/login/session/protected routes)

User verification (Persona) + gating rules

Trip persistence (local + backend)

Government driver registry import + status handling

Trip confirmation flow (QR = confirmed trip, not just a pretty square)

Remove debug/prod crash risks + add global error boundary

P1 Should-fix before MVP feels solid

Driver claim flow + driver self-service edit

Offline banner + disable network actions cleanly

Contact actions via Linking + gated by verification

10. Appendix
External Resources (no links in text)

Expo docs, React Native docs, Google Maps APIs, Supabase docs, Persona docs, Sentry docs

(If you want links back in, tell me and I’ll format them the way you prefer.)