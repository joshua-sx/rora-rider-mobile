#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

REPO="joshua-sx/RoraExpo"

echo -e "${BLUE}Setting up GitHub Workflow for Rora Ride...${NC}\n"

# ============================================================================
# Step 1: Create Labels
# ============================================================================

echo -e "${YELLOW}Creating labels...${NC}"

# Type labels
labels=(
  "type:epic:#0075ca"
  "type:story:#0075ca"
  "type:bug:#d73a4a"
  "type:spike:#cfd3d7"
  "type:chore:#fef2c0"
)

# Priority labels
labels+=(
  "P0:critical:#b60205"
  "P1:high:#d93f0b"
  "P2:medium:#fbca04"
  "P3:low:#0e8a16"
)

# Status labels (optional, Projects V2 preferred)
labels+=(
  "status:triage:#fbca04"
  "status:ready:#0e8a16"
  "status:blocked:#b60205"
)

# Area labels
labels+=(
  "area:auth:#1d76db"
  "area:ride-loop:#1d76db"
  "area:pricing:#1d76db"
  "area:maps:#1d76db"
  "area:driver-directory:#1d76db"
  "area:notifications:#1d76db"
  "area:history:#1d76db"
  "area:ratings:#1d76db"
  "area:admin:#1d76db"
  "area:database:#1d76db"
  "area:infra:#1d76db"
  "area:ui-ux:#1d76db"
  "area:testing:#1d76db"
)

# Special labels
labels+=(
  "good-first-issue:#7057ff"
  "tech-debt:#d4c5f9"
  "security:#b60205"
  "breaking-change:#b60205"
)

for label in "${labels[@]}"; do
  # Parse format: "name:subname:#color" -> extract name and color
  # Split by ':' and take everything except last as name, last as color
  IFS=':' read -ra PARTS <<< "$label"
  color="${PARTS[-1]}"
  # Join all parts except last with ':'
  name=$(IFS=':'; echo "${PARTS[*]:0:${#PARTS[@]}-1}")
  
  gh label create "$name" --color "$color" --repo "$REPO" --force 2>/dev/null && \
    echo -e "  ${GREEN}✓${NC} Created label: $name" || \
    echo -e "  ${YELLOW}⚠${NC} Label exists: $name"
done

echo -e "${GREEN}✓ Labels created${NC}\n"

# ============================================================================
# Step 2: Create GitHub Project V2
# ============================================================================

echo -e "${YELLOW}Creating GitHub Project V2...${NC}"

# Note: GitHub CLI doesn't fully support Projects V2 API yet
# We'll create the project and provide instructions for manual setup

PROJECT_OUTPUT=$(gh project create \
  --owner joshua-sx \
  --title "Rora Ride MVP Board" \
  --format json 2>&1)

if echo "$PROJECT_OUTPUT" | grep -q "id"; then
  PROJECT_ID=$(echo "$PROJECT_OUTPUT" | jq -r '.id' 2>/dev/null || echo "")
  PROJECT_NUMBER=$(echo "$PROJECT_OUTPUT" | jq -r '.number' 2>/dev/null || echo "")
  
  if [ -n "$PROJECT_ID" ]; then
    echo -e "${GREEN}✓ Project created: ID $PROJECT_ID${NC}"
    echo -e "${BLUE}Project URL: https://github.com/users/joshua-sx/projects/$PROJECT_NUMBER${NC}\n"
    
    echo -e "${YELLOW}⚠ Note: GitHub CLI has limited Projects V2 API support${NC}"
    echo -e "${YELLOW}Please manually configure the project using:${NC}"
    echo -e "  1. Go to: https://github.com/users/joshua-sx/projects/$PROJECT_NUMBER"
    echo -e "  2. Add repository: Settings → Manage Access → Add repository → RoraExpo"
    echo -e "  3. Add custom fields (see docs/workflow/PROJECTS_V2_SETUP.md):"
    echo -e "     - Status (Backlog, Ready, In Progress, In Review, Done, Blocked)"
    echo -e "     - Priority (P0, P1, P2, P3)"
    echo -e "     - Size (XS, S, M, L, XL)"
    echo -e "     - Area (Auth, Ride Loop, Pricing, etc.)"
    echo -e "     - Epic (text field for epic issue number)"
    echo -e "  4. Create views (see docs/workflow/PROJECTS_V2_SETUP.md)\n"
  else
    echo -e "${RED}✗ Failed to parse project ID${NC}"
    echo -e "${YELLOW}Please create project manually at: https://github.com/users/joshua-sx/projects/new${NC}\n"
  fi
