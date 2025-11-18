-- Reset all daily gloop counts to 0 and force timestamp reset
UPDATE users SET 
  daily_gloop_count = 0,
  last_daily_reset = '2024-01-01T00:00:00Z';  -- Force old date so frontend will reset