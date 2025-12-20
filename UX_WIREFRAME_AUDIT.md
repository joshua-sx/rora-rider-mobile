# UX Wireframe Audit Report

**Date:** 2025-12-19
**App:** RoraExpo (Ride-hailing app for Sint Maarten)

## Executive Summary

This audit evaluates key screens and user flows against the UX Wireframe Checklist. The app demonstrates **strong visual design and technical implementation**, but reveals **critical UX gaps** in navigation clarity, empty states, error recovery, and user orientation.

**Overall Score:** 7.5/10
**Critical Issues:** 12
**Recommended Improvements:** 28

---

## Critical User Flows Analyzed

1. **Home → Route Planning → Trip Preview** (Primary booking flow)
2. **Explore → Venue Details → Book Ride**
3. **Browse Drivers → Driver Profile → Book Ride**
4. **Location Permission Flow**

---

## Screen-by-Screen Audit

### 1. Home Screen (`app/(tabs)/index.tsx`)

**Purpose:** Main map view with destination search

#### ✅ Strengths
- Primary action (search) is immediately visible in bottom sheet
- Clean map-first design
- Good use of safe area insets
- Location permission modal provides clear explanation

#### ❌ Critical Gaps

| Checklist Item | Status | Issue | Location |
|---------------|--------|-------|----------|
| **1.1** Screen purpose obvious | ⚠️ | No onboarding or context for first-time users | index.tsx:17-234 |
| **3.3** No dead ends | ❌ | If location permission denied, no clear next step | index.tsx:157-159 |
| **6.1** Feedback after action | ⚠️ | No confirmation when location is acquired | index.tsx:59-108 |
| **7.1** Empty states | ❌ | No guidance when map shows default location | index.tsx:14-19 |
| **7.3** Permission denied | ⚠️ | Modal disappears but no persistent UI for manual entry | index.tsx:207-212 |
| **8.3** Bottom sheet handle | ✅ | Properly implemented | destination-bottom-sheet.tsx:129 |

**Recommendations:**
1. Add first-time user tooltip explaining the pill search bar
2. Show a persistent "Enable Location" banner when permission is denied
3. Display confirmation toast when location is successfully acquired
4. Add visual indicator when using default vs. actual location

---

### 2. Route Input Screen (`app/route-input.tsx`)

**Purpose:** Enter pickup/dropoff locations and calculate route

#### ✅ Strengths
- Clear header title "Your route"
- Back navigation is obvious
- Input fields are well-labeled
- Autocomplete works with highlighting
- Continue button only appears when both locations selected

#### ❌ Critical Gaps

| Checklist Item | Status | Issue | Location |
|---------------|--------|-------|----------|
| **4.3** CTA state clear | ⚠️ | No disabled state shown before both locations selected | route-input.tsx:624-638 |
| **5.4** Keyboard behavior | ⚠️ | Autocomplete dropdown appears absolute positioned - may overlap keyboard | route-input.tsx:472-497, 574-599 |
| **6.2** Loading states | ✅ | Good loading indicators | route-input.tsx:499-505, 601-607 |
| **6.4** Error recovery | ⚠️ | Alert shown but user stuck in loading view | route-input.tsx:309-316 |
| **7.1** Empty state | ❌ | No suggestions for "popular routes" when inputs are empty | route-input.tsx:389-642 |
| **8.1** Consistent spacing | ✅ | Well implemented | route-input.tsx:757-762 |
| **9.2** Gesture conflicts | ✅ | Proper keyboard handling | route-input.tsx:415 |

**Specific Issues:**
- **Lines 472-497, 574-599:** FlatList inside ScrollView with absolute positioning - potential scroll conflicts
- **Lines 309-316:** Alert dismisses but doesn't reset UI state properly - user sees map with no route
- **Lines 624-638:** Continue button appears/disappears but no explanation of why it's not available

**Recommendations:**
1. Add "Popular routes" section when inputs are empty
2. Show inline message "Select pickup and dropoff to continue" instead of hiding button
3. Improve error recovery - return to input view with pre-filled locations
4. Consider using KeyboardAwareScrollView for better autocomplete positioning
5. Add "Recent searches" functionality

---

### 3. Trip Preview Screen (`app/trip-preview.tsx`)

**Purpose:** Show route details, pricing, and QR code

#### ✅ Strengths
- Clear route visualization on map
- Well-structured information hierarchy
- Swipeable pages with clear indicators
- Good use of safe area padding

#### ❌ Critical Gaps

