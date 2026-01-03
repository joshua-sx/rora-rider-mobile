# tasks-04-notifications.md

## Spec References
- SPEC: Section 18 (Notifications)
- FR-56 to FR-59, NFR-5

## Relevant Files
- `src/services/notifications.service.ts` - Push notification service
- `src/hooks/usePushNotifications.ts` - Push notification hooks
- `src/features/notifications/` - In-app inbox
- `supabase/functions/send-push-notification/` - Edge Function for Expo Push
- `supabase/functions/send-inbox-notification/` - Edge Function for in-app inbox

## Notes
- Use Expo Push Notifications for MVP
- In-app inbox as fallback
- Push notifications should deep link to relevant screens
- Bundle notifications if multiple offers arrive within 30-60 seconds
- Critical events: offer received, hold timeout, ride confirmed, ride completed
- Do not send PII in push notification payloads

## Instructions for Completing Tasks
**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`.

---

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 `git checkout -b feature/notifications`

- [ ] 1.0 Set Up Expo Push Notifications (App)
  - **Spec refs:** SPEC §18, FR-56
  - **Done means:** App can receive push notifications, permission requested
  - [ ] 1.1 Install Expo notifications: `npx expo install expo-notifications`
  - [ ] 1.2 Request notification permissions on app launch (if not granted)
  - [ ] 1.3 Get Expo Push Token
  - [ ] 1.4 Store push token in `devices` table (user_id, push_token, platform)
  - [ ] 1.5 Listen for incoming notifications (foreground + background)
  - [ ] 1.6 Test: send test notification via Expo Push Tool, verify received

- [ ] 2.0 Implement Deep Linking for Notifications
  - **Spec refs:** FR-58
  - **Done means:** Tapping push notification navigates to correct screen
  - [ ] 2.1 Configure deep linking in `app.json`
  - [ ] 2.2 Add deep link handler in app navigation root
  - [ ] 2.3 Define deep link patterns:
    - `rora://ride/{ride_session_id}` → OffersListScreen or HoldScreen
    - `rora://offers/{ride_session_id}` → OffersListScreen
    - `rora://history/{ride_session_id}` → RideDetailScreen
  - [ ] 2.4 Attach deep link URL to push notification data
  - [ ] 2.5 Test: tap notification, verify navigation

- [ ] 3.0 Implement Push Notification Sending (Backend)
  - **Spec refs:** FR-56, FR-59
  - **Done means:** Edge Function sends push via Expo Push API, bundles multiple
  - [ ] 3.1 Create Edge Function: `supabase functions new send-push-notification`
  - [ ] 3.2 Input: `{ user_id, title, body, data (deep link + metadata) }`
  - [ ] 3.3 Query user's push token(s) from `devices` table
  - [ ] 3.4 Send notification via Expo Push API
  - [ ] 3.5 Implement bundling logic: if multiple notifications queued within 60s, combine:
    - "3 drivers responded. Tap to view offers."
  - [ ] 3.6 Handle push failures (invalid token → mark device as inactive)
  - [ ] 3.7 Test: send single notification, send multiple rapid notifications (verify bundling)

- [ ] 4.0 Implement In-App Notification Inbox (Backend)
  - **Spec refs:** FR-57
  - **Done means:** All push notifications also stored in `notifications_inbox`
  - [ ] 4.1 Modify `send-push-notification` to also insert into `notifications_inbox`
  - [ ] 4.2 Insert: `{ user_id, type, title, body, metadata JSON, created_at }`
  - [ ] 4.3 Inbox RLS policy: users can read own notifications
  - [ ] 4.4 Create Edge Function: `supabase functions new mark-notification-read`
  - [ ] 4.5 Input: `{ notification_id }`
  - [ ] 4.6 Update: `read_at = now()`
  - [ ] 4.7 Test: send notification, verify inbox record created

