

# Add operations@encoremusic.tech Admin Role in Database

## Current State
The email `operations@encoremusic.tech` (user ID: `1e1cebcc-8e99-4d8f-9cdd-e87c24ed7eee`) is already present in all hardcoded admin arrays across the frontend code. This change ensures the **database-level** admin role is also set.

## Change

Insert an `admin` role into the `user_roles` table for this user (using upsert to avoid duplicates):

```text
INSERT INTO public.user_roles (user_id, role)
VALUES ('1e1cebcc-8e99-4d8f-9cdd-e87c24ed7eee', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

This is a **data-only** change -- no code or schema modifications needed. The frontend hooks (`useUserRoles`, `useAdmin`, `useSuperAdmin`) will automatically pick up the database role.

## Files Changed
None -- this is a database data insert only.