| Checklist Item | Status | Issue | Location |
|---------------|--------|-------|----------|
| **1.3** Secondary actions | ⚠️ | "Save Trip" label unclear - is this saving for later or booking? | trip-preview.tsx:279-288 |
| **3.2** Back navigation | ✅ | Clear back button | trip-preview.tsx:174-185 |
| **4.1** CTA always visible | ✅ | Button always in view | trip-preview.tsx:279-288 |
| **6.3** Success states | ❌ | No confirmation after "Save Trip" is pressed | trip-preview.tsx:104-110 |
| **12.1** Flow completion | ⚠️ | Unclear what happens after saving - goes to home but no booking made | trip-preview.tsx:104-110 |
| **12.2** Recovery paths | ❌ | No way to edit pickup/dropoff from this screen | trip-preview.tsx:20-323 |

**Specific Issues:**
- **Lines 104-110:** "Save Trip" navigates to home but no visual confirmation
- **Lines 279-288:** Button icon is "heart-outline" suggesting "favorite" but label says "Save Trip"
- **Lines 74-89:** Auto-saves to history but user never confirms they want this trip
- **No edit functionality:** If user realizes pickup/dropoff is wrong, must go back and lose all data

**Recommendations:**
1. Rename "Save Trip" to "Save for Later" or "Confirm & Request Driver"
2. Add toast/modal confirmation after save
3. Add "Edit Route" button to modify pickup/dropoff
4. Clarify trip status: "Preview" vs. "Saved" vs. "Booked"
5. Consider adding "Request Driver Now" as primary CTA

---

### 4. Explore Screen (`app/(tabs)/explore/index.tsx`)

**Purpose:** Discover venues and destinations

#### ✅ Strengths
- Clear screen title "Explore"
- Good search interaction (expands on focus)
- Categories are visually distinct
- "See all" links are discoverable

#### ❌ Critical Gaps

| Checklist Item | Status | Issue | Location |
|---------------|--------|-------|----------|
| **1.1** Purpose obvious | ✅ | Clear title and sections | explore/index.tsx:70 |
| **4.4** CTA placement consistent | ✅ | Venue cards have consistent CTAs | explore/index.tsx:124-130 |
| **7.1** Empty states | ❌ | No empty state for search results with no matches | explore/search-results.tsx (referenced) |
| **7.4** Offline scenarios | ❌ | No handling if venue data fails to load | explore/index.tsx:31-32 |
| **8.4** Tab bar overlap | ⚠️ | Bottom padding may not account for tab bar | explore/index.tsx:151 |

**Recommendations:**
1. Add empty state for "No venues found" in search
2. Add skeleton loaders for featured/nearby sections
3. Verify bottom padding accommodates tab bar height
4. Add offline mode messaging

---

### 5. Venue Detail Screen (`app/(tabs)/explore/venue/[id].tsx`)

**Purpose:** Show venue details and enable ride booking

#### ✅ Strengths
- Clear venue information hierarchy
- Map preview shows location
- "Get a ride" CTA is prominent
- Error state exists for missing venue

#### ❌ Critical Gaps

| Checklist Item | Status | Issue | Location |
|---------------|--------|-------|----------|
| **3.1** Know how I got here | ⚠️ | No breadcrumb or category context | venue/[id].tsx:21-240 |
| **6.1** Feedback after action | ✅ | Good loading state for route calculation | venue/[id].tsx:28 |
| **6.4** Error states | ⚠️ | Alert shown but sheet remains open | venue/[id].tsx:114-119 |
| **12.2** Recovery paths | ❌ | Can't edit pickup location from venue screen | venue/[id].tsx:60-123 |
| **7.3** Permission states | ❌ | Uses hardcoded location instead of actual user location | venue/[id].tsx:69-72 |

**Specific Issues:**
- **Lines 69-72:** Hardcoded Sint Maarten coordinates - doesn't use actual user location from store
- **Lines 114-119:** Error alert but RideCtaSheet stays in loading/closed state
- **No pickup editing:** Assumes current location but no way to change it

**Recommendations:**
1. Integrate with location store to use actual user position
2. Add pickup location selector in RideCtaSheet
3. Improve error recovery flow
4. Add venue category badge for context

---

### 6. Drivers Screen (`app/(tabs)/drivers.tsx`)

**Purpose:** Browse and filter available drivers

#### ✅ Strengths
- Clear title and subtitle
- Filter pills are intuitive
- Empty state exists

#### ❌ Critical Gaps

| Checklist Item | Status | Issue | Location |
|---------------|--------|-------|----------|
| **1.2** One clear CTA | ⚠️ | Each driver card is tappable but no visual CTA | drivers.tsx:44-127 |
| **7.1** Empty states | ✅ | "No drivers found" message exists | drivers.tsx:120-126 |
| **7.4** Offline handling | ❌ | No handling if driver data fails to load | drivers.tsx:29-40 |

