# Date of Birth Implementation

## Overview
Date of birth (DOB) is now collected during sign-up and stored in Supabase. Age can be derived from DOB when needed, but DOB itself is stored (not age).

## Where DOB is Stored

### Database
- **Table**: `users`
- **Column**: `date_of_birth` (DATE type)
- **Location**: Supabase database

### Data Flow
1. User selects DOB during sign-up (via date picker)
2. DOB is sent to Supabase Auth as metadata during `signUp()`
3. Database trigger (`handle_new_user`) creates user profile with DOB
4. RPC function (`create_user_profile`) also handles DOB as fallback
5. DOB is fetched and stored in `AuthContext` user profile state

## How It's Used

### During Sign-Up
1. User fills sign-up form including DOB picker
2. DOB is validated (required, cannot be future date)
3. On successful sign-up, DOB is:
   - Stored in `auth.users.raw_user_meta_data.date_of_birth`
   - Saved to `users.date_of_birth` column via trigger/RPC
   - Loaded into `AuthContext.userProfile.dateOfBirth`

### In Application
- DOB is available via `useAuth().userProfile.dateOfBirth`
- Stored as ISO date string (YYYY-MM-DD format)
- Can be parsed to Date object when needed: `new Date(userProfile.dateOfBirth)`
- Age can be calculated from DOB when needed (not stored)

## Database Schema Changes

Run the SQL migration in `supabase_add_dob.sql` to:
1. Add `date_of_birth DATE` column to `users` table
2. Update `handle_new_user()` trigger function to include DOB
3. Update `create_user_profile()` RPC function to accept and store DOB

## UI Implementation

### Date Picker
- **iOS**: Modal with spinner-style picker
- **Android**: Native date picker dialog
- **Validation**: 
  - Required field (cannot be empty)
  - Maximum date is today (prevents future dates)
  - Shows error message if invalid

### Location in Form
- Appears in sign-up form after "First Name" field
- Only visible when `isSignUp === true`
- Styled consistently with other form inputs

## Code Changes Summary

### Files Modified
1. **`app/login.tsx`**
   - Added DOB state and date picker UI
   - Added DOB validation
   - Passes DOB to `signUp()` function

2. **`context/AuthContext.tsx`**
   - Updated `UserProfile` interface to include `dateOfBirth?: string`
   - Updated `signUp()` signature to accept `dateOfBirth?: Date`
   - Updated `fetchUserProfile()` to include DOB from database
   - Updated RPC call to include DOB

3. **`supabase_add_dob.sql`** (new file)
   - Database migration script
   - Updates trigger and RPC functions

## Usage Example

```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { userProfile } = useAuth();
  
  // Access DOB
  const dob = userProfile?.dateOfBirth; // "2000-01-15" (ISO string)
  
  // Calculate age if needed
  if (dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    console.log(`User is ${age} years old`);
  }
}
```

## Next Steps

To use DOB in your app:
1. Run the SQL migration (`supabase_add_dob.sql`) in Supabase SQL Editor
2. Test sign-up flow with DOB selection
3. Access DOB via `useAuth().userProfile.dateOfBirth`
4. Calculate age when needed (don't store age, always derive from DOB)
