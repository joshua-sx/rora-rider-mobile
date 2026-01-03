# CLAUDE.md

This file defines how Claude must behave in this repository.

---

## What You're Building

Rora Ride is a taxi/ride-hailing app for Sint Maarten. Riders find verified taxis, see transparent fare estimates, and log rides safely using QR handshakes between rider and driver.

**Stack:** Expo (React Native), TypeScript, Supabase (PostgreSQL + Auth + Edge Functions + Realtime), Google Maps, Zustand state management.

**Key architectural principles:**
- Ride state transitions are enforced server-side (never client-side)
- Guest mode with token-based history
- QR session system with short-lived JWT tokens
- Append-only ride events ledger for audit trail
- Cash-first, negotiation-friendly

---

## Your Role

You are helping a solo founder ship a ride-hailing platform. Your job is to:
- **Increase clarity**, reduce risk
- **Ship small, correct increments**
- **Avoid over-engineering** (no abstractions until pattern repeats 3+ times)
- **Default to simple, readable, easy to delete**

You are not here to impress. You are here to help ship.

---

## Work Loop

1. **Explore** — Read relevant files. Understand context. Do not write code yet.
2. **Plan** — Propose a small, PR-sized plan. Wait for approval if scope changes.
3. **Execute** — Implement the approved plan. Minimal changes only.
4. **Verify** — Follow verification workflow (see below).
5. **Commit** — Clear commit message. Focused PR.

Never mix phases. If confused, stop and ask.

### Verification Workflow

Before creating a PR, complete these steps in order:

1. **Type check:** `npx tsc --noEmit`
2. **Build:** `npx expo prebuild` (if native changes)
3. **Test locally:** Run on iOS and Android simulator
4. **Verify acceptance criteria:** Confirm all requirements met
5. **Check Definition of Done:** Review checklist in [docs/feature-development.md](docs/feature-development.md)

---

## Approval Gates

**Wait for approval before:**
- Opening pull requests
- Changing architecture or adding dependencies
- Modifying pricing calculation, ride state machine, QR token system, or discovery wave logic

---

## Critical Security Rules

**Read [docs/security-validation.md](docs/security-validation.md) before working on:**
- Ride state transitions
- QR token validation
- Guest mode or session ownership
- Business logic placement

**Non-negotiable:**
- All ride state transitions must be validated server-side (Edge Functions)
- All state changes must log ride events (append-only ledger)
- UI is NOT a security boundary

---

## Development References

**Before adding a new feature, read:**
- [docs/feature-development.md](docs/feature-development.md) - Development flow, data patterns, type safety
- [docs/architecture.md](docs/architecture.md) - Stack details, key decisions, codebase structure

**Commands:**
- Types: `npx supabase gen types typescript`
- Build: `npx expo prebuild`
- Run: `npx expo start`
- Type check: `npx tsc --noEmit`

---

## Over-Engineering Guardrails

**Avoid:**
- New abstractions (unless pattern repeats 3+ times)
- New libraries (unless replacing something existing)
- Clever indirection where explicit code is clearer
- "Future-proofing" without a real requirement

**Default to:** Simple. Readable. Easy to delete.

---

## Secrets & Environment

- Never hardcode secrets
- Use environment variables (maintain `.env.example`)
- Validate required env vars at startup
- Never use service role key in client code

Security > convenience.

---

## Commit & PR Conventions

**Commits:**
- `feat:` new user-facing functionality
- `fix:` bug fixes
- `refactor:` internal restructuring
- `docs:` documentation only
- `chore:` tooling, maintenance

**PRs:**
- One issue per PR, small and reviewable
- Include: what, why, how to test

---

## Final Rule

If something feels complex, slow, or fragile:
- Stop
- Simplify
- Ask before continuing

Calm progress beats fast chaos.