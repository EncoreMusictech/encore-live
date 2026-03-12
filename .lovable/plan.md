

## Add "Send Report Email" Button with Real Data to MigrationTracker

### What this does
Adds a **Send Report Email** button to the MigrationTracker controls bar that:
1. Opens a dialog to enter/confirm the recipient email
2. Automatically computes real stats from the already-loaded `items` state
3. Calls `supabase.functions.invoke('send-migration-update')` with the real data
4. After implementation, triggers a test email to `info@encoremusic.tech` with live PAQ Publishing data

### Data available (PAQ Publishing — live from DB)
PAQ has migration tracking items across multiple entities (EMPIRE, etc.) with real checkpoint data — some contracts entered, some copyrights, some schedules. The button will pull from whatever is currently loaded in the component state.

### Changes

**File: `src/components/admin/subaccount/MigrationTracker.tsx`**

1. Add imports: `Input`, `Label`, `Dialog` components, `Mail` icon
2. Add state: `emailDialogOpen`, `recipientEmail`, `sendingEmail`
3. Add `sendReportEmail` function that:
   - Builds `stats` object from existing computed values (`overallProgress`, `completedCheckpoints`, `totalCheckpoints`, `checkpointStats`, `items`)
   - Maps `items` to `writers` array with `{ writer_name, entity_name, administrator, checkpoints: { [cp.label]: item[cp.key] } }`
   - Calls `supabase.functions.invoke('send-migration-update', { body: { to_email, company_name: companyName, stats } })`
   - Shows success/error toast
4. Add button + dialog in controls bar (next to "Sync from DB", only when `!readOnly` and `items.length > 0`):
   - Button: `<Mail />` icon + "Send Report Email"
   - Dialog: email input field + Send button

**After deploy**: Invoke edge function via curl to send test email to `info@encoremusic.tech` using real PAQ Publishing data from the database.

### No other files change
The edge function already handles the `stats` object, QuickChart URLs, and CSV attachment.

