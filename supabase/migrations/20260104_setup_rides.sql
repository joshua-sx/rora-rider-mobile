-- Migration: Setup Rides and Offers
-- Created: 2026-01-04
-- Description: Ride sessions, offers, and event log tables with state machine enforcement

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Ride status enum
CREATE TYPE public.ride_status AS ENUM (
  'created',      -- Ride session created, QR generated
  'discovery',    -- Discovery mode active (looking for drivers)
  'hold',         -- Driver selected, waiting for confirmation
  'confirmed',    -- Driver confirmed, ride about to start
  'active',       -- Ride in progress
  'completed',    -- Ride completed successfully
  'canceled',     -- Ride canceled by rider or driver
  'expired'       -- Ride session expired (no response)
);

-- Offer type enum
CREATE TYPE public.offer_type AS ENUM (
  'accept',       -- Driver accepts Rora Fare
  'counter'       -- Driver counters with different price
);

-- Request type enum
CREATE TYPE public.request_type AS ENUM (
  'broadcast',    -- Broadcast to nearby drivers
  'direct'        -- Direct request to specific driver
);

-- Price label enum (for offer context)
CREATE TYPE public.price_label AS ENUM (
  'good_deal',    -- Below Rora Fare
  'normal',       -- At or near Rora Fare
  'pricier'       -- Above Rora Fare
);

