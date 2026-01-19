-- Add date_of_birth column to users table
-- Run this in your Supabase SQL Editor

-- 1. Add date_of_birth column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 2. Update the trigger function to include date_of_birth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, first_name, date_of_birth, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    NULLIF(NEW.raw_user_meta_data->>'date_of_birth', '')::DATE,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update the RPC function to accept and store date_of_birth
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_first_name TEXT,
  user_date_of_birth DATE DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.users (id, email, name, first_name, date_of_birth, created_at)
  VALUES (user_id, user_email, user_name, user_first_name, user_date_of_birth, NOW())
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    date_of_birth = COALESCE(EXCLUDED.date_of_birth, users.date_of_birth);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
