-- Migration: Add 'arrived' state to ride_status enum
-- Created: 2026-01-31
-- Description: Adds the 'arrived' state between 'confirmed' and 'active' per architecture spec
--
-- State Machine (Updated):
-- created → discovery → hold → confirmed → arrived → active → completed
--                                            ↓         ↓        ↓
--                                         cancelled  cancelled cancelled

-- Add 'arrived' state to ride_status enum
-- Note: In PostgreSQL, we can only add values to the end or use workarounds
-- For enum ordering, the application logic handles valid transitions, not enum position
ALTER TYPE public.ride_status ADD VALUE IF NOT EXISTS 'arrived';

-- Add arrived_at timestamp column to track when driver marked arrival
ALTER TABLE public.ride_sessions 
  ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ;

-- Add index for queries filtering by arrived status
CREATE INDEX IF NOT EXISTS idx_ride_sessions_arrived_at 
  ON public.ride_sessions(arrived_at) 
  WHERE arrived_at IS NOT NULL;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN public.ride_sessions.arrived_at IS 
  'Timestamp when driver marked arrival at pickup location. Set when transitioning to arrived state.';

-- =============================================================================
-- UPDATE STATE MACHINE DOCUMENTATION
-- =============================================================================
-- 
-- Valid Transitions (Server-Enforced):
-- 
-- | From State  | To State   | Trigger              | Actor  |
-- |-------------|------------|----------------------|--------|
-- | created     | discovery  | Start discovery      | Rider  |
-- | created     | canceled   | Cancel               | Rider  |
-- | discovery   | hold       | Accept offer         | Rider  |
-- | discovery   | expired    | 90s timeout          | System |
-- | discovery   | canceled   | Cancel               | Rider  |
-- | hold        | confirmed  | Driver confirms      | Driver |
-- | hold        | discovery  | 60s timeout          | System |
-- | hold        | canceled   | Cancel               | Rider  |
-- | confirmed   | arrived    | Driver arrives       | Driver | ← NEW
-- | confirmed   | canceled   | Cancel               | Rider/Driver |
-- | arrived     | active     | QR scan validated    | System | ← CHANGED
-- | arrived     | canceled   | Cancel               | Rider/Driver |
-- | active      | completed  | Driver completes     | Driver |
-- | active      | canceled   | Cancel (admin only)  | Admin  |
--
-- Terminal states: completed, canceled, expired (no transitions out)
