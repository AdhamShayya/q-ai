# Signup Error Fix

## Issue Identified

The signup function was using `createSupabaseClient()` (which is subject to Row Level Security policies) to check for existing users. This could cause issues because:

1. RLS policies might block the query
2. Using `.single()` returns an error when no rows are found, which wasn't properly handled

## Fix Applied

Changed the user existence check to:
- Use `createSupabaseAdminClient()` to bypass RLS
- Use `.maybeSingle()` instead of `.single()` (returns null instead of error when no rows found)
- Added proper error handling for database errors

## What to Check

1. **Backend Console** - Look for any error messages when testing signup
2. **Browser Console** - Check for JavaScript errors
3. **Network Tab** - See what the actual API response is

## Testing

Try signing up again. If it still fails:
1. Check backend console output
2. Check browser console (F12)
3. Check Network tab to see the API response
4. Verify database schema is deployed correctly

## Common Issues

- **RLS Policies** - If users table has RLS enabled, admin client should work
- **Database Schema** - Verify users table exists and has correct columns
- **Environment Variables** - Verify SUPABASE_SERVICE_ROLE_KEY is set

