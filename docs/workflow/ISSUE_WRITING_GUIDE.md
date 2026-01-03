# Issue Writing Guide

This guide shows how to write clear, actionable issues for Rora Ride.

---

## Issue Types

### Epic

**When to use:** Large feature or initiative spanning multiple issues.

**Template:**

```markdown
## Goal
[High-level goal or outcome]

## Context
[Why this is needed, links to SPEC.md, DECISIONS.md, user research]

## Scope

### In Scope
- [ ] Feature 1
- [ ] Feature 2
- [ ] Feature 3

### Out of Scope
- [ ] Not doing X (explain why)
- [ ] Not doing Y (future work)

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Related
- Spec: SPEC.md §X
- Decision: DECISIONS.md D#X
```

**Example:**

```markdown
## Goal
Enable riders to use the app without creating an account (guest mode) while preventing abuse and enabling history migration.

## Context
Tourists need immediate access without signup friction. See DECISIONS.md D1 for architectural decision.

## Scope

### In Scope
- [ ] Guest token generation (30-day TTL)
- [ ] Rate limiting (5 QRs/hour)
- [ ] Guest ride storage
- [ ] History migration on signup

### Out of Scope
- [ ] Guest favorites (requires account)
- [ ] Guest ratings (requires account)

## Success Criteria
- [ ] Guest can generate QR without account
- [ ] Rate limiting prevents abuse
- [ ] Guest history migrates on signup

## Related
- Spec: SPEC.md §7 (Authentication - Guest Mode)
- Decision: DECISIONS.md D1
```

---

### Story

**When to use:** User-facing feature or requirement.

**Template:**

```markdown
## User Story
As a [user type], I want [goal] so that [benefit].

## Context
[Links to SPEC.md, related issues, screenshots/mockups]

## Acceptance Criteria
- [ ] Criterion 1 (testable, specific)
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Notes
[Implementation details, edge cases, dependencies]

## Related
- Spec: SPEC.md §X
- Epic: #123 (if part of epic)
```

**Example (Good):**

```markdown
## User Story
As a rider, I want to compare multiple driver offers so that I can choose the best deal.

## Context
Drivers respond with Accept or Counter offers. Rider needs to see all offers with price context. See SPEC.md §15 (Ride Offers).

## Acceptance Criteria
- [ ] Rider sees all pending offers in a scrollable list
- [ ] Each offer shows: driver name, vehicle, price, price label (Good deal/Normal/Pricier)
- [ ] Offers update in real-time via Supabase Realtime
- [ ] Rider can tap an offer to select it
- [ ] Selected offer moves to "confirmed" state
- [ ] Other offers are marked as "rejected"

## Technical Notes
- Use Supabase Realtime subscription on `ride_offers` table
- Filter by `ride_session_id` and `status = 'pending'`
- Price labels calculated server-side (Edge Function)
- Handle offline: show cached offers, sync when online

## Related
- Spec: SPEC.md §15 (Ride Offers)
- Epic: #45 (Core Ride Loop)
```

**Example (Bad - too vague):**

```markdown
## User Story
Compare driver offers.

## Acceptance Criteria
- [ ] It works
```

---

### Bug

**When to use:** Something isn't working as expected.

**Template:**

```markdown
## Description
[What's broken in one sentence]

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- Platform: iOS / Android / Both
- OS Version: iOS 17.0 / Android 13
- App Version: 1.0.0
- Device: iPhone 14 Pro / Pixel 7

## Screenshots/Logs
[If applicable]

## Additional Context
[Any other relevant information]
```

**Example:**

```markdown
## Description
QR code doesn't display when device is offline, even though it should be cached.

## Steps to Reproduce
1. Generate QR code for a ride (online)
2. Turn off Wi-Fi and cellular data
3. Navigate away from QR screen
4. Return to QR screen

## Expected Behavior
QR code should display from cache (see DECISIONS.md D3 - QR cached locally for offline display).

## Actual Behavior
QR screen shows "No connection" error and QR doesn't display.

## Environment
- Platform: Both
- OS Version: iOS 17.0, Android 13
- App Version: 1.0.0
- Device: iPhone 14 Pro, Pixel 7

## Additional Context
QR generation works fine when online. Issue is with offline cache retrieval.
```

