Rora Ride — Product Requirements Document (PRD)

## 1. Overview

Rora Ride is a taxi/ride-hailing app for Sint Maarten that helps riders (especially tourists) **find verified taxis**, **see transparent fare estimates**, and **log rides safely** using a **QR handshake** between rider and driver.

It is built for riders seeking trustworthy transportation, with drivers as participants (via separate driver app). Rora Ride focuses on trust, transparency, and safety — not on payments or automatic dispatch.

The product respects real-world taxi norms: cash-first culture, price negotiation, and trust through verification. The MVP proves the core loop (estimate → QR → discovery → accept → log) before adding payments and compliance-heavy features.

## 2. Problem Statement

Taxi transportation in Sint Maarten is fragmented:
- Riders don't know which drivers are trustworthy
- Pricing is opaque, inconsistent, and causes disputes
- There is little proof of what was agreed and when

Result: distrust, friction, and worse tourism experience.

Tourists arrive without local knowledge and struggle to find reliable transportation. Locals face inconsistent pricing and lack of transparency. Drivers compete without a trusted platform that respects their negotiation culture.

Existing solutions fail because they prioritize feature breadth and payment integration over simple, trust-building workflows that respect local taxi culture.

## 3. Goals

### User Goals

**Riders can:**
- Find verified taxi drivers they can trust
- See transparent fare estimates (Rora Fare) before booking
- Generate a QR code to request rides from nearby drivers
- Request specific drivers directly (from favorites or directory)
- Compare multiple driver offers and negotiate prices
- View ride history with full details
- Use the app without creating an account (guest mode)

### Product / Business Goals

- Prove the core loop: estimate → QR → discovery → accept → log
- Build trust and adoption before payments and compliance-heavy features
- Create foundation for Rora Pro (premium driver tier) monetization
- Replace word-of-mouth and random street hailing with verified platform
- Enable fast onboarding (guest mode) and long-term retention (account creation)
- Scale without becoming bloated or fragile

## 4. Target User

**Primary user: Tourist / Visitor / Local Rider**

**Context:**
Arrives in Sint Maarten (often at airport or cruise port) and needs reliable transportation. May not have local SIM card, may be unfamiliar with local taxi culture, and wants transparent pricing.

**Main frustration:**
- Don't know which drivers to trust
- Pricing is opaque and causes disputes
- No proof of what was agreed and when
- Difficulty finding drivers at key locations (airport, cruise port, hotels)

## 5. Core User Stories

**As a tourist, I want to** find a verified taxi driver quickly so I can get to my hotel safely and without hassle.

**As a rider, I want to** see a transparent fare estimate before booking so I know what to expect and can avoid disputes.

**As a rider, I want to** generate a QR code to request rides so drivers can find me and I can compare offers.

**As a rider, I want to** use the app without creating an account so I can book a ride immediately upon arrival.

**As a rider, I want to** save my favorite drivers so I can request them directly for future rides.

**As a rider, I want to** view my ride history so I have proof of what was agreed and when.

**As a rider, I want to** compare multiple driver offers so I can choose the best fit (price, driver, vehicle).

**As a rider, I want to** negotiate prices with drivers so the final fare reflects local taxi culture.

## 6. Functional Requirements

### Phase 1 — Core Operations (MVP)

**Authentication & Guest Mode:**
- The system must allow riders to use the app without an account (guest mode)
- The system must rate-limit guest QR generation (5 QRs/hour)
- The system must store guest rides against server-generated tokens (30-day TTL)
- The system must prompt account creation after first completed ride
- The system must support SMS OTP (primary) and email magic link (secondary) authentication

**Fare Estimation:**
- The system must calculate Rora Fare using zone pricing (if applicable) or distance-based estimation
- The system must display a single price number (no breakdown shown)
- The system must support offline estimation using haversine distance fallback
- The system must store pricing rule version and calculation metadata for audit

**QR & Discovery:**
- The system must generate QR codes with hybrid payload (session_id + route summary)
- The system must cache QR codes for offline display
- The system must broadcast ride requests to nearby drivers in waves (favorited → nearby → expanded)
- The system must allow riders to request specific drivers directly
- The system must continue discovery in background even if app is closed

**Offers & Selection:**
- The system must allow drivers to Accept, Counter, or Decline offers
- The system must display top 3 offers prominently with "+ X more" expandable
- The system must show price context labels (Good deal, Pricier than usual) based on configurable thresholds
- The system must enforce 5-minute hold timeout when rider selects a driver
- The system must allow rider to fall back to second-choice offer if first times out

**Ride Lifecycle:**
- The system must enforce ride state machine (created → discovery → hold → confirmed → active → completed/canceled)
- The system must validate all state transitions server-side
- The system must log all state changes to append-only ride events ledger
- The system must allow cancellation during discovery/hold, restrict after confirmation

