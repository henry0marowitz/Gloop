-- Create atomic increment function to prevent race conditions
CREATE OR REPLACE FUNCTION increment_user_gloop(user_id UUID, increment_amount INT DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  -- Insert gloop record
  INSERT INTO gloops (user_id) VALUES (user_id);
  
  -- Atomically increment user counts
  UPDATE users 
  SET 
    gloop_count = gloop_count + increment_amount,
    daily_gloop_count = daily_gloop_count + increment_amount,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Alternative function for boost mode (10x increment)
CREATE OR REPLACE FUNCTION increment_user_gloop_boost(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Insert gloop record (still counts as one gloop action)
  INSERT INTO gloops (user_id) VALUES (user_id);
  
  -- Atomically increment user counts by 10
  UPDATE users 
  SET 
    gloop_count = gloop_count + 10,
    daily_gloop_count = daily_gloop_count + 10,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;