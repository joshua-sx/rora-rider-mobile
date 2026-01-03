# Projects V2 Setup Guide

This guide explains how to configure GitHub Projects V2 for Rora Ride.

---

## Project Structure

### Recommended Project Name

**"Rora Ride MVP Board"** or **"Rora Ride Development"**

### Project Type

**Table + Board views** (both are useful)

---

## Custom Fields

### Status (Single Select)

**Purpose:** Track issue lifecycle

**Options:**
- `📋 Backlog` - Not yet prioritized
- `✅ Ready` - Cleared for work, specs complete
- `🏗️ In Progress` - Actively being worked on
- `👀 In Review` - PR open, awaiting review/testing
- `✔️ Done` - Merged, deployed, or completed
- `🚫 Blocked` - Cannot proceed (dependency, decision needed)

**Default:** `📋 Backlog`

**When to update:**
- Move to `✅ Ready` when issue is clear and scoped
- Move to `🏗️ In Progress` when work starts
- Move to `👀 In Review` when PR is opened
- Move to `✔️ Done` when PR is merged
- Move to `🚫 Blocked` if blocked

---

### Priority (Single Select)

**Purpose:** Indicate urgency and importance

**Options:**
- `🔴 P0: Critical` - Blocker, production down, security
- `🟠 P1: High` - Important for MVP, user-facing bug
- `🟡 P2: Medium` - Nice to have for MVP, minor bug
- `🟢 P3: Low` - Post-MVP, backlog

**Default:** `🟡 P2: Medium`

**When to use:**
- P0: Critical production issues only
- P1: MVP-critical features, major bugs
- P2: Most issues default here
- P3: Future work, nice-to-haves

---

### Size (Single Select)

**Purpose:** Estimate effort

**Options:**
- `XS` - < 2 hours
- `S` - 2-4 hours (half day)
- `M` - 1 day
- `L` - 2-3 days
- `XL` - > 3 days (should be broken down)

**Default:** `M`

**When to use:**
- XS: Documentation, small fixes
- S: Simple features, bug fixes
- M: Most features (default)
- L: Complex features, refactors
- XL: Epics (should be broken into smaller issues)

---

### Area (Single Select)

**Purpose:** Indicate which part of codebase is affected

**Options:**
- `Auth` - Authentication, guest mode
- `Ride Loop` - Core ride flow
- `Pricing` - Pricing calculation
- `Maps` - Google Maps integration
- `Driver Directory` - Driver profiles, directory
- `Notifications` - Push notifications, inbox
- `History` - Ride history
- `Ratings` - Ratings, reporting
- `Admin` - Admin dashboard
- `Database` - Supabase schema, migrations
- `Infra` - CI/CD, infrastructure
- `UI/UX` - UI components, design system
- `Testing` - Tests, QA

**Default:** None (required selection)

**When to use:**
- Match to `area:*` labels
- Can have multiple if work spans areas (use primary area)

---

### Epic (Text or Linked Issue)

**Purpose:** Link story/bug to parent epic

**Options:**
- Text field: Enter epic issue number (e.g., "#45")
- Or use GitHub's "Linked Issues" feature

**When to use:**
- If issue is part of an epic, enter epic issue number
- Leave empty if standalone issue

**Convention:**
- In issue body, also add: `Epic: #45`
- Epic issue should list all child issues

---

### Iteration/Sprint (Optional)

**Purpose:** Track sprint/iteration (if using sprints)

**Options:**
- `Sprint 1: Foundation`
- `Sprint 2: Core Loop Part 1`
- `Sprint 3: Core Loop Part 2`
- etc.

**When to use:**
- Only if using sprint-based planning
- Can be left empty for continuous flow

---

## Recommended Views

### 1. Board View (Kanban)

**Purpose:** Visual workflow tracking

**Configuration:**
- **Group by:** Status
- **Sort by:** Priority (desc), then Created (asc)
- **Filter:** None (or by Area if needed)

**Columns:**
- Backlog
- Ready
- In Progress
- In Review
- Done
- Blocked

**Use case:** Daily standup, visual progress tracking

---

### 2. Table View (Spreadsheet)

**Purpose:** Detailed issue management

**Configuration:**
- **Show all fields:** Yes
- **Sort by:** Priority (desc), then Created (asc)
- **Filter:** None (or by Area, Status, etc.)

**Columns:**
- Title
- Status
- Priority
- Size
- Area
- Epic
- Assignee
- Labels

**Use case:** Issue triage, detailed planning

---

### 3. "My Work" View

**Purpose:** Personal task list

**Configuration:**
- **Group by:** Status
- **Sort by:** Priority (desc)
- **Filter:** Assignee = [Your username]

**Use case:** Personal task tracking

---

### 4. "Ready" Queue View

**Purpose:** Queue of work ready to be picked up

**Configuration:**
- **Group by:** Area
- **Sort by:** Priority (desc), then Size (asc)
- **Filter:** Status = "Ready"

**Use case:** Finding next task to work on

---

### 5. "Sprint" View (If Using Sprints)

**Purpose:** Current sprint work

**Configuration:**
- **Group by:** Status
- **Sort by:** Priority (desc)
- **Filter:** Iteration = [Current Sprint]

**Use case:** Sprint planning, daily standup

---

## Epic Linking Convention

### In Issue Body

When a story/bug is part of an epic, add this to the issue body:

```markdown
## Epic: #45

[Rest of issue content...]
```

### In Projects V2

1. **Epic field:** Enter epic issue number (e.g., "#45")
2. **GitHub will auto-link:** Issues linked to epic show in epic issue
3. **Filter by epic:** Use epic field to filter/view all issues in an epic

### Epic Issue Structure

Epic issues should:
- Describe the high-level goal
- List child issues in body (or rely on GitHub's linked issues)
- Track progress via linked issues

**Example:**

```markdown
## Goal
Enable guest mode with rate limiting and history migration.

## Child Issues
- #18: Guest token generation
- #19: Rate limiting implementation
- #20: Guest ride storage
- #21: History migration on signup

## Progress
- [ ] #18
- [ ] #19
- [ ] #20
- [ ] #21
```

---

## Workflow Automation

### Manual Workflow (Recommended for MVP)

1. **On Issue Created:**
   - Default Status: `📋 Backlog`
   - Default Priority: `🟡 P2: Medium`
   - Default Size: `M`

2. **On PR Opened:**
   - Move issue to `👀 In Review` (manual)

3. **On PR Merged:**
   - Move issue to `✔️ Done` (manual or automation)

### Automation (Future)

Can be automated with GitHub Actions:
- Auto-move to "In Review" when PR opened
- Auto-move to "Done" when PR merged
- Auto-assign based on area labels

---

## Best Practices

### Status Updates

- **Update status when you start work** - Move to "In Progress"
- **Update status when PR opens** - Move to "In Review"
- **Update status when done** - Move to "Done"

### Priority Management

- **Review priorities weekly** - Ensure P1 issues are being worked on
- **Escalate if needed** - Move to P0 if blocking
- **De-prioritize if stale** - Move to P3 if not needed soon

### Size Estimation

- **Break down large issues** - XL issues should be split
- **Re-estimate if scope changes** - Update size field
- **Use size for sprint planning** - If using sprints

### Area Organization

- **Use area for filtering** - Find all "Ride Loop" work
- **Update if scope changes** - Change area if work expands

---

## Related Docs

- [GITHUB_WORKFLOW.md](./GITHUB_WORKFLOW.md) - Workflow overview
- [ISSUE_WRITING_GUIDE.md](./ISSUE_WRITING_GUIDE.md) - How to write issues
- [LABELS.md](./LABELS.md) - Label definitions

