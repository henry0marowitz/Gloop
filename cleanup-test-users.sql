-- Remove test users and their associated data
-- Run this in your Supabase SQL Editor to clean up test data

-- Delete all gloops (this will cascade and clean up gloop records)
DELETE FROM gloops;

-- Delete all invite links
DELETE FROM invite_links;

-- Delete all users (this will start fresh)
DELETE FROM users;

-- Reset any sequences if needed
-- This ensures IDs start clean for production