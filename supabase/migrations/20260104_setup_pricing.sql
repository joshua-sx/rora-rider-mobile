-- Migration: Setup Pricing Tables
-- Created: 2026-01-04
-- Description: Pricing zones, rule versions, fixed fares, and modifiers

-- =============================================================================
-- PRICING ZONES TABLE
-- =============================================================================
-- Zones are defined as radius circles (center point + radius)
CREATE TABLE public.pricing_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,

  -- Zone identification
  zone_name TEXT NOT NULL,
  zone_code TEXT NOT NULL, -- e.g., "AIRPORT", "CRUISE_PORT", "MAHO"

  -- Geographic bounds (center point + radius)
  center_lat DECIMAL(10, 8) NOT NULL,
  center_lng DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER NOT NULL, -- Radius in meters

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_zone_code_per_region UNIQUE (region_id, zone_code)
);

-- Indexes
CREATE INDEX idx_pricing_zones_region_id ON public.pricing_zones(region_id);
CREATE INDEX idx_pricing_zones_is_active ON public.pricing_zones(is_active);

-- =============================================================================
-- PRICING RULE VERSIONS TABLE
-- =============================================================================
-- Versioned pricing rules (distance-based fallback)
CREATE TABLE public.pricing_rule_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,

  -- Version info
  version_number INTEGER NOT NULL,
  version_name TEXT, -- e.g., "2024 Q1 Rates"

  -- Distance-based pricing
  base_fare DECIMAL(10, 2) NOT NULL, -- Base fare amount
  per_km_rate DECIMAL(10, 2) NOT NULL, -- Rate per kilometer

  -- Activation
  is_active BOOLEAN NOT NULL DEFAULT false,
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_version_per_region UNIQUE (region_id, version_number)
);

-- Indexes
CREATE INDEX idx_pricing_rule_versions_region_id ON public.pricing_rule_versions(region_id);
CREATE INDEX idx_pricing_rule_versions_is_active ON public.pricing_rule_versions(is_active, region_id);

-- =============================================================================
-- PRICING FIXED FARES TABLE
-- =============================================================================
-- Zone-to-zone or zone-to-any fixed fares
CREATE TABLE public.pricing_fixed_fares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,

  -- Origin and destination zones
  origin_zone_id UUID REFERENCES public.pricing_zones(id) ON DELETE CASCADE,
  destination_zone_id UUID REFERENCES public.pricing_zones(id) ON DELETE CASCADE,

  -- Fixed fare amount
  amount DECIMAL(10, 2) NOT NULL,

  -- Notes
  description TEXT, -- e.g., "Airport to Maho Beach"

  -- Activation
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Either origin or destination (or both) must be a zone
  CONSTRAINT check_at_least_one_zone CHECK (
    origin_zone_id IS NOT NULL OR destination_zone_id IS NOT NULL
  )
);

-- Indexes
CREATE INDEX idx_pricing_fixed_fares_origin_zone ON public.pricing_fixed_fares(origin_zone_id);
CREATE INDEX idx_pricing_fixed_fares_destination_zone ON public.pricing_fixed_fares(destination_zone_id);
CREATE INDEX idx_pricing_fixed_fares_is_active ON public.pricing_fixed_fares(is_active);

-- =============================================================================
-- PRICING MODIFIERS TABLE
-- =============================================================================
-- Dynamic pricing modifiers (night, peak, event)
CREATE TABLE public.pricing_modifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,

  -- Modifier type
  modifier_type TEXT NOT NULL, -- 'night', 'peak', 'event'
  modifier_name TEXT NOT NULL, -- e.g., "Night Rate (10pm-6am)"

  -- Multiplier or fixed addition
  modifier_value DECIMAL(5, 2) NOT NULL, -- e.g., 1.2 for 20% increase, or 5.00 for $5 flat
  modifier_application TEXT NOT NULL DEFAULT 'multiply', -- 'multiply' or 'add'

  -- Activation thresholds (stored as JSON for flexibility)
  -- Example for night: {"start_hour": 22, "end_hour": 6}
  -- Example for peak: {"days": ["fri", "sat"], "start_hour": 18, "end_hour": 22}
  threshold_config JSONB,

  -- Status
  enabled BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_modifier_type_per_region UNIQUE (region_id, modifier_type)
);

-- Indexes
CREATE INDEX idx_pricing_modifiers_region_id ON public.pricing_modifiers(region_id);
CREATE INDEX idx_pricing_modifiers_enabled ON public.pricing_modifiers(enabled);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_pricing_zones_updated_at
  BEFORE UPDATE ON public.pricing_zones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_rule_versions_updated_at
  BEFORE UPDATE ON public.pricing_rule_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_fixed_fares_updated_at
  BEFORE UPDATE ON public.pricing_fixed_fares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_modifiers_updated_at
  BEFORE UPDATE ON public.pricing_modifiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.pricing_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_fixed_fares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_modifiers ENABLE ROW LEVEL SECURITY;

