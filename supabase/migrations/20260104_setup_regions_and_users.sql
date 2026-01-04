-- Migration: Setup Regions and Users
-- Created: 2026-01-04
-- Description: Core tables for regions, users (extending auth.users), and guest tokens

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- REGIONS TABLE
-- =============================================================================
-- Stores region-specific configuration (Sint Maarten for MVP)
CREATE TABLE public.regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code TEXT NOT NULL,
  island_name TEXT NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  distance_unit TEXT NOT NULL DEFAULT 'km',

  -- Default pricing rule version (foreign key added after pricing tables created)
  default_pricing_rule_version_id UUID,

  -- Discovery wave configuration (JSON)
  -- Example: {"wave_1_radius_km": 5, "wave_2_radius_km": 10, "wave_3_radius_km": 20}
  discovery_radius_config JSONB DEFAULT '{"wave_1_radius_km": 5, "wave_2_radius_km": 10, "wave_3_radius_km": 20}'::jsonb,

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for active regions
CREATE INDEX idx_regions_is_active ON public.regions(is_active);

-- =============================================================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================================================
-- Additional user profile data beyond Supabase auth
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile info
  full_name TEXT,
  phone_number TEXT,

  -- Avatar URL (stored in Supabase Storage)
  avatar_url TEXT,

  -- Preferences
  preferred_language TEXT DEFAULT 'en',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_regions_updated_at
  BEFORE UPDATE ON public.regions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- GUEST TOKENS TABLE
-- =============================================================================
-- Server-generated tokens for guest users (30-day TTL)
CREATE TABLE public.guest_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- The actual token string (UUID)
  token TEXT NOT NULL UNIQUE,

  -- Expiry (30 days from creation)
  expires_at TIMESTAMPTZ NOT NULL,

  -- Track usage
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Linked user (if guest claimed their account)
  claimed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ
);

-- Indexes for guest tokens
CREATE INDEX idx_guest_tokens_token ON public.guest_tokens(token);
CREATE INDEX idx_guest_tokens_expires_at ON public.guest_tokens(expires_at);
CREATE INDEX idx_guest_tokens_claimed_by_user_id ON public.guest_tokens(claimed_by_user_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_tokens ENABLE ROW LEVEL SECURITY;

-- Regions: Everyone can read, only admins can modify
CREATE POLICY "Regions are viewable by everyone"
  ON public.regions FOR SELECT
  USING (true);

CREATE POLICY "Only service role can modify regions"
  ON public.regions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Users: Users can read their own data
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Guest tokens: Only system can manage (no direct user access)
CREATE POLICY "Only service role can manage guest tokens"
  ON public.guest_tokens FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Insert Sint Maarten region
INSERT INTO public.regions (
  country_code,
  island_name,
  currency_code,
  distance_unit,
  discovery_radius_config,
  is_active
) VALUES (
  'SX',
  'Sint Maarten',
  'USD',
  'km',
  '{"wave_1_radius_km": 5, "wave_2_radius_km": 10, "wave_3_radius_km": 20}'::jsonb,
  true
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.regions IS 'Region configuration for different islands/markets';
COMMENT ON TABLE public.users IS 'Extended user profile data (supplements auth.users)';
COMMENT ON TABLE public.guest_tokens IS 'Guest tokens for unauthenticated users (30-day TTL)';
COMMENT ON COLUMN public.guest_tokens.expires_at IS 'Token expires 30 days after creation';
COMMENT ON COLUMN public.guest_tokens.claimed_by_user_id IS 'User who claimed this guest token during signup';
