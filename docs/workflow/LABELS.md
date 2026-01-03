# Label Definitions

This document defines all GitHub labels used in the Rora Ride repository.

---

## Type Labels

These indicate the kind of work.

| Label | Color | When to Use |
|-------|-------|-------------|
| `type:epic` | `#0075ca` | Large feature or initiative spanning multiple issues |
| `type:story` | `#0075ca` | User-facing feature or requirement |
| `type:bug` | `#d73a4a` | Something isn't working as expected |
| `type:spike` | `#cfd3d7` | Research or exploration task |
| `type:chore` | `#fef2c0` | Maintenance, refactoring, infrastructure |

**Rules:**
- Every issue must have exactly one type label
- Applied automatically via issue templates

---

## Priority Labels

These indicate urgency and importance.

| Label | Color | When to Use |
|-------|-------|-------------|
| `P0:critical` | `#b60205` | Blocker, production down, security issue |
| `P1:high` | `#d93f0b` | Important for MVP, user-facing bug |
| `P2:medium` | `#fbca04` | Nice to have for MVP, minor bug |
| `P3:low` | `#0e8a16` | Post-MVP, backlog |

**Rules:**
- Every issue should have a priority label
- Default to P2 if unsure
- P0 reserved for critical production issues

---

## Status Labels

These track issue lifecycle (optional if using Projects V2 for status).

| Label | Color | When to Use |
|-------|-------|-------------|
| `status:triage` | `#fbca04` | Needs review/prioritization |
| `status:ready` | `#0e8a16` | Clear, scoped, ready to work on |
| `status:blocked` | `#b60205` | Cannot proceed (dependency, decision needed) |

**Rules:**
- Use Projects V2 Status field as primary (preferred)
- Labels are optional fallback for filtering

---

## Area Labels

These indicate which part of the codebase is affected.

| Label | Color | When to Use |
|-------|-------|-------------|
| `area:auth` | `#1d76db` | Authentication, guest mode, SMS OTP, email magic link |
| `area:ride-loop` | `#1d76db` | Core ride flow (QR, discovery, offers, state machine) |
| `area:pricing` | `#1d76db` | Pricing calculation, zones, modifiers |
| `area:maps` | `#1d76db` | Google Maps integration, location services |
| `area:driver-directory` | `#1d76db` | Driver profiles, directory, favorites |
| `area:notifications` | `#1d76db` | Push notifications, inbox, deep links |
| `area:history` | `#1d76db` | Ride history, trip details |
| `area:ratings` | `#1d76db` | Ratings, reporting, moderation |
| `area:admin` | `#1d76db` | Admin dashboard (Retool/Appsmith) |
| `area:database` | `#1d76db` | Supabase schema, migrations, RLS policies |
| `area:infra` | `#1d76db` | CI/CD, GitHub Actions, Supabase config, EAS |
| `area:ui-ux` | `#1d76db` | UI components, design system, screens |
| `area:testing` | `#1d76db` | Tests, QA, test infrastructure |

**Rules:**
- Every issue should have at least one area label
- Can have multiple if work spans areas
- Applied via issue template dropdown

---

## Special Labels

These indicate special characteristics.

| Label | Color | When to Use |
|-------|-------|-------------|
| `good-first-issue` | `#7057ff` | Easy onboarding task for new contributors |
| `tech-debt` | `#d4c5f9` | Technical debt, refactoring needed |
| `security` | `#b60205` | Security-related issue or vulnerability |
| `breaking-change` | `#b60205` | Requires migration or major version bump |

**Rules:**
- Use sparingly
- `good-first-issue` for tasks that are:
  - Well-documented
  - Small scope (S size)
  - Don't require deep domain knowledge
  - Have clear acceptance criteria

---

## Label Combinations

### Common Patterns

**Bug fix:**
- `type:bug` + `area:*` + `P1:high` or `P2:medium`

**Feature:**
- `type:story` + `area:*` + `P1:high` or `P2:medium`

**Epic:**
- `type:epic` + multiple `area:*` labels + `P1:high`

**Security:**
- `type:bug` + `security` + `P0:critical`

**Onboarding:**
- `type:story` or `type:chore` + `good-first-issue` + `P3:low` or `P2:medium`

---

## Label Management

### Creating Labels

Use GitHub UI or API. Colors should match the table above.

### Removing Labels

- Don't delete labels that are in use
- Archive unused labels by renaming with `deprecated:` prefix

### Label Hygiene

- Review labels quarterly
- Ensure consistency (one label per concept)
- Document new labels in this file

---

## Related Docs

- [GITHUB_WORKFLOW.md](./GITHUB_WORKFLOW.md) - Workflow overview
- [ISSUE_WRITING_GUIDE.md](./ISSUE_WRITING_GUIDE.md) - How to write issues
- [PROJECTS_V2_SETUP.md](./PROJECTS_V2_SETUP.md) - Projects board setup

