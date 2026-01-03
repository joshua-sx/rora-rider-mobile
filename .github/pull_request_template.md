## Closes
<!-- Link to issue this PR closes -->
Closes #<issue-number>

---

## What Changed
<!-- Brief description of what changed -->

---

## Screenshots
<!-- REQUIRED if UI changes - include iOS and Android if applicable -->

### iOS
<!-- Screenshot or "N/A" -->

### Android
<!-- Screenshot or "N/A" -->

---

## How to Test
<!-- Step-by-step instructions for testing -->

1. Step 1
2. Step 2
3. Step 3

**Test Cases:**
- [ ] Test case 1
- [ ] Test case 2
- [ ] Edge case (if applicable)

---

## Risk / Impact Notes
<!-- Any risks, breaking changes, or impact on other areas -->

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
- [ ] Edge Function deployed and tested (if applicable)
- [ ] Input validation implemented
- [ ] Error handling in place
- [ ] State transitions validated (if applicable)

### Documentation
- [ ] Docs updated if behavior changes
- [ ] SPEC.md updated if feature changes
- [ ] DECISIONS.md updated if architectural decision made

---

## Checklist

### Code Quality
- [ ] `npx tsc --noEmit` passes (TypeScript typecheck)
- [ ] `npm run lint` passes (ESLint)
- [ ] App runs locally on iOS (`npx expo start --ios`)
- [ ] App runs locally on Android (`npx expo start --android`)

### UI/UX
- [ ] Loading states exist (if applicable)
- [ ] Empty states exist (if applicable)
- [ ] Error states exist (if applicable)
- [ ] Offline behavior handled (if applicable)
- [ ] Screenshots included (if UI changes)

### Testing
- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] Guest mode tested (if applicable)
- [ ] Offline scenarios tested (if applicable)

---

## Additional Notes
<!-- Any other relevant information -->