---

### Spike

**When to use:** Research or exploration task.

**Template:**

```markdown
## Research Question
[What we need to learn or decide]

## Timebox
[Max time, e.g., "2 hours"]

## Context
[Why this research is needed, what decision depends on it]

## Output
[What artifact is expected: doc, decision, proof-of-concept, etc.]

## Acceptance Criteria
- [ ] Research question answered
- [ ] Output artifact created
- [ ] Decision documented (if applicable)
```

**Example:**

```markdown
## Research Question
What are Google Maps Places API rate limits and pricing for our use case (autocomplete, directions, geocoding)?

## Timebox
2 hours

## Context
We need to understand costs and limits before MVP launch. May need to implement caching or rate limiting.

## Output
Document with:
- Rate limits per API
- Pricing structure
- Recommendations for caching/optimization
- Decision on whether to use proxy or direct calls

## Acceptance Criteria
- [ ] Rate limits documented
- [ ] Pricing calculated for MVP scale (1000 rides/month)
- [ ] Recommendation provided
- [ ] Decision logged in DECISIONS.md (if applicable)
```

---

### Chore

**When to use:** Maintenance, refactoring, or infrastructure work.

**Template:**

```markdown
## What
[What needs to be done]

## Why
[Why it's needed: technical debt, dependency update, performance, etc.]

## Scope

### In Scope
- [ ] Task 1
- [ ] Task 2

### Out of Scope
- [ ] Not doing X (explain why)

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Technical Notes
[Implementation approach, risks, dependencies]
```

**Example:**

```markdown
## What
Upgrade Expo SDK from 53 to 54.

## Why
- Security updates
- New features we need
- Dependency compatibility

## Scope

### In Scope
- [ ] Update `expo` package to 54
- [ ] Update all Expo dependencies to compatible versions
- [ ] Test on iOS and Android
- [ ] Update EAS build config if needed

### Out of Scope
- [ ] Not upgrading React Native version (separate task)
- [ ] Not changing app architecture

## Acceptance Criteria
- [ ] Expo SDK 54 installed
- [ ] App runs on iOS without errors
- [ ] App runs on Android without errors
- [ ] EAS build succeeds
- [ ] No breaking changes introduced

## Technical Notes
- Check Expo upgrade guide for breaking changes
- Test QR generation, maps, push notifications (critical features)
- May need to update `app.json` or `app.config.ts`
```

---

## Acceptance Criteria Patterns

### Good Acceptance Criteria

✅ **Specific and testable:**
- "Rider sees all pending offers in a scrollable list"
- "QR code displays from cache when offline"

✅ **Includes edge cases:**
- "Handle case where no offers are received after 10 minutes"
- "Show error message if QR generation fails"

✅ **Includes non-functional requirements:**
- "Offers update in real-time via Supabase Realtime"
- "Price labels calculated server-side"

### Bad Acceptance Criteria

❌ **Too vague:**
- "It works"
- "User can do X"

❌ **Not testable:**
- "Make it better"
- "Improve performance"

❌ **Missing edge cases:**
- "User can generate QR" (what if offline? what if rate limited?)

---

## Issue Checklist

Before submitting an issue, ensure:

- [ ] Issue type is correct (Epic/Story/Bug/Spike/Chore)
- [ ] Title is clear and descriptive
- [ ] Body includes all required sections
- [ ] Acceptance criteria are specific and testable
- [ ] Links to SPEC.md, DECISIONS.md, or related issues included
- [ ] Epic linked (if part of epic)
- [ ] Labels applied (type, area, priority)
- [ ] Size estimated (S/M/L)

---

## Related Docs

- [GITHUB_WORKFLOW.md](./GITHUB_WORKFLOW.md) - Workflow overview
- [LABELS.md](./LABELS.md) - Label definitions
- [PROJECTS_V2_SETUP.md](./PROJECTS_V2_SETUP.md) - Projects board setup
- [SPEC.md](../../SPEC.md) - Product specifications
- [DECISIONS.md](../../DECISIONS.md) - Architectural decisions

