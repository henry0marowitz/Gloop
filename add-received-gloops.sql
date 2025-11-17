-- Add received gloop tracking and boost limits to users table
ALTER TABLE users ADD COLUMN received_gloops_today INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN received_gloops_total INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN daily_boosts_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_boost_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update the increment functions to track received gloops
CREATE OR REPLACE FUNCTION increment_user_gloop(user_id UUID, increment_amount INT DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  -- Insert gloop record
  INSERT INTO gloops (user_id) VALUES (user_id);
  
  -- Atomically increment user counts (for the person receiving the gloop)
  UPDATE users 
  SET 
    gloop_count = gloop_count + increment_amount,
    daily_gloop_count = daily_gloop_count + increment_amount,
    received_gloops_today = received_gloops_today + 1,
    received_gloops_total = received_gloops_total + 1,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Update boost function
CREATE OR REPLACE FUNCTION increment_user_gloop_boost(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Insert gloop record (still counts as one gloop action)
  INSERT INTO gloops (user_id) VALUES (user_id);
  
  -- Atomically increment user counts by 10 (for the person receiving the gloop)
  UPDATE users 
  SET 
    gloop_count = gloop_count + 10,
    daily_gloop_count = daily_gloop_count + 10,
    received_gloops_today = received_gloops_today + 1,
    received_gloops_total = received_gloops_total + 1,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to reset daily boost count
CREATE OR REPLACE FUNCTION reset_daily_boosts_if_needed(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_record users%ROWTYPE;
BEGIN
  SELECT * INTO user_record FROM users WHERE id = user_id;
  
  -- Check if it's a new day since last boost reset
  IF user_record.last_boost_reset < CURRENT_DATE THEN
    UPDATE users 
    SET 
      daily_boosts_used = 0,
      last_boost_reset = NOW()
    WHERE id = user_id;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;