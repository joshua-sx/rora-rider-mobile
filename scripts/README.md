# GitHub Project Setup Scripts

This directory contains scripts to create a complete GitHub Project board and issues for the Rora Ride MVP build.

## Prerequisites

- [GitHub CLI](https://cli.github.com/) installed and authenticated
- `jq` installed (for JSON parsing): `brew install jq`

## Usage

### Step 1: Create the Project Board

```bash
./scripts/create-github-project.sh
```

This script will:
- ✅ Create a new GitHub Project titled "Rora Ride MVP Build"
- ✅ Add custom fields (Phase, Priority, Effort)
- ✅ Create labels for all phases and priorities
- ✅ Create milestones for each phase

**Output:** You'll get a project URL like `https://github.com/users/joshua-sx/projects/XX`

### Step 2: Create All Issues

```bash
./scripts/create-github-issues.sh
```

This script will:
- ✅ Create ~60 issues covering all 7 phases of the MVP build
- ✅ Assign labels (phase, priority, category)
- ✅ Assign milestones
- ✅ Include detailed task checklists and acceptance criteria

**Output:** All issues will be created in [github.com/joshua-sx/RoraExpo/issues](https://github.com/joshua-sx/RoraExpo/issues)

### Step 3: Organize Issues in Project

After running both scripts:

1. Go to your project board
2. Add the repository to the project: **Settings → Manage Access → Add repository**
3. Add all issues to the project:
   - Click **+ Add Item**
   - Select **Add items from repository**
   - Select all issues
4. Organize into columns (recommended):
   - **Backlog** (all pending issues)
   - **Ready** (issues ready to work on)
   - **In Progress** (currently working)
   - **In Review** (code review / testing)
   - **Done** (completed)

## Project Structure

### Phases

1. **Phase 0: Foundation & Infrastructure** (Database, RLS, Auth) — ~2-3 weeks
2. **Phase 1: Backend Core** (Edge Functions) — ~2-3 weeks
3. **Phase 2: Rider App** (Mobile UI/UX) — ~2-3 weeks
4. **Phase 3: Driver App** (Mobile UI/UX) — ~1-2 weeks
5. **Phase 4: Admin Dashboard** (Web UI) — ~1 week
6. **Phase 5: Testing & QA** (Unit, integration, manual) — ~1 week
7. **Phase 6: Deployment** (Production deployment) — ~1 week
8. **Phase 7: Launch & Iteration** (Beta, launch, iterate) — Ongoing

### Labels

- **Phase labels:** `phase-0-foundation`, `phase-1-backend`, etc.
- **Priority labels:** `priority-critical`, `priority-high`, `priority-medium`, `priority-low`
- **Category labels:** `database`, `edge-function`, `mobile-app`, `security`, `infrastructure`

### Custom Fields

- **Phase:** Single-select (Phase 0, Phase 1, etc.)
- **Priority:** Single-select (Critical, High, Medium, Low)
- **Effort:** Single-select (XS < 1h, S 1-4h, M 1-2d, L 3-5d, XL 1-2w)

## Customization

You can edit the scripts to:
- Change project/issue titles
- Add/remove labels or milestones
- Adjust issue descriptions
- Add assignees or due dates

## Troubleshooting

### "gh: command not found"
Install GitHub CLI: `brew install gh`

### "jq: command not found"
Install jq: `brew install jq`

### "Not authenticated"
Run: `gh auth login`

### Issues not showing in project
Make sure to:
1. Add the repository to the project (Settings → Manage Access)
2. Manually add issues via "+ Add Item" in the project board

## Next Steps

After setup:
1. ✅ Review all issues for accuracy
2. ✅ Prioritize Phase 0 issues (foundation)
3. ✅ Start working through the checklist
4. ✅ Update issue status as you progress
5. ✅ Link PRs to issues (use "Closes #XX" in PR description)

---

**Total Issues:** ~60
**Estimated Timeline:** 8-12 weeks (1-2 developers)
**MVP Definition of Done:** All Phase 0-6 issues completed + successful beta test
