-- Migration: Setup Drivers and Social Features
-- Created: 2026-01-04
-- Description: Driver profiles, verifications, ratings, favorites, and ride reports

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Driver verification type
CREATE TYPE public.verification_type AS ENUM (
  'GOVERNMENT_REGISTERED',  -- Verified via government taxi registry
  'RORA_VERIFIED'          -- Additional Rora background check
);

-- Driver status
CREATE TYPE public.driver_status AS ENUM (
  'ACTIVE',       -- Active and accepting requests
  'UNVERIFIED',   -- Pending verification
  'SUSPENDED'     -- Suspended by admin
);

-- Report category
CREATE TYPE public.report_category AS ENUM (
  'safety_concern',
  'pricing_dispute',
  'unprofessional_behavior',
  'route_issue',
  'vehicle_condition',
  'other'
);

-- =============================================================================
-- DRIVER PROFILES TABLE
-- =============================================================================
CREATE TABLE public.driver_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,

  -- Basic info
  display_name TEXT NOT NULL,
  legal_name TEXT, -- For admin/verification purposes
  phone_number TEXT,
  avatar_url TEXT,

  -- Vehicle info
  vehicle_type TEXT, -- 'sedan', 'suv', 'van', 'minibus'
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_color TEXT,
  vehicle_year INTEGER,
  license_plate TEXT,
  seats INTEGER DEFAULT 4,

  -- Service info
  languages TEXT[] DEFAULT ARRAY['en'], -- e.g., ['en', 'es', 'nl', 'fr']
  service_area_tags TEXT[], -- e.g., ['airport', 'cruise_port', 'maho', 'dutch_side', 'french_side']

  -- Ratings
  rating_average DECIMAL(3, 2), -- e.g., 4.75
  rating_count INTEGER DEFAULT 0,

  -- Status
  status public.driver_status NOT NULL DEFAULT 'UNVERIFIED',
  is_rora_pro BOOLEAN DEFAULT false,

  -- Settings
  allow_direct_requests BOOLEAN DEFAULT true,
  is_accepting_requests BOOLEAN DEFAULT true,

  -- Bio
  bio TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_driver_profiles_region_id ON public.driver_profiles(region_id);
CREATE INDEX idx_driver_profiles_status ON public.driver_profiles(status);
CREATE INDEX idx_driver_profiles_is_rora_pro ON public.driver_profiles(is_rora_pro);
CREATE INDEX idx_driver_profiles_service_area_tags ON public.driver_profiles USING GIN(service_area_tags);

-- =============================================================================
-- DRIVER VERIFICATIONS TABLE
-- =============================================================================
CREATE TABLE public.driver_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_user_id UUID NOT NULL REFERENCES public.driver_profiles(id) ON DELETE CASCADE,

  -- Verification details
  verification_type public.verification_type NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin who verified

  -- Verification metadata
  verification_metadata JSONB, -- Store government ID, permit number, etc.

  expires_at TIMESTAMPTZ, -- For time-limited verifications

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One verification of each type per driver
  CONSTRAINT unique_verification_per_driver UNIQUE (driver_user_id, verification_type)
);

-- Indexes
CREATE INDEX idx_driver_verifications_driver_user_id ON public.driver_verifications(driver_user_id);
CREATE INDEX idx_driver_verifications_verification_type ON public.driver_verifications(verification_type);

-- =============================================================================
-- RATINGS TABLE
-- =============================================================================
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_session_id UUID NOT NULL REFERENCES public.ride_sessions(id) ON DELETE CASCADE,
  rider_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_user_id UUID NOT NULL REFERENCES public.driver_profiles(id) ON DELETE CASCADE,

  -- Rating (1-5 stars)
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),

  -- Optional comment
  comment TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One rating per ride per rider
  CONSTRAINT unique_rating_per_ride UNIQUE (ride_session_id, rider_user_id)
);

-- Indexes
CREATE INDEX idx_ratings_driver_user_id ON public.ratings(driver_user_id);
CREATE INDEX idx_ratings_rider_user_id ON public.ratings(rider_user_id);
CREATE INDEX idx_ratings_score ON public.ratings(score);
CREATE INDEX idx_ratings_created_at ON public.ratings(created_at DESC);

