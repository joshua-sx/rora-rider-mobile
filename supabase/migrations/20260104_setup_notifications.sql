-- Migration: Setup Notifications
-- Created: 2026-01-04
-- Description: Push notification devices and in-app notification inbox

-- =============================================================================
-- DEVICES TABLE (Push Tokens)
-- =============================================================================
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Push token
  push_token TEXT NOT NULL,

  -- Device info
  platform TEXT NOT NULL, -- 'ios', 'android'
  device_name TEXT,
  app_version TEXT,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One push token per device
  CONSTRAINT unique_push_token UNIQUE (push_token)
);

-- Indexes
CREATE INDEX idx_devices_user_id ON public.devices(user_id);
CREATE INDEX idx_devices_is_active ON public.devices(is_active);
CREATE INDEX idx_devices_push_token ON public.devices(push_token);

-- =============================================================================
-- NOTIFICATIONS INBOX TABLE
-- =============================================================================
-- In-app notification fallback and history
CREATE TABLE public.notifications_inbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Notification content
  type TEXT NOT NULL, -- 'offer_received', 'hold_timeout', 'ride_confirmed', 'ride_completed', etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,

  -- Metadata
  metadata JSONB, -- Store ride_session_id, offer_id, etc. for deep linking

  -- Read status
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_inbox_user_id ON public.notifications_inbox(user_id);
CREATE INDEX idx_notifications_inbox_created_at ON public.notifications_inbox(created_at DESC);
CREATE INDEX idx_notifications_inbox_read_at ON public.notifications_inbox(read_at);
CREATE INDEX idx_notifications_inbox_type ON public.notifications_inbox(type);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically mark device as active when token is updated
CREATE OR REPLACE FUNCTION public.activate_device_on_token_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_active = true;
  NEW.last_used_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activate_device_on_update
  BEFORE UPDATE ON public.devices
  FOR EACH ROW
  WHEN (OLD.push_token IS DISTINCT FROM NEW.push_token)
  EXECUTE FUNCTION public.activate_device_on_token_update();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_inbox ENABLE ROW LEVEL SECURITY;

-- Devices: Users can manage their own devices
CREATE POLICY "Users can view their own devices"
  ON public.devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices"
  ON public.devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
  ON public.devices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices"
  ON public.devices FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to devices"
  ON public.devices FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Notifications: Users can read their own, system can insert
CREATE POLICY "Users can view their own notifications"
  ON public.notifications_inbox FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications_inbox FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications_inbox FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role has full access to notifications"
  ON public.notifications_inbox FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get active devices for a user
CREATE OR REPLACE FUNCTION public.get_user_push_tokens(p_user_id UUID)
RETURNS TABLE (push_token TEXT, platform TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT d.push_token, d.platform
  FROM public.devices d
  WHERE d.user_id = p_user_id
    AND d.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE public.notifications_inbox
  SET read_at = NOW()
  WHERE id = p_notification_id
    AND user_id = p_user_id
    AND read_at IS NULL
  RETURNING true INTO v_updated;

  RETURN COALESCE(v_updated, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notifications_inbox
  SET read_at = NOW()
  WHERE user_id = p_user_id
    AND read_at IS NULL
  RETURNING COUNT(*) INTO v_count;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.devices IS 'User device registration for push notifications (Expo Push)';
COMMENT ON TABLE public.notifications_inbox IS 'In-app notification inbox (fallback and history)';
COMMENT ON COLUMN public.devices.push_token IS 'Expo push token (ExponentPushToken[...])';
COMMENT ON COLUMN public.notifications_inbox.metadata IS 'JSON metadata for deep linking (ride_session_id, offer_id, etc.)';
COMMENT ON FUNCTION public.get_user_push_tokens IS 'Get all active push tokens for a user (for notification sending)';
COMMENT ON FUNCTION public.mark_notification_read IS 'Mark a single notification as read';
COMMENT ON FUNCTION public.mark_all_notifications_read IS 'Mark all unread notifications as read for a user';
