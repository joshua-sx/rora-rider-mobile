# Ride State Machine Spec (Server is King)

This document is the single source of truth for server-side ride state transitions.
Client UI states are not a security boundary and must never change ride status.

## States and Transitions (Authoritative)

| Current State | Allowed Next States | Trigger / Actor | Required Field Updates |
| --- | --- | --- | --- |
| created | discovery, canceled | rider/guest start discovery; rider/guest cancel | set `discoveryStartedAt` on discovery |
| discovery | hold, expired, canceled | rider accepts offer; system expires; rider/guest cancel | set `holdExpiresAt` + selection fields on hold |
| hold | confirmed, discovery, expired, canceled | driver confirms; system returns to discovery; system expires; rider/guest cancel | set `confirmedAt` on confirmed |
| confirmed | active, canceled | system/driver activates ride; rider/guest cancel | none (status only) |
| active | completed, canceled | driver completes; rider/guest cancel | set `completedAt` on completed |
| completed | (none) | terminal | no updates allowed |
| canceled | (none) | terminal | no updates allowed |
| expired | (none) | terminal | no updates allowed |

## State Requirements and Forbidden Actions

### created
- Allowed transitions: discovery, canceled
- Required fields: `regionId`, origin/destination fields, `roraFareAmount`, `requestType`, `status="created"`, `qrTokenJti`
- Forbidden actions: driver offers, offer acceptance, driver confirmation, ride activation

### discovery
- Allowed transitions: hold, expired, canceled
- Required fields: `discoveryStartedAt`, `status="discovery"`
- Forbidden actions: confirm/activate/complete ride, accept multiple offers

### hold
- Allowed transitions: confirmed, discovery, expired, canceled
- Required fields: `selectedOfferId`, `selectedDriverId`, `finalAgreedAmount`, `holdExpiresAt`, `status="hold"`
- Forbidden actions: creating new offers, accepting another offer

### confirmed
- Allowed transitions: active, canceled
- Required fields: `confirmedAt`, `selectedOfferId`, `selectedDriverId`, `finalAgreedAmount`, `status="confirmed"`
- Forbidden actions: changing selected offer, modifying pricing

### active
- Allowed transitions: completed, canceled
- Required fields: `selectedOfferId`, `selectedDriverId`, `finalAgreedAmount`, `status="active"`
- Forbidden actions: changing selected offer, modifying pricing

### completed
- Allowed transitions: none (terminal)
- Required fields: `completedAt`, `status="completed"`
- Forbidden actions: any state change, any offer updates

### canceled
- Allowed transitions: none (terminal)
- Required fields: `status="canceled"` (cancellation reason logged in `rideEvents`)
- Forbidden actions: any state change, any offer acceptance

### expired
- Allowed transitions: none (terminal)
- Required fields: `status="expired"` (expiry reason logged in `rideEvents`)
- Forbidden actions: any state change, any offer acceptance

## Invariants (Must Always Hold)

- The server is the only authority for `rideSessions.status`; clients never write it directly.
- A ride has exactly one identity: `riderUserId` XOR `guestTokenId` (not both, not neither).
- Every state transition writes an append-only `rideEvents` entry with `eventType` and `actorType`.
- `selectedOfferId` implies `selectedDriverId` and `finalAgreedAmount` are set.
- At most one offer can be accepted per ride at any time.
- Offers can only be created while the ride is in `discovery`.
- A driver can have at most one active (pending) offer per ride.
- `holdExpiresAt` and `expiresAt` are enforced server-side, never by client timers alone.
- Once `completed`, `canceled`, or `expired`, a ride never changes state again.
- `qrTokenJti` is unique per ride and cannot be reused after claim.
