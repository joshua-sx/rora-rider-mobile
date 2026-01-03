#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Creating Rora Ride MVP GitHub Project Board...${NC}\n"

# Create the project
echo -e "${YELLOW}Creating project...${NC}"
PROJECT_ID=$(gh project create \
  --owner joshua-sx \
  --title "Rora Ride MVP Build" \
  --format json | jq -r '.id')

echo -e "${GREEN}✓ Project created: ID $PROJECT_ID${NC}\n"

# Add custom fields to the project
echo -e "${YELLOW}Adding custom fields...${NC}"

# Add Phase field (single select)
gh project field-create $PROJECT_ID \
  --owner joshua-sx \
  --name "Phase" \
  --data-type "SINGLE_SELECT" \
  --single-select-options "Phase 0: Foundation,Phase 1: Backend Core,Phase 2: Rider App,Phase 3: Driver App,Phase 4: Admin Dashboard,Phase 5: Testing,Phase 6: Deployment,Phase 7: Launch" || true

# Add Priority field (single select)
gh project field-create $PROJECT_ID \
  --owner joshua-sx \
  --name "Priority" \
  --data-type "SINGLE_SELECT" \
  --single-select-options "Critical,High,Medium,Low" || true

# Add Effort field (single select)
gh project field-create $PROJECT_ID \
  --owner joshua-sx \
  --name "Effort" \
  --data-type "SINGLE_SELECT" \
  --single-select-options "XS (< 1h),S (1-4h),M (1-2d),L (3-5d),XL (1-2w)" || true

echo -e "${GREEN}✓ Custom fields added${NC}\n"

# Create labels
echo -e "${YELLOW}Creating labels...${NC}"

labels=(
  "phase-0-foundation:0052CC"
  "phase-1-backend:1D76DB"
  "phase-2-rider-app:5319E7"
  "phase-3-driver-app:7057FF"
  "phase-4-admin:B60205"
  "phase-5-testing:FEF2C0"
  "phase-6-deployment:0E8A16"
  "phase-7-launch:008672"
  "priority-critical:D93F0B"
  "priority-high:E99695"
  "priority-medium:FBCA04"
  "priority-low:C2E0C6"
  "database:D4C5F9"
  "edge-function:BFD4F2"
  "mobile-app:FFC0CB"
  "security:B60205"
  "infrastructure:0E8A16"
)

for label in "${labels[@]}"; do
  name="${label%:*}"
  color="${label#*:}"
  gh label create "$name" --color "$color" --repo joshua-sx/RoraExpo --force || true
done

echo -e "${GREEN}✓ Labels created${NC}\n"

# Create milestones
echo -e "${YELLOW}Creating milestones...${NC}"

milestones=(
  "Phase 0: Foundation & Infrastructure|Database schema, RLS policies, storage buckets, auth setup"
  "Phase 1: Backend Core|Edge Functions for quote, ride request, offers, assignment, QR confirmation"
  "Phase 2: Rider App|Complete rider mobile app with all flows"
  "Phase 3: Driver App|Complete driver mobile app with all flows"
  "Phase 4: Admin Dashboard|Web dashboard for org/driver/place management"
  "Phase 5: Testing & QA|Unit tests, integration tests, manual QA, performance testing"
  "Phase 6: Deployment|Deploy backend, mobile apps, admin dashboard to production"
  "Phase 7: Launch & Iteration|Beta testing, public launch, monitoring, iteration"
)

for milestone in "${milestones[@]}"; do
  title="${milestone%|*}"
  description="${milestone#*|}"
  gh milestone create "$title" --description "$description" --repo joshua-sx/RoraExpo || true
done

echo -e "${GREEN}✓ Milestones created${NC}\n"

echo -e "${BLUE}Project setup complete!${NC}"
echo -e "Project URL: https://github.com/users/joshua-sx/projects/$(echo $PROJECT_ID | sed 's/[^0-9]//g')"
echo -e "\nNext step: Run ${YELLOW}./scripts/create-github-issues.sh${NC} to populate issues"