-- =============================================================================
-- FAVORITES TABLE
-- =============================================================================
CREATE TABLE public.favorites (
  rider_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_user_id UUID NOT NULL REFERENCES public.driver_profiles(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (rider_user_id, driver_user_id)
);

-- Indexes
CREATE INDEX idx_favorites_rider_user_id ON public.favorites(rider_user_id);
CREATE INDEX idx_favorites_driver_user_id ON public.favorites(driver_user_id);

-- =============================================================================
-- RIDE REPORTS TABLE
-- =============================================================================
CREATE TABLE public.ride_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_session_id UUID NOT NULL REFERENCES public.ride_sessions(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Report details
  category public.report_category NOT NULL,
  notes TEXT,

  -- Admin handling
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'under_review', 'resolved', 'dismissed'
  admin_notes TEXT,
  resolved_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ride_reports_ride_session_id ON public.ride_reports(ride_session_id);
CREATE INDEX idx_ride_reports_reporter_user_id ON public.ride_reports(reporter_user_id);
CREATE INDEX idx_ride_reports_status ON public.ride_reports(status);
CREATE INDEX idx_ride_reports_created_at ON public.ride_reports(created_at DESC);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_driver_profiles_updated_at
  BEFORE UPDATE ON public.driver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ride_reports_updated_at
  BEFORE UPDATE ON public.ride_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update driver rating aggregate when new rating is added
CREATE OR REPLACE FUNCTION public.update_driver_rating_aggregate()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.driver_profiles
  SET
    rating_average = (
      SELECT AVG(score)::DECIMAL(3,2)
      FROM public.ratings
      WHERE driver_user_id = NEW.driver_user_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.ratings
      WHERE driver_user_id = NEW.driver_user_id
    )
  WHERE id = NEW.driver_user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_driver_rating_on_new_rating
  AFTER INSERT ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_driver_rating_aggregate();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_reports ENABLE ROW LEVEL SECURITY;

-- Driver profiles: Everyone can view active drivers, drivers can update their own
CREATE POLICY "Everyone can view active driver profiles"
  ON public.driver_profiles FOR SELECT
  USING (status = 'ACTIVE');

CREATE POLICY "Drivers can update their own profile"
  ON public.driver_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role has full access to driver profiles"
  ON public.driver_profiles FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Driver verifications: Drivers can view their own, admins can manage
CREATE POLICY "Drivers can view their own verifications"
  ON public.driver_verifications FOR SELECT
  USING (auth.uid() = driver_user_id);

CREATE POLICY "Everyone can view verifications for active drivers"
  ON public.driver_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.driver_profiles
      WHERE driver_profiles.id = driver_verifications.driver_user_id
        AND driver_profiles.status = 'ACTIVE'
    )
  );

CREATE POLICY "Service role can manage verifications"
  ON public.driver_verifications FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Ratings: Riders can create and view their own, drivers can view ratings about them
CREATE POLICY "Riders can create ratings for completed rides"
  ON public.ratings FOR INSERT
  WITH CHECK (
    auth.uid() = rider_user_id AND
    EXISTS (
      SELECT 1 FROM public.ride_sessions
      WHERE ride_sessions.id = ride_session_id
        AND ride_sessions.status = 'completed'
        AND ride_sessions.rider_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view ratings they created"
  ON public.ratings FOR SELECT
  USING (auth.uid() = rider_user_id);

CREATE POLICY "Drivers can view their own ratings"
  ON public.ratings FOR SELECT
  USING (auth.uid() = driver_user_id);

CREATE POLICY "Service role has full access to ratings"
  ON public.ratings FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Favorites: Users can manage their own favorites
CREATE POLICY "Users can view their own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = rider_user_id);

CREATE POLICY "Users can add favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = rider_user_id);

CREATE POLICY "Users can remove favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = rider_user_id);

-- Ride reports: Riders can create reports, admins can manage
CREATE POLICY "Riders can create reports for their rides"
  ON public.ride_reports FOR INSERT
  WITH CHECK (
    auth.uid() = reporter_user_id AND
    EXISTS (
      SELECT 1 FROM public.ride_sessions
      WHERE ride_sessions.id = ride_session_id
        AND ride_sessions.rider_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own reports"
  ON public.ride_reports FOR SELECT
  USING (auth.uid() = reporter_user_id);

CREATE POLICY "Service role can manage reports"
  ON public.ride_reports FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.driver_profiles IS 'Driver profile information, vehicle details, and settings';
COMMENT ON TABLE public.driver_verifications IS 'Driver verification records (government registry, Rora verification)';
COMMENT ON TABLE public.ratings IS 'Rider ratings of drivers (1-5 stars)';
COMMENT ON TABLE public.favorites IS 'Rider favorite drivers (for Wave 0 priority notifications)';
COMMENT ON TABLE public.ride_reports IS 'Rider issue reports for rides (safety, disputes, etc.)';
COMMENT ON COLUMN public.driver_profiles.service_area_tags IS 'Geographic service areas for Wave 0/1 notification priority';
COMMENT ON COLUMN public.driver_profiles.is_rora_pro IS 'Premium driver tier (verified + enhanced profile)';
COMMENT ON COLUMN public.ratings.score IS 'Rating score (1-5 stars). Only shown to riders after minimum threshold (5-10 ratings)';
