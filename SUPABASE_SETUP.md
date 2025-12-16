# Supabase Setup Guide

This app now uses Supabase instead of Firebase for authentication and database storage. Follow these steps to set up your Supabase project:

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in your project details:
   - **Name**: MindfulMoves (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project" and wait for it to be set up (~2 minutes)

## 2. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll need two values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys" → "anon public")

## 3. Set Up Environment Variables

Create a `.env` file in the root of your project (if it doesn't exist) and add:

```
EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important**: Make sure `.env` is in your `.gitignore` file to keep your credentials secure!

Alternatively, you can update `config/supabase.ts` directly with your credentials (not recommended for production).

## 4. Set Up Database Tables

Run these SQL commands in your Supabase SQL Editor (Dashboard → SQL Editor):

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Habits Table
```sql
CREATE TABLE habit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  completion_dates TEXT[] DEFAULT '{}'
);

-- Enable Row Level Security
ALTER TABLE habit ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own habits
CREATE POLICY "Users can view own habits" ON habit
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits" ON habit
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON habit
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON habit
  FOR DELETE USING (auth.uid() = user_id);
```

### Tasks Table
**Note:** Tasks are not part of the MVP. The app focuses on habits only. If you want to add tasks in the future, you can create this table later.

## 5. Configure Authentication

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Under "Site URL", add your app's URL scheme (e.g., `mindfulmoves://`)
3. Under "Redirect URLs", add:
   - `mindfulmoves://reset-password` (for password reset)
   - Any other redirect URLs you need

## 6. Test Your Setup

1. Start your Expo app: `npm start`
2. Try signing up with a test email
3. Check your Supabase dashboard → **Authentication** → **Users** to see if the user was created
4. Check **Table Editor** to see if data is being saved correctly

## Troubleshooting

### "Invalid API key" error
- Double-check your `EXPO_PUBLIC_SUPABASE_ANON_KEY` is correct
- Make sure you're using the "anon public" key, not the "service_role" key

### "relation does not exist" error
- Make sure you've run all the SQL commands to create the tables
- Check that table names match exactly (case-sensitive)

### Authentication not working
- Verify your Site URL and Redirect URLs are configured correctly
- Check the Supabase logs in the dashboard for error messages

### Row Level Security blocking requests
- Make sure you've created the RLS policies as shown above
- Verify the policies allow the operations you're trying to perform

## Migration from Firebase

If you were previously using Firebase, your data won't automatically migrate. You'll need to:
1. Export your data from Firebase
2. Transform it to match the Supabase schema
3. Import it into Supabase (or have users re-create their accounts)

For production apps, consider building a migration script to help users transfer their data.

