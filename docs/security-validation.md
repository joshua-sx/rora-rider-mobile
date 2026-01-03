# Security & Ride State Validation

## Ride State Machine

```
created → discovery → [offers received] → hold → confirmed → active → completed
                                                                    ↘ canceled
                      ↘ expired (no offers / timeout)
```

**State transitions are enforced server-side. Invalid transitions are blocked.**

## Security Layers
1. **UI** — NOT a security boundary (visual only)
2. **Edge Functions** — Validate ride state, user ownership, token validity
3. **Database RLS** — Row-level security for ride sessions and offers
4. **JWT Tokens** — Short-lived, revocable QR session tokens

## Ride Session Validation Flow

In every ride mutation (Edge Function):

```typescript
// 1. Verify user owns session or is guest token owner
if (session.rider_user_id && session.rider_user_id !== userId) {
  throw new Error('FORBIDDEN')
}

// 2. Validate state transition
if (!isValidTransition(session.status, newStatus)) {
  throw new Error('INVALID_STATE_TRANSITION')
}

// 3. Verify QR token if applicable
if (input.qr_token_jti) {
  await validateQRToken(input.qr_token_jti, session.id)
}

// 4. Perform mutation
const result = await updateRideSession(session.id, updates)

// 5. Log ride event (append-only)
await logRideEvent({
  ride_session_id: session.id,
  event_type: newStatus,
  metadata: { ... }
})
```

## Common Security Mistakes

### ❌ BAD: Ride state transition client-side only
```typescript
if (session.status === 'discovery') {
  setStatus('confirmed') // Don't do this!
}
```

### ✅ GOOD: State transition validated server-side
```typescript
await supabase.rpc('transition_ride_state', {
  session_id: session.id,
  new_status: 'confirmed'
})
// Edge Function validates transition and logs event
```

### ❌ BAD: Trusting client-provided ride session ownership
```typescript
const session = await supabase
  .from('ride_sessions')
  .select('*')
  .eq('id', input.session_id)
  .single()

await updateSession(session.id, updates) // Missing ownership check!
```

### ✅ GOOD: Verify user owns session or guest token
```typescript
const session = await getRideSession(input.session_id)

if (session.rider_user_id && session.rider_user_id !== userId) {
  throw new Error('FORBIDDEN')
}

if (session.guest_token_id && !isGuestTokenOwner(session.guest_token_id, deviceId)) {
  throw new Error('FORBIDDEN')
}
```

### ❌ BAD: No ride event logging
```typescript
await supabase
  .from('ride_sessions')
  .update({ status: 'confirmed' })
  .eq('id', sessionId)
```

### ✅ GOOD: Log ride event (append-only)
```typescript
await supabase
  .from('ride_sessions')
  .update({ status: 'confirmed' })
  .eq('id', sessionId)

await supabase
  .from('ride_events')
  .insert({
    ride_session_id: sessionId,
    event_type: 'confirmed',
    metadata: { driver_id: driverId }
  })
```

### ❌ BAD: Business logic in component
```typescript
function RideCard() {
  const canCancel = session.status === 'discovery' // Don't do this!
  return <Button onPress={cancelRide} disabled={!canCancel} />
}
```

### ✅ GOOD: Business logic in Edge Function or hook
```typescript
// Component calls hook/function that validates server-side
const { canCancel, cancelRide } = useRideActions(session)
```

### ❌ BAD: QR token not validated or revoked
```typescript
const qrData = scanQRCode() // Trusting client-side scan
await acceptRide(qrData.session_id)
```

### ✅ GOOD: Validate and revoke QR token server-side
```typescript
const { session_id, jti } = await validateQRToken(qrData.jti)
await revokeQRToken(jti) // Single-use token
await acceptRide(session_id)
```