**Driver Directory:**
- The system must display verified driver profiles with service area tags, capacity, languages
- The system must support optional filters (service area, capacity, languages, Rora Pro)
- The system must cache driver profiles locally (24-hour TTL)
- The system must allow riders to favorite drivers for quick access

**History & Ratings:**
- The system must display ride history (minimal list: date, route, amount)
- The system must allow authenticated riders to rate drivers (optional, 1-5 stars)
- The system must aggregate ratings (not shown until minimum threshold: 5-10 ratings)
- The system must allow riders to report issues (creates admin support ticket)

### Phase 2 — Adoption & Efficiency (Future)

- The system must support scheduled rides
- The system must support in-app payments and receipts
- The system must support live ride tracking during trip
- The system must support multi-language support (beyond English)
- The system must support dark mode
- The system must support loyalty programs and referrals

### Phase 3 — Trust & Continuity (Future)

- The system must preserve long-term ride history across app updates
- The system must support data export for riders
- The system must provide aggregate analytics for government/taxi association
- The system must support multi-island expansion (Anguilla, St Barths)

### Phase 4 — Longevity & Infrastructure (Future)

- The system must preserve institutional memory (driver verification history, pricing rules)
- The system must protect data integrity across platform changes
- The system must support safe recovery and read-only access during failures
- The system must provide predictable, stable behavior over time

## 7. Non-Goals (Out of Scope)

**Rora Ride MVP will NOT include:**

- In-app payments (cash-first culture)
- Surge pricing
- Auto dispatch / automatic driver matching
- Live ride tracking during trip
- Loyalty, referrals, levels, marketplace
- Scheduled rides (v0.2)
- Driver app (separate product)
- Multi-language support (English only for MVP)
- Dark mode
- Advanced analytics dashboards
- Hyper-customizable workflows

## 8. UX & Interaction Notes

**Speed is more important than flexibility:**
- Common actions (estimate, generate QR, select driver) must take seconds, not minutes
- Guest mode enables immediate use without signup friction

**Trust is the main product:**
- Verification badges, transparent pricing, logged records build trust
- No pressure or countdown timers during discovery
- Clear price context labels help riders compare without restricting drivers

**Respect local culture:**
- Cash-first approach (no payment complexity)
- Negotiation-friendly (drivers can counter Rora Fare)
- Price transparency without price control

**Mobile-first:**
- Interfaces must work well on mobile (primary platform)
- Offline support for QR display and cached data
- Push notifications for critical events (offers, confirmations)

**Errors must be explained clearly:**
- Network failures handled gracefully
- State transition errors explained in user-friendly language
- No silent failures

## 9. Technical Constraints & Assumptions

**Users may have:**
- Limited or no local SIM card (tourists)
- Unreliable network connectivity
- Low technical maturity (tourists unfamiliar with app)
- Limited time to learn the app (need immediate use)

**The system must:**
- Work offline (QR display, cached routes)
- Tolerate incomplete data initially (guest mode)
- Handle network failures gracefully
- Support both iOS and Android
- Work in Sint Maarten context (SMS OTP, Google Maps)

**Reliability is more important than feature richness:**
- Core loop must work reliably
- Trust-building features prioritized over advanced features

## 10. Success Criteria

**Rora Ride is successful if:**

- Riders can complete rides without creating an account (guest mode adoption)
- Estimate → QR → discovery → accept → log conversion rate is healthy
- Riders report increased trust in taxi transportation
- Drivers participate and respond to ride requests
- Pricing disputes decrease (transparency effect)
- Riders return to use the app (7-day retention)
- Guest rides are claimed after account creation (signup conversion)
- Platform becomes trusted source for verified taxis in Sint Maarten

**Key Metrics:**
- Estimate created → QR generated conversion rate
- QR generated → driver offer received rate
- Offer received → rider confirmed rate
- Confirmed → completed rate
- 7-day returning riders
- % of guest rides claimed after account creation

## 11. Open Questions & Risks

**Product Questions:**
- How many drivers are needed for viable discovery experience?
- What is optimal discovery wave timing and radius?
- How should we handle sparse driver availability in some areas?
- What is the right balance between price transparency and driver flexibility?

**Technical Questions:**
- How to handle QR token revocation at scale?
- What is optimal guest token TTL (currently 30 days)?
- How to handle discovery exhaustion gracefully?

**Business Questions:**
- What is the right pricing for Rora Pro (premium driver tier)?
- How to balance driver adoption with rider trust?
- What is the path to monetization beyond Rora Pro?

**Risks:**
- Driver adoption friction (respecting cash + negotiation norms)
- Pricing disputes (mitigated by storing breakdown + versioned rules)
- Push notification unreliability (mitigated by in-app inbox + polling)
- Poor POI coverage (mitigated by pin + freeform name fallback)
- Guest history loss (mitigated by 30-day TTL + early signup prompts)
- Discovery exhaustion in sparse areas (mitigated by clear messaging)