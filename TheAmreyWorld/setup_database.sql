-- =========================================================
-- THE AMREY WORLD - FULL DATABASE SETUP (ONE RUN SCRIPT)
-- =========================================================

-- 0. Create Schema
CREATE SCHEMA IF NOT EXISTS theamreyworld;

-- =========================================================
-- 1. PARTNERS (link users with partner ID)
-- =========================================================
CREATE TABLE IF NOT EXISTS theamreyworld.partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- =========================================================
-- 2. MESSAGES (chat between partners)
-- =========================================================
CREATE TABLE IF NOT EXISTS theamreyworld.messages (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- =========================================================
-- 3. LOCATIONS (saved map markers)
-- =========================================================
CREATE TABLE IF NOT EXISTS theamreyworld.locations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_tagged_id TEXT NOT NULL,
    tag_name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    partner_name TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    expected_visit TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- =========================================================
-- 4. NOTIFICATIONS (requests & approvals)
-- =========================================================
CREATE TABLE IF NOT EXISTS theamreyworld.notifications (
    id BIGSERIAL PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT,
    action TEXT,
    target_id BIGINT,
    status TEXT DEFAULT 'pending', -- pending / approved / denied
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- =========================================================
-- 5. LIVE TRACKING (latest user location)
-- =========================================================
CREATE TABLE IF NOT EXISTS theamreyworld.live_tracking (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    partner_id TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- =========================================================
-- 6. ENABLE RLS + SIMPLE POLICIES (for authenticated users)
-- =========================================================

-- Partners
ALTER TABLE theamreyworld.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partners_access"
ON theamreyworld.partners
FOR ALL TO authenticated
USING (true);

-- Messages
ALTER TABLE theamreyworld.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_access"
ON theamreyworld.messages
FOR ALL TO authenticated
USING (true);

-- Locations
ALTER TABLE theamreyworld.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locations_access"
ON theamreyworld.locations
FOR ALL TO authenticated
USING (true);

-- Notifications
ALTER TABLE theamreyworld.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_access"
ON theamreyworld.notifications
FOR ALL TO authenticated
USING (true);

-- Live Tracking
ALTER TABLE theamreyworld.live_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tracking_access"
ON theamreyworld.live_tracking
FOR ALL TO authenticated
USING (true);

-- =========================================================
-- DONE ✅
-- =========================================================