else
  echo -e "${YELLOW}⚠ Project creation output:${NC}"
  echo "$PROJECT_OUTPUT"
  echo -e "\n${YELLOW}Please create project manually at: https://github.com/users/joshua-sx/projects/new${NC}\n"
fi

# ============================================================================
# Step 3: Create Starter Issues
# ============================================================================

echo -e "${YELLOW}Creating starter issues...${NC}\n"

# Issue 1: Set up project documentation structure
create_issue() {
  local title="$1"
  local body="$2"
  local labels="$3"
  
  # Convert comma-separated labels to space-separated for gh CLI
  local label_args=""
  IFS=',' read -ra LABEL_ARRAY <<< "$labels"
  for label in "${LABEL_ARRAY[@]}"; do
    label_args+=" --label \"${label// /}\""
  done
  
  # Create issue with labels
  eval "gh issue create --repo \"$REPO\" --title \"$title\" --body \"$body\" $label_args" 2>/dev/null && \
    echo -e "  ${GREEN}✓${NC} Created: $title" || \
    echo -e "  ${RED}✗${NC} Failed: $title (check if labels exist)"
}

# Issue 1: Documentation structure (already done, but create for reference)
create_issue \
  "Set up GitHub workflow documentation" \
  "## Goal
Create comprehensive GitHub workflow documentation and templates.

## Context
We need a professional GitHub workflow system for managing issues, projects, and PRs. See the workflow docs we just created.

## Acceptance Criteria
- [x] GITHUB_WORKFLOW.md created
- [x] ISSUE_WRITING_GUIDE.md created
- [x] LABELS.md created
- [x] PROJECTS_V2_SETUP.md created
- [x] Issue templates created (epic, story, bug, spike, chore)
- [x] PR template created
- [x] Labels created
- [ ] Projects V2 board configured manually
- [ ] First issues created using templates

## Related
- Docs: docs/workflow/
- Templates: .github/ISSUE_TEMPLATE/

## Notes
This issue tracks the completion of the workflow setup. Most work is already done, but Projects V2 needs manual configuration." \
  "type:chore,area:infra,P2:medium"

# Issue 2: Configure ESLint + Prettier + TypeScript strict mode
create_issue \
  "Configure ESLint + Prettier + TypeScript strict mode" \
  "## User Story
As a developer, I want consistent code style and type safety so that the codebase is maintainable and error-free.

## Context
We need code quality tooling to enforce consistent style and catch errors early. See CONTRIBUTING.md for current state.

## Acceptance Criteria
- [ ] ESLint configured for React Native + TypeScript
- [ ] Prettier configured (single quotes, trailing commas, etc.)
- [ ] TypeScript strict: true in tsconfig.json
- [ ] npm scripts: lint, format, typecheck
- [ ] VSCode settings recommended in .vscode/settings.json
- [ ] Pre-commit hooks configured (Husky + lint-staged)

## Technical Notes
- Use Expo's recommended ESLint config
- Prettier config should match existing code style
- TypeScript strict mode may require fixing existing type errors

## Related
- CONTRIBUTING.md
- tasks/tasks-07-testing-qa.md (CI pipeline)" \
  "type:chore,area:infra,P1:high"

# Issue 3: Set up Supabase local development environment
create_issue \
  "Set up Supabase local development environment" \
  "## User Story
As a developer, I want a local Supabase environment so that I can develop and test without affecting production.

## Context
We need Supabase set up locally for development. See tasks/tasks-00-foundation.md task 1.0.

## Acceptance Criteria
- [ ] Supabase project created (cloud or self-hosted)
- [ ] Supabase CLI installed and linked
- [ ] Local Supabase initialized (supabase init)
- [ ] Environment variables configured in .env.local
- [ ] Test connection works (simple query)
- [ ] Documentation added to README.md

