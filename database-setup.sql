-- Create users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gloop_count INTEGER DEFAULT 0,
  daily_gloop_count INTEGER DEFAULT 0,
  last_daily_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  gloop_boosts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gloops table (for tracking individual gloop events)
CREATE TABLE gloops (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  gloop_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invite_links table
CREATE TABLE invite_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  uses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_gloop_count ON users(gloop_count DESC);
CREATE INDEX idx_users_daily_gloop_count ON users(daily_gloop_count DESC);
CREATE INDEX idx_gloops_created_at ON gloops(created_at DESC);
CREATE INDEX idx_invite_links_code ON invite_links(code);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE gloops ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access for reading users (for leaderboards)
CREATE POLICY "Public can view users" ON users FOR SELECT USING (true);
CREATE POLICY "Public can insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);

-- Allow public access to gloops table
CREATE POLICY "Public can view gloops" ON gloops FOR SELECT USING (true);
CREATE POLICY "Public can insert gloops" ON gloops FOR INSERT WITH CHECK (true);

-- Allow users to manage their own invite links
CREATE POLICY "Users can view all invite links" ON invite_links FOR SELECT USING (true);
CREATE POLICY "Users can insert invite links" ON invite_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update invite links" ON invite_links FOR UPDATE USING (true);