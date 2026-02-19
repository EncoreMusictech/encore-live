

# Real-Time Admin Chat Between ENCORE and Sub-Accounts

## Overview

Build a persistent, real-time messaging system that allows ENCORE admins and sub-account admins (e.g., PAQ Publishing) to communicate directly within the platform. Messages are scoped per company (sub-account) and visible to all admin-level users on both sides. This is a human-to-human chat, distinct from the existing AI chatbot.

## How It Works

- A new **"Messages"** tab appears on the Sub-Account Detail page (alongside Overview, Onboarding, etc.)
- Both ENCORE admins and sub-account admins see this tab and share the same conversation thread for that company
- Messages are stored in a new `company_messages` database table
- Real-time delivery is powered by Supabase Realtime (Postgres Changes), following the same pattern used by `useSystemAlerts`
- Each message shows the sender's name/email, timestamp, and a visual distinction between "your" messages and "theirs"

## Database Changes

### New table: `company_messages`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Default `gen_random_uuid()` |
| company_id | uuid (FK -> companies) | The sub-account this thread belongs to |
| sender_id | uuid (FK -> auth.users) | The user who sent the message |
| sender_email | text | Denormalized for display |
| sender_name | text | Denormalized for display |
| content | text | Message body |
| is_encore_admin | boolean | true if sent by an ENCORE admin |
| read_by | jsonb | Array of user IDs who have read this message (default `[]`) |
| created_at | timestamptz | Default `now()` |

### RLS Policies

- **SELECT**: Users can read messages if they are an ENCORE admin (via `is_operations_team_member()`) OR an active member of the company (`user_belongs_to_company()`)
- **INSERT**: Same as SELECT -- only ENCORE admins or active company members can send messages
- No UPDATE/DELETE for regular users (messages are immutable once sent)

### Realtime

- Enable Realtime on the `company_messages` table so Supabase broadcasts inserts instantly

## UI Changes

### 1. New component: `src/components/admin/subaccount/SubAccountChat.tsx`

A chat panel that:
- Accepts `companyId`, `companyName` props
- Fetches existing messages for this company on mount
- Subscribes to Supabase Realtime for new inserts filtered by `company_id`
- Displays messages in a scrollable area with sender info, timestamps, and left/right alignment based on current user
- ENCORE admin messages get a distinct accent color vs. sub-account messages
- Input bar at the bottom with send button (Enter to send)
- Shows an unread indicator count

### 2. New tab on `SubAccountDetailPage.tsx`

- Add a "Messages" tab (with `MessageCircle` icon) visible to both ENCORE admins and sub-account admins
- Placed after the "Onboarding" tab for easy access
- Renders `<SubAccountChat companyId={company.id} companyName={company.name} />`

### 3. Hook: `src/hooks/useCompanyChat.ts`

Encapsulates:
- Fetching messages (`SELECT * FROM company_messages WHERE company_id = ? ORDER BY created_at ASC`)
- Sending messages (INSERT with current user info)
- Realtime subscription (Supabase channel on `company_messages` filtered by `company_id`)
- Auto-scroll on new messages
- Unread count tracking

## Technical Details

### Realtime Pattern

Follows the existing `useSystemAlerts` pattern:

```text
const channel = supabase
  .channel(`company_chat_${companyId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'company_messages',
    filter: `company_id=eq.${companyId}`
  }, (payload) => {
    // Append new message to state
  })
  .subscribe();
```

### Message Display

- Current user's messages: right-aligned, primary color background
- Other users' messages: left-aligned, muted background
- ENCORE admin messages show a small "ENCORE" badge next to sender name
- Sub-account messages show company name badge
- Timestamps in "2:30 PM" format
- Auto-scroll to bottom on new messages

### Security

- RLS ensures only authorized users (ENCORE admins + company members) can read/write
- `sender_id` is set to `auth.uid()` in the INSERT, enforced by RLS
- No message editing or deletion to maintain audit integrity