## Technical Notes
- Use Supabase CLI: \`supabase init\`
- Link to remote project: \`supabase link --project-ref <ref>\`
- Start local: \`supabase start\`
- Test: \`supabase db query \"SELECT 1\"\`

## Related
- tasks/tasks-00-foundation.md task 1.0
- SPEC.md §23 (Tech Stack)" \
  "type:chore,area:database,P0:critical"

# Issue 4: Create initial database schema
create_issue \
  "Create initial database schema (regions, users, guest_tokens)" \
  "## User Story
As a developer, I need core database tables so that the app can store and retrieve data.

## Context
We need core database tables for regions, users, and guest tokens with RLS policies. See tasks/tasks-00-foundation.md task 2.0.

## Acceptance Criteria
- [ ] Migration created: setup_regions_and_users
- [ ] regions table defined (SPEC §22)
- [ ] users table defined (extends auth.users)
- [ ] guest_tokens table defined with 30-day TTL
- [ ] Indexes added (regions.is_active, guest_tokens.token, etc.)
- [ ] Migration applied: supabase db push
- [ ] TypeScript types generated: supabase gen types typescript
- [ ] RLS policies added and tested

## Technical Notes
- Use Supabase migrations: \`supabase migration new <name>\`
- Generate types: \`supabase gen types typescript --local > types/database.ts\`
- Test RLS: verify unauthenticated users can't access protected data

## Related
- tasks/tasks-00-foundation.md task 2.0
- SPEC.md §22 (Data Model)
- DECISIONS.md D1 (Guest Mode)" \
  "type:story,area:database,P0:critical"

# Issue 5: Set up PostHog analytics
create_issue \
  "Set up PostHog (self-hosted) analytics" \
  "## User Story
As a product owner, I want analytics tracking so that I can understand user behavior and improve the product.

## Context
We need PostHog integrated for analytics tracking. See tasks/tasks-00-foundation.md task 7.0.

## Acceptance Criteria
- [ ] PostHog installed: npm install posthog-react-native
- [ ] src/lib/posthog.ts created with initialization
- [ ] PostHog host + API key in .env.local
- [ ] PostHogProvider added to app root
- [ ] Typed event tracking helper: trackEvent(name, properties)
- [ ] Test event tracked: app_launched
- [ ] Event visible in PostHog dashboard

## Technical Notes
- Use self-hosted PostHog instance
- Initialize in app root (_layout.tsx)
- Create typed event helper for consistency
- Test with Expo Go first, then production build

## Related
- tasks/tasks-00-foundation.md task 7.0
- SPEC.md §23, §27" \
  "type:story,area:infra,P1:high"

# Issue 6: Set up Sentry error tracking
create_issue \
  "Set up Sentry error tracking" \
  "## User Story
As a developer, I want error tracking so that I can identify and fix bugs quickly.

## Context
We need Sentry integrated for error and crash tracking. See tasks/tasks-00-foundation.md task 8.0.

## Acceptance Criteria
- [ ] Sentry installed: npm install @sentry/react-native
- [ ] Sentry initialized in app entry point
- [ ] Sentry DSN configured in .env.local
- [ ] Source map upload configured
- [ ] User context set (exclude PII)
- [ ] Test error captured: Sentry.captureException(new Error('Test'))
- [ ] Error visible in Sentry dashboard

## Technical Notes
- Initialize in app root (_layout.tsx)
- Configure source maps for EAS builds
- Set user context (exclude PII per privacy policy)
- Test with intentional error

## Related
- tasks/tasks-00-foundation.md task 8.0
- SPEC.md §23" \
  "type:story,area:infra,P1:high"

echo -e "\n${GREEN}✓ Starter issues created${NC}\n"

# ============================================================================
# Summary
# ============================================================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}GitHub Workflow Setup Complete!${NC}\n"
echo -e "${BLUE}Next Steps:${NC}"
echo -e "1. Configure Projects V2 board manually (see docs/workflow/PROJECTS_V2_SETUP.md)"
echo -e "2. Add repository to project: Settings → Manage Access → Add repository"
echo -e "3. Add custom fields (Status, Priority, Size, Area, Epic)"
echo -e "4. Create views (Board, Table, Ready Queue, etc.)"
echo -e "5. Add issues to project board"
echo -e "6. Start working on issues!\n"
echo -e "${BLUE}Documentation:${NC}"
echo -e "- Workflow: docs/workflow/GITHUB_WORKFLOW.md"
echo -e "- Issue Guide: docs/workflow/ISSUE_WRITING_GUIDE.md"
echo -e "- Labels: docs/workflow/LABELS.md"
echo -e "- Projects Setup: docs/workflow/PROJECTS_V2_SETUP.md"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

