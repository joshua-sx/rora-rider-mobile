# QR Token Spec (Security Contract)

This document defines the ride QR token format, validation rules, and replay prevention.
Clients display QR tokens but never validate or authorize rides.

## Token Format (Canonical)

JWT (HS256) with server-only secret.

Header:
```
{
  "alg": "HS256",
  "typ": "JWT",
  "kid": "qr-v1"
}
```

Payload (claims):
```
{
  "jti": "uuid",                 // unique token id, matches rideSessions.qrTokenJti
  "ride_session_id": "uuid",
  "rider_user_id": "uuid|null",  // if authenticated
  "guest_token_id": "uuid|null", // if guest
  "driver_user_id": "uuid|null", // optional, bound after offer accepted
  "fare_amount": 12.5,
  "iat": 1737072000,             // issued at (unix seconds)
  "exp": 1737072600,             // expires at (10 minutes)
  "ver": "1"
}
```

Encoding:
```
<base64url(header)>.<base64url(payload)>.<base64url(signature)>
```

## Expiry and Reuse Rules

- TTL is 10 minutes from `iat`.
- Token is single-use after successful claim.
- Any reuse attempt is rejected.

## Key Management

- Secrets live server-side only (environment variables, never `EXPO_PUBLIC_*`).
- Rotation uses `kid`:
  - Add new key with new `kid`.
  - Accept old keys until max TTL has passed.
  - Remove old keys after TTL window.

## Replay Prevention

- Store claim metadata:
  - `qrClaimedAt` (timestamp)
  - `qrClaimedByUserId` (driver user id)
- Record claim in `rideEvents` as `qr_claimed`.
- Reject any token with an existing claim.

## Strict Validation Checklist (Server)

- Parse JWT format: three segments, base64url decode succeeds.
- Verify signature with key identified by `kid`.
- Validate `iat` is not in the future (allow small clock skew).
- Validate `exp` is not expired and within allowed TTL window.
- Validate `jti` exists and matches `rideSessions.qrTokenJti`.
- Validate ride exists and is in an allowed state (`hold` for scan/confirm).
- Validate ride identity:
  - Rider/guest identity matches ride session record.
  - If `driver_user_id` is present, it matches the selected driver.
- Check token has not been claimed (`qrClaimedAt` is null).
- Write claim atomically (set claim fields + `rideEvents` entry).
- If any step fails, reject with no state changes.

## Notes

- Current client code includes placeholders and fallback flows.
- This spec is the contract to implement on the server before trusting QR scans.