-- All pricing tables: Everyone can read active rules, only service role can modify
CREATE POLICY "Everyone can view active pricing zones"
  ON public.pricing_zones FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only service role can modify pricing zones"
  ON public.pricing_zones FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Everyone can view active pricing rules"
  ON public.pricing_rule_versions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only service role can modify pricing rules"
  ON public.pricing_rule_versions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Everyone can view active fixed fares"
  ON public.pricing_fixed_fares FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only service role can modify fixed fares"
  ON public.pricing_fixed_fares FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Everyone can view pricing modifiers"
  ON public.pricing_modifiers FOR SELECT
  USING (true);

CREATE POLICY "Only service role can modify pricing modifiers"
  ON public.pricing_modifiers FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- SEED DATA (Sint Maarten MVP Zones)
-- =============================================================================

-- Get the Sint Maarten region ID
DO $$
DECLARE
  v_region_id UUID;
  v_pricing_rule_id UUID;
  v_airport_zone_id UUID;
  v_cruise_zone_id UUID;
  v_maho_zone_id UUID;
BEGIN
  -- Get Sint Maarten region
  SELECT id INTO v_region_id FROM public.regions WHERE country_code = 'SX' LIMIT 1;

  -- Insert pricing zones
  INSERT INTO public.pricing_zones (region_id, zone_name, zone_code, center_lat, center_lng, radius_meters)
  VALUES
    (v_region_id, 'Princess Juliana International Airport', 'AIRPORT', 18.0410, -63.1089, 500)
  RETURNING id INTO v_airport_zone_id;

  INSERT INTO public.pricing_zones (region_id, zone_name, zone_code, center_lat, center_lng, radius_meters)
  VALUES
    (v_region_id, 'Philipsburg Cruise Port', 'CRUISE_PORT', 18.0237, -63.0458, 400)
  RETURNING id INTO v_cruise_zone_id;

  INSERT INTO public.pricing_zones (region_id, zone_name, zone_code, center_lat, center_lng, radius_meters)
  VALUES
    (v_region_id, 'Maho Beach District', 'MAHO', 18.0384, -63.1156, 600)
  RETURNING id INTO v_maho_zone_id;

  -- Insert base pricing rule
  INSERT INTO public.pricing_rule_versions (region_id, version_number, version_name, base_fare, per_km_rate, is_active, activated_at)
  VALUES
    (v_region_id, 1, 'MVP Base Rates 2026', 10.00, 2.50, true, NOW())
  RETURNING id INTO v_pricing_rule_id;

  -- Update region's default pricing rule
  UPDATE public.regions
  SET default_pricing_rule_version_id = v_pricing_rule_id
  WHERE id = v_region_id;

  -- Insert sample fixed fares
  INSERT INTO public.pricing_fixed_fares (region_id, origin_zone_id, destination_zone_id, amount, description)
  VALUES
    (v_region_id, v_airport_zone_id, v_maho_zone_id, 20.00, 'Airport to Maho Beach'),
    (v_region_id, v_maho_zone_id, v_airport_zone_id, 20.00, 'Maho Beach to Airport'),
    (v_region_id, v_airport_zone_id, v_cruise_zone_id, 25.00, 'Airport to Cruise Port'),
    (v_region_id, v_cruise_zone_id, v_airport_zone_id, 25.00, 'Cruise Port to Airport');

  -- Insert pricing modifiers (disabled by default)
  INSERT INTO public.pricing_modifiers (region_id, modifier_type, modifier_name, modifier_value, modifier_application, threshold_config, enabled)
  VALUES
    (v_region_id, 'night', 'Night Rate (10pm-6am)', 1.2, 'multiply', '{"start_hour": 22, "end_hour": 6}'::jsonb, false),
    (v_region_id, 'peak', 'Weekend Peak (Fri-Sat 6pm-10pm)', 1.15, 'multiply', '{"days": ["fri", "sat"], "start_hour": 18, "end_hour": 22}'::jsonb, false);

END $$;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.pricing_zones IS 'Geographic zones for zone-based pricing (radius circles)';
COMMENT ON TABLE public.pricing_rule_versions IS 'Versioned distance-based pricing rules (base fare + per km)';
COMMENT ON TABLE public.pricing_fixed_fares IS 'Fixed fares for zone-to-zone routes';
COMMENT ON TABLE public.pricing_modifiers IS 'Dynamic pricing modifiers (night, peak, event)';
COMMENT ON COLUMN public.pricing_zones.radius_meters IS 'Radius from center point in meters';
COMMENT ON COLUMN public.pricing_rule_versions.is_active IS 'Only one rule version should be active per region at a time';
COMMENT ON COLUMN public.pricing_modifiers.threshold_config IS 'JSON config for when modifier applies (e.g., time ranges, days)';
