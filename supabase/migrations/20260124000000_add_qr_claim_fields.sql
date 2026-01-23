-- Migration: Add QR Token Claim Fields
-- Created: 2026-01-24
-- Description: Add fields to prevent QR token replay attacks

-- Add QR claim fields to ride_sessions table
ALTER TABLE public.ride_sessions
  ADD COLUMN qr_claimed_at TIMESTAMPTZ,
  ADD COLUMN qr_claimed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for quick claim lookup
CREATE INDEX idx_ride_sessions_qr_claimed_at
  ON public.ride_sessions(qr_claimed_at);

-- Comments for documentation
COMMENT ON COLUMN public.ride_sessions.qr_claimed_at
  IS 'Timestamp when QR token was claimed by driver (replay prevention)';
COMMENT ON COLUMN public.ride_sessions.qr_claimed_by_user_id
  IS 'Driver user ID who claimed the QR token';