- [ ] 5.0 Build In-App Notification Inbox Screen (UI)
  - **Spec refs:** FR-57
  - **Done means:** List of notifications displayed, tap to navigate, mark as read
  - [ ] 5.1 Create `src/features/notifications/screens/InboxScreen.tsx`
  - [ ] 5.2 Fetch notifications from `notifications_inbox` where `user_id = current_user`
  - [ ] 5.3 Display list: title, body, time ago (unread bold)
  - [ ] 5.4 Tap notification → mark as read + navigate via deep link
  - [ ] 5.5 Show unread count badge in tab bar / header
  - [ ] 5.6 Empty state: "No notifications yet."
  - [ ] 5.7 Test: receive notification, view in inbox, tap to navigate, verify marked read

- [ ] 6.0 Implement Critical Ride Notifications
  - **Spec refs:** FR-56
  - **Done means:** Push sent for offer received, hold timeout, ride confirmed, ride completed
  - [ ] 6.1 **Offer Received:** In `submit-offer` Edge Function, send push:
    - Title: "New Ride Offer"
    - Body: "A driver accepted your ride for $20" or "A driver countered: $25"
    - Deep link: `rora://offers/{ride_session_id}`
  - [ ] 6.2 **Hold Timeout:** In hold timeout job, send push:
    - Title: "Driver Didn't Respond"
    - Body: "You can select another offer."
    - Deep link: `rora://offers/{ride_session_id}`
  - [ ] 6.3 **Ride Confirmed:** In `confirm-ride` Edge Function, send push to driver (mock for now):
    - Title: "Ride Confirmed"
    - Body: "You can start the trip."
  - [ ] 6.4 **Ride Completed:** In `complete-ride` Edge Function, send push to rider:
    - Title: "Ride Completed"
    - Body: "Thank you for using Rora Ride."
    - Deep link: `rora://history/{ride_session_id}`
  - [ ] 6.5 Test each notification type

- [ ] 7.0 Implement Discovery Reminder Notifications
  - **Spec refs:** SPEC §8 (Background Discovery), FR-22, FR-23
  - **Done means:** 10-min reminder push if rider hasn't responded to offers
  - [ ] 7.1 Create background job: `send-discovery-reminders`
  - [ ] 7.2 Query sessions where offers exist, but no offer selected, and 10 min passed since first offer
  - [ ] 7.3 Send push: "You have X drivers waiting for your response"
  - [ ] 7.4 Deep link: `rora://offers/{ride_session_id}`
  - [ ] 7.5 Repeat at 20 min (max 2 reminders)
  - [ ] 7.6 Track: do not re-send if already sent reminder (store flag or check events)
  - [ ] 7.7 Test: mock offers received, wait 10 min, verify reminder sent

- [ ] 8.0 Implement Notification Bundling Logic
  - **Spec refs:** FR-59
  - **Done means:** Multiple offers within 60s bundled into one notification
  - [ ] 8.1 In `submit-offer` Edge Function, check if other offers submitted within last 60s
  - [ ] 8.2 If yes, queue notification instead of sending immediately
  - [ ] 8.3 Create background job: `flush-bundled-notifications` (runs every 60s)
  - [ ] 8.4 Send bundled notification: "3 drivers responded. Tap to view offers."
  - [ ] 8.5 Test: submit 3 offers within 60s, verify single bundled notification sent

- [ ] 9.0 Implement Realtime Notification Listener (UI)
  - **Spec refs:** NFR-5 (Resilience)
  - **Done means:** App subscribes to notifications_inbox via Supabase Realtime
  - [ ] 9.1 Create `src/hooks/useRealtimeNotifications.ts`
  - [ ] 9.2 Subscribe to `notifications_inbox` where `user_id = current_user`
  - [ ] 9.3 On new notification inserted, show in-app toast (if app is open)
  - [ ] 9.4 Update unread count badge
  - [ ] 9.5 Test: send notification, verify real-time toast appears

---

**Next:** After completing notifications, proceed to `tasks-05-history-ratings-reporting.md`
