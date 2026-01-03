# tasks-01-auth.md

## Spec References
- SPEC: Section 7 (Authentication)
- FR-1 to FR-6 (Authentication & Guest Mode)

## Relevant Files
- `src/features/auth/` - Auth screens and logic
- `src/features/auth/components/` - Auth UI components
- `src/hooks/useAuth.ts` - Auth state management hook
- `src/store/auth-store.ts` - Zustand auth store
- `supabase/functions/send-otp/` - Edge Function for SMS/Email OTP
- `supabase/functions/create-guest-token/` - Edge Function for guest tokens

## Notes
- SMS OTP is primary, Email magic link is secondary
- Guest tokens have 30-day TTL
- Rate limit OTP sends (2 retries, 30s cooldown)
- Do not store phone numbers or emails in analytics without hashing

## Instructions for Completing Tasks
**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`.

---

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 `git checkout -b feature/auth-and-guest-mode`

- [ ] 1.0 Implement Guest Token System (Backend)
  - **Spec refs:** FR-1, FR-4
  - **Done means:** API endpoint generates and validates guest tokens with 30-day TTL
  - [ ] 1.1 Create Edge Function: `supabase functions new create-guest-token`
  - [ ] 1.2 Implement guest token generation (server-side random UUID)
  - [ ] 1.3 Store token in `guest_tokens` table with `expires_at = now() + 30 days`
  - [ ] 1.4 Return token to client
  - [ ] 1.5 Create Edge Function: `supabase functions new validate-guest-token`
  - [ ] 1.6 Implement token validation (check expiry, mark last_used_at)
  - [ ] 1.7 Add RLS policy: only system can create/validate tokens
  - [ ] 1.8 Test: create token, validate it, verify expiry after 30 days (mock time)

- [ ] 2.0 Implement Guest Token Client Logic
  - **Spec refs:** FR-1, FR-4
  - **Done means:** App requests and stores guest token on first launch
  - [ ] 2.1 Create `src/hooks/useGuestToken.ts`
  - [ ] 2.2 On app first launch, call `create-guest-token` API
  - [ ] 2.3 Store token in AsyncStorage: `@rora/guest_token`
  - [ ] 2.4 Attach guest token to API requests in Supabase client headers
  - [ ] 2.5 Handle token expiry gracefully (regenerate if expired)
  - [ ] 2.6 Test: fresh install, verify token created and persisted

- [ ] 3.0 Implement SMS OTP Authentication (Backend)
  - **Spec refs:** FR-2, FR-3
  - **Done means:** SMS OTP sent via Twilio, validated by Supabase Auth
  - [ ] 3.1 Sign up for Twilio account and get API keys
  - [ ] 3.2 Create Edge Function: `supabase functions new send-sms-otp`
  - [ ] 3.3 Implement Twilio SMS sending with OTP code
  - [ ] 3.4 Implement retry logic: max 2 retries, 30s cooldown (store in DB or cache)
  - [ ] 3.5 Integrate with Supabase Auth OTP verification
  - [ ] 3.6 Add rate limiting: max 5 OTP requests per phone/hour
  - [ ] 3.7 Test: send OTP, verify it, test retry logic, test rate limit

- [ ] 4.0 Implement Email Magic Link Authentication (Backend)
  - **Spec refs:** FR-2, FR-3
  - **Done means:** Email magic link sent, validated by Supabase Auth
  - [ ] 4.1 Configure Supabase Auth email templates
  - [ ] 4.2 Create Edge Function: `supabase functions new send-email-magic-link` (or use Supabase built-in)
  - [ ] 4.3 Implement email magic link generation
  - [ ] 4.4 Implement retry logic: max 2 retries, 30s cooldown
  - [ ] 4.5 Add deep link handling for magic link redirect
  - [ ] 4.6 Test: send magic link, click it, verify session created

- [ ] 5.0 Build Authentication Screens (UI)
  - **Spec refs:** SPEC §25 Screen 15 (Authentication), FR-2, FR-3
  - **Done means:** Login screen with SMS/Email toggle, OTP input, magic link flow
  - [ ] 5.1 Create `src/features/auth/screens/LoginScreen.tsx`
  - [ ] 5.2 Add phone number input (default shown)
  - [ ] 5.3 Add "Use email instead" toggle
  - [ ] 5.4 Add email input (shown when toggled)
  - [ ] 5.5 Implement "Send Code" / "Send Link" button
  - [ ] 5.6 Create OTP input screen (6-digit code for SMS)
  - [ ] 5.7 Add retry button with 30s cooldown timer
  - [ ] 5.8 Add fallback button after 2 failed retries
  - [ ] 5.9 Test all flows: SMS happy path, email happy path, retries, fallback

- [ ] 6.0 Implement Auth State Management
  - **Spec refs:** FR-1, FR-2
  - **Done means:** Zustand store tracks auth state, guest vs authenticated
  - [ ] 6.1 Create `src/store/auth-store.ts`
  - [ ] 6.2 Define state: `{ isGuest: boolean, user: User | null, guestToken: string | null }`
  - [ ] 6.3 Add actions: `setGuest()`, `setAuthenticatedUser()`, `logout()`
  - [ ] 6.4 Integrate with Supabase Auth: `onAuthStateChange` listener
  - [ ] 6.5 Persist auth state to AsyncStorage (except sensitive tokens)
  - [ ] 6.6 Create `useAuth()` hook for easy access
  - [ ] 6.7 Test: login, logout, app restart (session persistence)

- [ ] 7.0 Implement Guest-to-Authenticated Migration
  - **Spec refs:** FR-5, FR-6
  - **Done means:** On signup, guest rides migrate to authenticated user
  - [ ] 7.1 Create Edge Function: `supabase functions new migrate-guest-rides`
  - [ ] 7.2 Query all `ride_sessions` with matching `guest_token_id`
  - [ ] 7.3 Update `ride_sessions.rider_user_id = new_user_id`, set `guest_token_id = null`
  - [ ] 7.4 Mark guest token as claimed/migrated
  - [ ] 7.5 Return count of migrated rides to client
  - [ ] 7.6 Test: create guest ride, sign up, verify ride now belongs to user

- [ ] 8.0 Build Guest Claim Prompt (UI)
  - **Spec refs:** FR-5
  - **Done means:** After first completed guest ride, show "Create account" prompt
  - [ ] 8.1 Create `src/features/auth/components/GuestClaimPrompt.tsx`
  - [ ] 8.2 Trigger prompt after ride completion (check if guest + first ride)
  - [ ] 8.3 Show: "Create an account to save your ride history"
  - [ ] 8.4 Add "Sign Up" and "Not Now" buttons
  - [ ] 8.5 Track analytics event: `guest_claim_prompt_shown`
  - [ ] 8.6 On "Sign Up", navigate to LoginScreen with pre-filled context
  - [ ] 8.7 On successful signup, call migrate API and show success toast
  - [ ] 8.8 Track analytics event: `guest_history_claimed`

- [ ] 9.0 Implement Rate Limiting for Guest Actions
  - **Spec refs:** FR-60 (Abuse Prevention)
  - **Done means:** Guests limited to 5 QR generations per hour
  - [ ] 9.1 Create `src/utils/rate-limiter.ts`
  - [ ] 9.2 Implement local rate limit check (AsyncStorage or in-memory)
  - [ ] 9.3 Enforce 5 QR generations per hour for guest tokens
  - [ ] 9.4 Show error message when limit exceeded: "You've reached the hourly limit. Sign up for unlimited requests."
  - [ ] 9.5 Add server-side rate limit check in Edge Function (validate-guest-token)
  - [ ] 9.6 Test: generate 5 QRs as guest, verify 6th is blocked
  - [ ] 9.7 Test: sign up, verify rate limit no longer applies

---

**Next:** After completing auth, proceed to `tasks-02-core-ride-loop.md`
