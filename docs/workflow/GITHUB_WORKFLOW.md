# GitHub Workflow

This document describes how we use GitHub Issues, Projects, and Pull Requests to manage work on Rora Ride.

---

## Work Lifecycle

All work flows through these stages:

1. **Triage** → Issue created, needs review/prioritization
2. **Ready** → Issue is clear, scoped, and ready to be worked on
3. **In Progress** → Someone is actively working on it
4. **In Review** → PR is open, awaiting review
5. **Done** → Merged and deployed (or closed if not needed)

**Status is tracked in GitHub Projects V2** (not just labels). See [PROJECTS_V2_SETUP.md](./PROJECTS_V2_SETUP.md) for board configuration.

---

## Issue Types

### Epic
Large feature or initiative that spans multiple issues. Examples:
- "Guest Mode Implementation" (includes auth, token system, migration)
- "Core Ride Loop" (includes QR, discovery, offers, state machine)

**Epic structure:**
- Epic issue describes the goal and scope
- Child issues (stories/bugs) link to epic in body: `Epic: #123`
- Epic tracks progress via linked issues

### Story
User-facing feature or requirement. Examples:
- "Rider can generate QR code for ride request"
- "Rider can compare multiple driver offers"

**Story structure:**
- Clear user story format: "As a [user], I want [goal] so that [benefit]"
- Acceptance criteria (required)
- Links to SPEC.md sections if applicable

### Bug
Something isn't working as expected. Examples:
- "QR code doesn't display offline"
- "Pricing calculation incorrect for zone-to-zone routes"

**Bug structure:**
- Reproduction steps (required)
- Expected vs actual behavior
- Environment (iOS/Android, version, device)

### Spike
Research or exploration task. Examples:
- "Research Google Maps Places API rate limits"
- "Evaluate Supabase Realtime vs polling for offer updates"

**Spike structure:**
- Timebox (e.g., "2 hours max")
- Research question/goal
- Output artifact (doc, decision, proof-of-concept)

### Chore
Maintenance, refactoring, or infrastructure work. Examples:
- "Upgrade Expo SDK to 54"
- "Refactor pricing calculation into separate module"

**Chore structure:**
- Clear scope boundaries (what's in/out)
- Why it's needed (technical debt, dependency update, etc.)

---

## Branching Strategy

We use **main-only** with feature branches. All branches must include the issue number.

### Branch Naming

```
<type>/<issue-number>-<short-description>
```

**Types:**
- `feature/` - New features (stories, epics)
- `bugfix/` - Bug fixes
- `chore/` - Maintenance, refactoring, infrastructure
- `docs/` - Documentation only

**Examples:**
- `feature/18-add-driver-directory-filters`
- `bugfix/45-qr-offline-display`
- `chore/67-upgrade-expo-sdk`
- `docs/12-update-edge-function-docs`

**Rules:**
- Always include issue number
- Use kebab-case (lowercase with hyphens)
- Keep description short (3-4 words max)
- No special characters except hyphens

### Creating a Branch

```bash
# From main
git checkout main
git pull origin main
git checkout -b feature/18-add-driver-directory-filters
```

---

## Pull Request Rules

### PR Requirements

1. **Must link issue** - Use `Closes #18` or `Fixes #45` in PR description
2. **Must include testing notes** - Step-by-step how to test the changes
3. **Must include screenshots** - Required if UI changes (iOS and Android if applicable)
4. **Must pass quality gates** - See Definition of Done below

### PR Template

Use the PR template (`.github/pull_request_template.md`) which includes:
- Issue link
- What changed
- Screenshots (if UI)
- How to test
- Risk/impact notes

### PR Review Process

1. Create PR from feature branch
2. Ensure CI passes (typecheck, lint, tests)
3. Request review
4. Address feedback
5. Squash and merge to `main`
6. Delete branch after merge

**PRs automatically close linked issues** when merged.

---

## Definition of Done

Before a PR can be merged, all of these must pass:

### Code Quality
- [ ] `npx tsc --noEmit` passes (TypeScript typecheck)
- [ ] `npm run lint` passes (ESLint)
- [ ] App runs locally on iOS (`npx expo start --ios`)
- [ ] App runs locally on Android (`npx expo start --android`)

### Database Changes
- [ ] Migration created (if schema changes)
- [ ] Types regenerated: `npx supabase gen types typescript > types/database.ts`
- [ ] RLS policies added/updated (if applicable)
- [ ] Migration tested locally

### Security & Ride State
- [ ] Ride state transitions validated server-side (if applicable)
- [ ] Ride event logging added (for state changes)
- [ ] QR token validation implemented (if applicable)
- [ ] Guest mode works correctly (if applicable)
- [ ] No hardcoded secrets
- [ ] Environment variables documented (if new)

### Edge Functions
- [ ] Edge Function deployed and tested
- [ ] Input validation implemented
- [ ] Error handling in place
- [ ] State transitions validated (if applicable)

### UI/UX
- [ ] Loading states exist
- [ ] Empty states exist
- [ ] Error states exist
- [ ] Offline behavior handled (if applicable)
- [ ] Screenshots included in PR

### Documentation
- [ ] Docs updated if behavior changes
- [ ] SPEC.md updated if feature changes
- [ ] DECISIONS.md updated if architectural decision made

### Testing
- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] Guest mode tested (if applicable)
- [ ] Offline scenarios tested (if applicable)

---

## Using Projects V2

**Projects V2 is our primary board** (not just a note-taking tool).

### Board Structure

- **Status column** tracks lifecycle (Triage → Ready → In Progress → In Review → Done)
- **Custom fields** track Priority, Size, Area, Epic
- **Views** provide different perspectives (by status, by area, ready queue)

See [PROJECTS_V2_SETUP.md](./PROJECTS_V2_SETUP.md) for detailed setup.

### Workflow in Projects

1. **Create issue** → Auto-added to "Triage" status
2. **Triage issue** → Move to "Ready" when clear and scoped
3. **Start work** → Move to "In Progress", assign yourself
4. **Open PR** → Move to "In Review" (auto or manual)
5. **Merge PR** → Move to "Done" (auto or manual)

---

## Epic Linking Convention

When a story/bug is part of an epic:

1. **In the issue body**, add: `Epic: #123` (where #123 is the epic issue)
2. **In the epic issue**, GitHub will show linked issues automatically
3. **In Projects V2**, you can filter by epic field

**Example:**

```markdown
## Epic: #45

As a rider, I want to compare driver offers so that I can choose the best deal.

### Acceptance Criteria
- [ ] Rider sees all pending offers in a list
- [ ] Offers show price context labels (Good deal, Pricier)
- [ ] Rider can select an offer to confirm
```

---

## Quick Reference

### Starting Work
1. Check Projects board for "Ready" issues
2. Assign yourself
3. Move to "In Progress"
4. Create branch: `feature/18-short-description`
5. Start coding

### Finishing Work
1. Push branch and create PR
2. Link issue: `Closes #18`
3. Add screenshots (if UI)
4. Move issue to "In Review" in Projects
5. Request review
6. Address feedback
7. Merge when approved
8. Issue auto-closes, move to "Done" in Projects

---

## Related Docs

- [ISSUE_WRITING_GUIDE.md](./ISSUE_WRITING_GUIDE.md) - How to write good issues
- [LABELS.md](./LABELS.md) - Label definitions and usage
- [PROJECTS_V2_SETUP.md](./PROJECTS_V2_SETUP.md) - Projects board configuration
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Development workflow and conventions
- [CLAUDE.md](../../CLAUDE.md) - AI assistant guidelines

