

## Create Demo Notifications and Messages for ENCORE Demo Account

### Problem
The demo account (`demo@encoremusic.tech`) currently displays the ENCORE Admin's notifications (16 shown in the bell) and messages (22 in the chat bubble) because:
1. Notifications are fetched by `user_id` — the demo user has none of its own
2. Messages require company membership via `company_users` — the demo user has no company association
3. The `createTestNotifications` utility exists but is never called for the demo user

### Plan

**1. Create a demo data seeding utility** (`src/utils/seedDemoData.ts`)
- A function that runs after demo login to create demo-specific notifications and a demo company thread
- Checks if demo data already exists (idempotent) before inserting
- Creates ~8 realistic notifications for the demo user (contracts, royalties, sync opportunities, system alerts)
- Creates a demo company ("Demo Music Publishing") if needed, associates the demo user, and seeds 4-5 sample messages showing a back-and-forth conversation with "ENCORE Support"

**2. Update Auth.tsx to call seeding after demo login**
- After successful demo login, call `seedDemoData(user.id)` to populate notifications and messages
- This ensures the demo account always has fresh, relevant data on login

**3. Update the `createTestNotifications` utility**
- Add an idempotency check: skip if demo notifications already exist for this user
- Keep existing notification types but make them clearly demo-themed

### Technical Details

- **Notifications**: Insert directly into `notifications` table with `user_id` = demo user ID. The existing `useNotifications` hook will pick them up automatically via the `user_id` filter.
- **Messages**: Create/find a "Demo Music Publishing" company in `companies`, ensure `company_users` membership for the demo user, then insert sample `company_messages`. The `MessagesPage` non-admin path fetches via `company_users` membership, so this will work.
- **Idempotency**: Before inserting, check `notifications` count for the user and `company_users` membership to avoid duplicates on repeated logins.
- **No schema changes needed** — all tables already exist.

### Files to Create/Modify
- **Create**: `src/utils/seedDemoData.ts` — main seeding orchestrator
- **Modify**: `src/pages/Auth.tsx` — call seeding after demo login success

