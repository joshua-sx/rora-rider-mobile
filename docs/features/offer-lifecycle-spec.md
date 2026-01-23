# Offer Lifecycle Spec

This document defines offer creation, streaming, expiry, acceptance, and cancellation.
Only the server decides offer status. Clients render server truth.

## Offer States

- pending: created and visible to rider/guest
- accepted: chosen by rider/guest (exclusive)
- declined: not chosen or canceled by rider/guest
- expired: timed out or withdrawn by driver

## Roles and Permissions

- Driver
  - Create offer (only while ride is in `discovery`)
  - Withdraw offer (only while `pending`)
- Rider/Guest (ride owner)
  - View offers for their ride
  - Accept one offer (transitions ride to `hold`)
  - Cancel ride (declines pending offers)
- System
  - Expire offers after 5 minutes
  - Enforce hold timeouts (10 minutes)
  - Reject invalid or stale actions

## Timing Rules

- Offer expiry: 5 minutes from `expiresAt` (server timestamp)
- Hold expiry: 10 minutes from `holdExpiresAt` (server timestamp)
- Client timers are advisory only; server time is authoritative

## Happy Path (Rider Accepts One Offer)

1. Ride enters `discovery`.
2. Driver creates a `pending` offer with `expiresAt=now+5m`.
3. Rider/guest receives offers via reactive query.
4. Rider/guest accepts one offer:
   - accepted offer -> `accepted`
   - all other `pending` offers -> `declined`
   - ride -> `hold` with `holdExpiresAt=now+10m`
5. Driver confirms; ride -> `confirmed`.

## Race Condition Paths (Expected Outcomes)

- Two accept attempts at the same time:
  - First successful transaction wins.
  - Second attempt fails (ride not in `discovery` or offer no longer `pending`).
- Accept arrives after offer expiry:
  - Server marks offer `expired` and rejects accept.
- Accept arrives after ride cancellation:
  - Server rejects accept (ride terminal).
- Driver withdraws at same moment rider accepts:
  - One wins; the other fails based on transaction order.
  - No partial state (no accepted offer without `hold`).
- Multiple drivers submit offers at once:
  - All offers become `pending`.
  - Rider can only accept one; others are `declined`.
- Network delay / retries:
  - Accept must be idempotent; duplicates fail safely.
  - Client must refresh offers after any error.

## Server-Side Acceptance Rules (Atomic)

Accept is allowed only if ALL are true:
- Ride is in `discovery`.
- Offer is `pending` and not expired.
- Ride owner matches (rider/guest identity).
- No accepted offer exists for the ride.

If any check fails, accept is rejected with no partial updates.
