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
    linked_id TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- =========================================================
-- 2. MESSAGES (chat between partners)
-- =========================================================
CREATE TABLE IF NOT EXISTS theamreyworld.messages (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    image_url TEXT,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_id TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    reactions JSONB DEFAULT '{}',
    is_deleted BOOLEAN DEFAULT false,
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
-- 7. PAYMENTS (transaction history)
-- =========================================================
CREATE TABLE IF NOT EXISTS theamreyworld.payments (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'completed',
    plan TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- =========================================================
-- 6. ENABLE RLS + SIMPLE POLICIES (for authenticated users)
-- =========================================================

-- Partners
ALTER TABLE theamreyworld.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partners_access"
ON theamreyworld.partners
FOR ALL TO public
USING (true)
WITH CHECK (true);

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

-- Payments
ALTER TABLE theamreyworld.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_access"
ON theamreyworld.payments
FOR ALL TO authenticated
USING (true);

-- =========================================================
-- 8. GRANT USAGE PRIVILEGES
-- =========================================================
-- This is critical for postgREST to access the custom schema!
GRANT USAGE ON SCHEMA theamreyworld TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA theamreyworld TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA theamreyworld TO anon, authenticated;


INSERT INTO theamreyworld.partners ("id", "user_id", "partner_id", "created_at") VALUES ('3016efbd-319a-4a0d-a30e-ec3f1bcc16e7', 'd21abdce-728b-43a7-89b1-3fa73a9d2c36', '161800', '2026-03-28 12:05:30.438346+00');

INSERT INTO theamreyworld.partners ("id", "user_id", "partner_id", "created_at") VALUES ('3016efbd-319a-4a0d-a30e-ec3f1bcc16e0', '5b6b0314-d793-4b11-9cb6-ba651e29c6cb', '051200', '2026-03-28 12:05:30.438346+00');

-- =========================================================
-- DONE ✅
-- =========================================================