

# Fix: Show Proper Names Instead of UIDs in Sub-Account Users

## Root Cause

The three PAQ users have NULL `first_name` and `last_name` in the `profiles` table. The `get-user-details` edge function falls back to `"User 9c74ff74..."` (a truncated UUID) when no name is found, which is what appears in the UI.

The emails ARE resolving correctly -- only the name column shows UIDs.

## Fix

### 1. Update `get-user-details` edge function fallback (line 142)

Change the name fallback from a truncated UID to the email username (the part before @):

```
// Before:
name: fullName || `User ${userId.slice(0, 8)}...`

// After:
name: fullName || (authUser?.email?.split('@')[0] || 'Unknown User')
```

This way, if a user has no profile name, the table will show "kennethbrandy" instead of "User 9c74ff74...".

### 2. Populate the missing profile data (one-time SQL)

Run a SQL migration to set names for these three users based on their emails:

- `kennethbrandy@paqpublishing.com` -> Kenneth Brandy
- `dilip@paqpublishing.com` -> Dilip (first name only)
- `tpatt@manticoremusic.com` -> T Patt

This is optional -- admins can also edit names via the pencil icon on the Users tab. But doing it now prevents them from needing to.

### 3. No UI code changes needed

The `SubAccountUsers.tsx` component already correctly displays `user.full_name` and `user.email` from the edge function response. The fix is entirely in the edge function fallback logic and the missing database data.

## Files Changed

| File | Change |
|---|---|
| `supabase/functions/get-user-details/index.ts` | Update fallback name from truncated UID to email username |
| SQL migration | Populate `first_name` / `last_name` for the three PAQ users |

