-- =========================================================
-- XFEED - FULL DATABASE SETUP SCRIPT
-- =========================================================

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS xfeed;

SET search_path TO xfeed, public;

-- =========================================================
-- 2. CLOTHS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS cloths (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    item TEXT NOT NULL,
    category TEXT,
    description TEXT,
    actual_price NUMERIC,
    offer_price NUMERIC,
    stock_left INT,
    return_policy TEXT,
    images TEXT[]
);

INSERT INTO cloths (item, category, description, actual_price, offer_price, stock_left, return_policy)
VALUES
('T-Shirt', 'Men', 'Cotton round neck t-shirt', 800, 499, 50, '7 days return'),
('Jeans', 'Men', 'Slim fit blue jeans', 2000, 1499, 30, '10 days return'),
('Kurti', 'Women', 'Printed casual kurti', 1200, 899, 40, '7 days return'),
('Saree', 'Women', 'Silk festive saree', 5000, 3999, 20, 'No return'),
('Jacket', 'Unisex', 'Winter warm jacket', 3000, 2499, 25, '5 days return')
ON CONFLICT DO NOTHING;

-- =========================================================
-- 3. GROCERY TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS grocery (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    item TEXT NOT NULL,
    category TEXT,
    description TEXT,
    actual_price NUMERIC,
    offer_price NUMERIC,
    stock_left INT,
    return_policy TEXT,
    images TEXT[]
);

INSERT INTO grocery (item, category, description, actual_price, offer_price, stock_left, return_policy)
VALUES
('Rice 5kg', 'Grains', 'Premium basmati rice', 600, 550, 100, 'No return'),
('Wheat Flour', 'Grains', 'Whole wheat atta 10kg', 450, 420, 80, 'No return'),
('Sugar 1kg', 'Sweeteners', 'Refined sugar', 50, 45, 200, 'No return'),
('Cooking Oil 1L', 'Oil', 'Sunflower oil', 180, 160, 150, 'No return'),
('Salt 1kg', 'Spices', 'Iodized salt', 25, 20, 300, 'No return')
ON CONFLICT DO NOTHING;

-- =========================================================
-- 4. DAILY ESSENTIAL TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS daily_essential (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    item TEXT NOT NULL,
    category TEXT,
    description TEXT,
    actual_price NUMERIC,
    offer_price NUMERIC,
    stock_left INT,
    return_policy TEXT,
    images TEXT[]
);

INSERT INTO daily_essential (item, category, description, actual_price, offer_price, stock_left, return_policy)
VALUES
('Toothpaste', 'Personal Care', 'Mint fresh toothpaste', 120, 99, 100, 'No return'),
('Shampoo', 'Personal Care', 'Anti-dandruff shampoo', 300, 250, 60, 'No return'),
('Soap Pack', 'Personal Care', 'Pack of 4 bathing soaps', 200, 170, 90, 'No return'),
('Detergent', 'Cleaning', 'Washing powder 2kg', 350, 299, 70, 'No return'),
('Dishwash Liquid', 'Cleaning', 'Lemon dishwash liquid', 150, 130, 80, 'No return')
ON CONFLICT DO NOTHING;

-- =========================================================
-- 5. ORDER DETAILS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS order_details (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    email TEXT,
    product_id BIGINT,
    category TEXT,
    user_name TEXT,
    status TEXT DEFAULT 'pending',
    item_name TEXT,
    qty INT,
    images TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO order_details (email, product_id, category, user_name, status)
VALUES
('user1@example.com', 1, 'cloths', 'Amit Sharma', 'pending'),
('user2@example.com', 2, 'grocery', 'Priya Verma', 'completed'),
('user3@example.com', 3, 'daily_essential', 'Rahul Singh', 'pending'),
('user4@example.com', 4, 'cloths', 'Neha Gupta', 'shipped'),
('user5@example.com', 5, 'grocery', 'Vikas Kumar', 'cancelled')
ON CONFLICT DO NOTHING;

-- =========================================================
-- 6. USER ROLES
-- =========================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role_id TEXT NOT NULL DEFAULT '0512'
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to user_roles" ON user_roles FOR SELECT USING (true);

INSERT INTO user_roles (email, role_id) VALUES ('aman@gmail.com', '1618') ON CONFLICT (email) DO NOTHING;
INSERT INTO user_roles (email, role_id) VALUES ('aryan@gmail.com', '0512') ON CONFLICT (email) DO NOTHING;

-- =========================================================
-- 7. GRANT USAGE PRIVILEGES
-- =========================================================
GRANT USAGE ON SCHEMA xfeed TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA xfeed TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA xfeed TO anon, authenticated;

-- =========================================================
-- DONE ✅
-- =========================================================