**Recommendations:**
1. Add "View Profile" button on driver cards
2. Add loading skeleton while filtering
3. Handle offline/error states

---

### 7. Driver Profile Screen (`app/driver/[id].tsx`)

**Purpose:** View driver details and book ride

#### ✅ Strengths
- Clear information hierarchy
- Contact actions are obvious
- "Book Ride" CTA is always visible
- Disabled state when driver off duty

#### ❌ Critical Gaps

| Checklist Item | Status | Issue | Location |
|---------------|--------|-------|----------|
| **4.3** CTA state clear | ✅ | Button shows "Driver Off Duty" when disabled | driver/[id].tsx:214-228 |
| **6.4** Error states | ❌ | No error handling if contact actions fail | driver/[id].tsx:44-54 |
| **12.2** Recovery paths | ✅ | Back button works correctly | driver/[id].tsx:40-42 |

**Recommendations:**
1. Add error handling for failed phone/email actions
2. Consider adding "Notify when available" for off-duty drivers

---

### 8. Bottom Sheets & Modals

#### Destination Bottom Sheet (`components/destination-bottom-sheet.tsx`)
✅ **Strengths:**
- Proper safe area handling
- Smooth animations
- Gesture-friendly (pan to collapse/expand)

⚠️ **Issues:**
- Lines 31-32: Starts expanded - may surprise users on first load
- Lines 136-139: Complex gesture config may conflict with carousel scroll

#### Ride CTA Sheet (`components/ride-cta-sheet.tsx`)
✅ **Strengths:**
- Clear pickup/destination fields
- Route preview with distance/time
- Good visual hierarchy

❌ **Issues:**
- Lines 71-78: Pickup field says "Current Location" but may not be accurate
- Lines 81-95: Destination is locked - no way to change it
- No error state if location isn't available

#### Location Permission Modal (`components/location-permission-modal.tsx`)
✅ **Strengths:**
- Excellent explanation before system prompt
- Two clear options
- Good visual design

⚠️ **Issues:**
- Lines 88-93: "Enter Manually" dismisses modal but no follow-up UI
- No persistence if user dismisses without choosing

---

## Cross-Cutting Issues

### Navigation & Orientation
| Issue | Impact | Screens Affected |
|-------|--------|------------------|
| No breadcrumbs | Users don't know navigation path | Venue Detail, Driver Profile |
| Inconsistent back buttons | Some screens use arrow-back, some use close | All detail screens |
| Tab bar state unclear | Active tab not always obvious | All tab screens |

### Error Handling
| Issue | Impact | Screens Affected |
|-------|--------|------------------|
| Alerts with no recovery | User stuck after dismissing alert | Route Input, Venue Detail |
| No retry mechanism | Must restart flow after errors | Route Input |
| Generic error messages | Users don't know how to fix | Multiple screens |

### Empty & Edge States
| Issue | Impact | Screens Affected |
|-------|--------|------------------|
| No loading skeletons | Feels slow/broken | Explore, Drivers |
| Missing empty states | Users don't know what to do | Route Input, Search |
| No offline handling | App breaks with no network | All API-dependent screens |

### Feedback & Confirmation
| Issue | Impact | Screens Affected |
|-------|--------|------------------|
| Silent saves | Users don't know if action worked | Trip Preview |
| No success states | Uncertain if booking completed | Multiple flows |
| Immediate navigation | No time to see confirmation | Trip Preview |

---

## Critical User Flow Analysis

### Flow 1: Home → Route Planning → Trip Preview

**Goal:** Book a ride from current location to a destination

**Steps:**
1. Home screen loads with map
2. Tap search pill in bottom sheet
3. Navigate to `/route-input`
4. Enter pickup and dropoff
5. Tap "Continue"
6. View trip preview with pricing
7. Tap "Save Trip"
8. Return to home

**Issues:**
- ⚠️ Step 2: No visual feedback that tap was registered
- ❌ Step 4: No recent searches or popular routes shown
- ❌ Step 5: Button appears without explanation
- ❌ Step 7: "Save Trip" unclear - is this booking or saving for later?
- ❌ Step 8: No confirmation that save worked
- ❌ **Missing step:** No actual driver request/booking flow exists

**Recommendation:**
- Add loading state between steps 2-3
- Add "Popular routes" in step 4
- Change step 7 to "Request Driver" with confirmation modal
- Add step 8a: Show booking confirmation before returning home

---

### Flow 2: Explore → Venue → Book Ride

**Goal:** Book a ride to a venue/destination

