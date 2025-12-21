-- Add reminder_time column to users table
-- This stores the user's preferred daily reminder time in HH:MM format (24-hour)

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reminder_time TEXT DEFAULT '08:00';

-- The reminder_time will be stored as a string in 'HH:MM' format (24-hour)
-- Examples: '08:00' for 8:00 AM, '14:30' for 2:30 PM, '20:15' for 8:15 PM

