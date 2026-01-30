-- Migration: Add expires_at to ride_offers
-- Created: 2026-01-31
-- Description: Adds expiration timestamp for offers (2-minute TTL per spec)

-- Add expires_at column to ride_offers
ALTER TABLE public.ride_offers 
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add index for expiration queries (finding expired offers)
CREATE INDEX IF NOT EXISTS idx_ride_offers_expires_at 
  ON public.ride_offers(expires_at) 
  WHERE status = 'pending';

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN public.ride_offers.expires_at IS 
  'Offer expires 2 minutes after creation. After expiry, offer cannot be accepted.';

-- =============================================================================
-- NOTES
-- =============================================================================
--
-- Offer Lifecycle:
-- 1. Driver creates offer → expires_at = NOW() + 2 minutes
-- 2. If rider accepts before expiry → status = 'accepted'
-- 3. If expiry passes → background job marks status = 'expired'
-- 4. Rider cannot accept expired offers (enforced by Edge Function)
--
-- The actual expiration enforcement happens in:
-- - Edge Function: select-offer (checks expires_at before accepting)
-- - Background Job: process-expired-offers (marks old offers as expired)