**Steps:**
1. Tap Explore tab
2. Browse featured venues or search
3. Tap venue card
4. View venue details
5. Tap "Get a ride" CTA
6. Bottom sheet appears with route preview
7. Tap "Get Official Quote & View Drivers"
8. Navigate to trip preview

**Issues:**
- ❌ Step 6: Uses hardcoded location, not actual user position
- ❌ Step 6: Can't change pickup location
- ⚠️ Step 7: "Official Quote" confusing - what's unofficial?
- ❌ Step 8: Skips route input screen - can't verify route
- ❌ **Flow breaks** if user location isn't available

**Recommendation:**
- Integrate actual user location
- Add pickup location selector in bottom sheet
- Rename CTA to "View Route & Pricing"
- Handle missing location permission gracefully

---

### Flow 3: Browse Drivers → Profile → Book

**Goal:** Contact/book a specific driver

**Steps:**
1. Tap Drivers tab
2. Browse/filter driver list
3. Tap driver card
4. View driver profile
5. Tap "Book Ride"
6. Navigate to route input

**Issues:**
- ✅ Flow is clear and complete
- ⚠️ Step 2: No loading state when filtering
- ❌ Step 5: Doesn't pre-fill any driver preference in route flow
- ❌ **Missing:** No way to directly message/call driver before booking

**Recommendation:**
- Add loading skeleton when filtering
- Pass driver preference to route input
- Add "Contact Driver" button alongside "Book Ride"

---

## Scoring Summary

### By Category

| Category | Score | Notes |
|----------|-------|-------|
| Screen Purpose & Clarity | 8/10 | Generally clear, but some CTAs ambiguous |
| Information Hierarchy | 9/10 | Excellent visual design |
| Navigation & Orientation | 6/10 | Missing breadcrumbs, inconsistent patterns |
| Primary Actions | 7/10 | CTAs exist but states unclear |
| Inputs & Forms | 8/10 | Good autocomplete, needs empty states |
| Feedback & System Status | 5/10 | Missing confirmations and success states |
| Empty & Edge States | 4/10 | Major gap - many missing |
| Layout & Spacing | 9/10 | Consistent design system usage |
| Gestures & Interactions | 8/10 | Generally smooth, minor conflicts |
| Accessibility | 7/10 | Good structure, needs testing |
| Consistency & Design System | 9/10 | Strong adherence |
| Flow Completion | 6/10 | Flows exist but incomplete |
| MVP Sanity | 7/10 | Appropriate complexity for MVP |

---

## Priority Recommendations

### 🔴 Critical (Must Fix Before Launch)

1. **Add actual booking/driver request flow** - Currently no way to complete a ride booking
2. **Fix location permission denial flow** - Users get stuck if they deny permission
3. **Add error recovery throughout** - Users can't recover from errors without restarting
4. **Implement empty states** - Search, filters, and data loading need empty states
5. **Clarify "Save Trip" vs. "Book Ride"** - Current flow is confusing

### 🟡 High Priority (Should Fix Soon)

6. Add success confirmations for all major actions
7. Implement loading skeletons for all data fetching
8. Add offline/no network handling
9. Fix hardcoded location in venue booking flow
10. Add route editing capability in trip preview

### 🟢 Medium Priority (Nice to Have)

11. Add recent searches functionality
12. Add popular routes suggestions
13. Implement driver messaging
14. Add trip history access from home screen
15. Add onboarding for first-time users

---

## Files Requiring Updates

### High Priority
- [app/route-input.tsx](app/route-input.tsx) - Empty states, error recovery
- [app/trip-preview.tsx](app/trip-preview.tsx) - CTA clarity, success states
- [app/(tabs)/index.tsx](app/(tabs)/index.tsx) - Permission denial handling
- [app/(tabs)/explore/venue/[id].tsx](app/(tabs)/explore/venue/[id].tsx) - Location integration

### Medium Priority
- [components/ride-cta-sheet.tsx](components/ride-cta-sheet.tsx) - Editable pickup
- [components/destination-bottom-sheet.tsx](components/destination-bottom-sheet.tsx) - Initial state
- [components/location-permission-modal.tsx](components/location-permission-modal.tsx) - Follow-up UI

---

## Conclusion

The RoraExpo app has a **strong visual foundation** and **solid component architecture**, but requires **critical UX improvements** before launch. The most pressing issues are:

1. **Incomplete booking flow** - No actual driver request mechanism
2. **Poor error recovery** - Users get stuck frequently
3. **Missing edge states** - Empty, loading, and offline states
4. **Unclear CTAs** - "Save" vs. "Book" confusion

Addressing the 15 priority recommendations will significantly improve user confidence and task completion rates.