-- =============================================================================
-- RIDE SESSIONS TABLE
-- =============================================================================
CREATE TABLE public.ride_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,

  -- Rider (authenticated or guest)
  rider_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_token_id UUID REFERENCES public.guest_tokens(id) ON DELETE SET NULL,

  -- Origin and destination
  origin_lat DECIMAL(10, 8) NOT NULL,
  origin_lng DECIMAL(11, 8) NOT NULL,
  origin_label TEXT NOT NULL,

  destination_lat DECIMAL(10, 8) NOT NULL,
  destination_lng DECIMAL(11, 8) NOT NULL,
  destination_label TEXT NOT NULL,
  destination_freeform_name TEXT, -- For POIs not in Google/Apple Maps

  -- Pricing
  rora_fare_amount DECIMAL(10, 2) NOT NULL,
  pricing_rule_version_id UUID REFERENCES public.pricing_rule_versions(id),
  pricing_calculation_metadata JSONB, -- Store calculation details for audit

  -- Request details
  request_type public.request_type NOT NULL DEFAULT 'broadcast',
  target_driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- For direct requests

  -- State machine
  status public.ride_status NOT NULL DEFAULT 'created',

  -- Discovery tracking
  discovery_started_at TIMESTAMPTZ,

  -- Selection tracking
  selected_driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  selected_offer_id UUID, -- Foreign key added after ride_offers table created
  hold_expires_at TIMESTAMPTZ,

  -- Confirmation tracking
  confirmed_at TIMESTAMPTZ,

  -- Completion tracking
  completed_at TIMESTAMPTZ,
  final_agreed_amount DECIMAL(10, 2), -- Actual negotiated fare

  -- QR token
  qr_token_jti TEXT UNIQUE, -- JWT ID for QR token uniqueness

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Either rider_user_id or guest_token_id must be set
  CONSTRAINT check_rider_or_guest CHECK (
    (rider_user_id IS NOT NULL AND guest_token_id IS NULL) OR
    (rider_user_id IS NULL AND guest_token_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_ride_sessions_status ON public.ride_sessions(status);
CREATE INDEX idx_ride_sessions_rider_user_id ON public.ride_sessions(rider_user_id);
CREATE INDEX idx_ride_sessions_guest_token_id ON public.ride_sessions(guest_token_id);
CREATE INDEX idx_ride_sessions_selected_driver_id ON public.ride_sessions(selected_driver_id);
CREATE INDEX idx_ride_sessions_created_at ON public.ride_sessions(created_at DESC);
CREATE UNIQUE INDEX idx_ride_sessions_qr_token_jti ON public.ride_sessions(qr_token_jti) WHERE qr_token_jti IS NOT NULL;

-- =============================================================================
-- RIDE OFFERS TABLE
-- =============================================================================
CREATE TABLE public.ride_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_session_id UUID NOT NULL REFERENCES public.ride_sessions(id) ON DELETE CASCADE,
  driver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Offer details
  offer_type public.offer_type NOT NULL,
  offer_amount DECIMAL(10, 2) NOT NULL,
  price_label public.price_label,

  -- Offer status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'selected', 'rejected', 'expired'

  -- Driver response metadata
  response_metadata JSONB, -- Store driver's message, ETA, etc.

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One offer per driver per ride session
  CONSTRAINT unique_offer_per_driver_per_ride UNIQUE (ride_session_id, driver_user_id)
);

-- Indexes
CREATE INDEX idx_ride_offers_ride_session_id ON public.ride_offers(ride_session_id);
CREATE INDEX idx_ride_offers_driver_user_id ON public.ride_offers(driver_user_id);
CREATE INDEX idx_ride_offers_status ON public.ride_offers(status);
CREATE INDEX idx_ride_offers_created_at ON public.ride_offers(created_at DESC);

-- Add foreign key to ride_sessions.selected_offer_id
ALTER TABLE public.ride_sessions
  ADD CONSTRAINT fk_ride_sessions_selected_offer
  FOREIGN KEY (selected_offer_id) REFERENCES public.ride_offers(id) ON DELETE SET NULL;

-- =============================================================================
-- RIDE EVENTS TABLE (Append-Only Audit Log)
-- =============================================================================
CREATE TABLE public.ride_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_session_id UUID NOT NULL REFERENCES public.ride_sessions(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL, -- 'created', 'discovery_started', 'offer_received', 'driver_selected', 'confirmed', 'completed', 'canceled'
  event_data JSONB, -- Store event-specific metadata

  -- Actor
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type TEXT, -- 'rider', 'driver', 'system', 'admin'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ride_events_ride_session_id ON public.ride_events(ride_session_id);
CREATE INDEX idx_ride_events_event_type ON public.ride_events(event_type);
CREATE INDEX idx_ride_events_created_at ON public.ride_events(created_at DESC);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_ride_sessions_updated_at
  BEFORE UPDATE ON public.ride_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to log ride events automatically on status changes
CREATE OR REPLACE FUNCTION public.log_ride_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.ride_events (ride_session_id, event_type, event_data, actor_type)
    VALUES (
      NEW.id,
      'status_changed',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      'system'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_ride_status_change
  AFTER UPDATE ON public.ride_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ride_status_change();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.ride_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_events ENABLE ROW LEVEL SECURITY;

-- Ride sessions: Riders can see their own, drivers can see rides they're involved in
CREATE POLICY "Riders can view their own ride sessions"
  ON public.ride_sessions FOR SELECT
  USING (
    auth.uid() = rider_user_id OR
    auth.uid() = selected_driver_id OR
    EXISTS (
      SELECT 1 FROM public.ride_offers
      WHERE ride_offers.ride_session_id = ride_sessions.id
        AND ride_offers.driver_user_id = auth.uid()
    )
  );

CREATE POLICY "Riders can create ride sessions"
  ON public.ride_sessions FOR INSERT
  WITH CHECK (auth.uid() = rider_user_id OR rider_user_id IS NULL);

CREATE POLICY "Riders can update their own ride sessions"
  ON public.ride_sessions FOR UPDATE
  USING (auth.uid() = rider_user_id);

CREATE POLICY "Service role has full access to ride sessions"
  ON public.ride_sessions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Ride offers: Riders can see offers for their rides, drivers can see their own offers
CREATE POLICY "Riders can view offers for their rides"
  ON public.ride_offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ride_sessions
      WHERE ride_sessions.id = ride_offers.ride_session_id
        AND ride_sessions.rider_user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can view their own offers"
  ON public.ride_offers FOR SELECT
  USING (auth.uid() = driver_user_id);

CREATE POLICY "Drivers can create offers"
  ON public.ride_offers FOR INSERT
  WITH CHECK (auth.uid() = driver_user_id);

CREATE POLICY "Service role has full access to ride offers"
  ON public.ride_offers FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Ride events: Riders and drivers can view events for their rides
CREATE POLICY "Users can view events for their rides"
  ON public.ride_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ride_sessions
      WHERE ride_sessions.id = ride_events.ride_session_id
        AND (
          ride_sessions.rider_user_id = auth.uid() OR
          ride_sessions.selected_driver_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.ride_offers
            WHERE ride_offers.ride_session_id = ride_sessions.id
              AND ride_offers.driver_user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "System can insert events"
  ON public.ride_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role has full access to ride events"
  ON public.ride_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.ride_sessions IS 'Core ride session table with state machine enforcement';
COMMENT ON TABLE public.ride_offers IS 'Driver offers (accept or counter) for ride sessions';
COMMENT ON TABLE public.ride_events IS 'Append-only audit log of all ride state transitions and events';
COMMENT ON COLUMN public.ride_sessions.qr_token_jti IS 'JWT ID for QR token uniqueness and revocation';
COMMENT ON COLUMN public.ride_sessions.pricing_calculation_metadata IS 'JSON storing detailed pricing calculation for audit trail';
COMMENT ON COLUMN public.ride_sessions.final_agreed_amount IS 'The final negotiated fare (may differ from Rora Fare)';
COMMENT ON TYPE public.ride_status IS 'State machine: created → discovery → hold → confirmed → active → completed/canceled/expired';
