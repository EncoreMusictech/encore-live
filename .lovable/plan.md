

# Two-Tier Whitelabel Branding System

## How It Works

There are two levels of control:

### Tier 1: ENCORE Admin Control (on Sub-Account Detail Page)
On the **Modules** tab (where you already toggle features on/off), a new module called **"Whitelabel Branding"** will appear. ENCORE admins can enable or disable this feature per sub-account, just like any other module. If it's off, the sub-account never sees the Branding tab and their clients see the default ENCORE purple portal.

### Tier 2: Sub-Account Branding Configuration
If ENCORE has enabled whitelabeling for a sub-account, a **"Branding"** tab appears on the Sub-Account Detail Page (and eventually in the sub-account's own dashboard when viewing as that account). The sub-account can configure:
- **Logo URL** (replaces the ENCORE spinning vinyl in the Client Portal header)
- **Portal Display Name** (e.g., "Myind Sound" replaces "Client Portal")
- **Color Palette** -- Primary, Accent, and Header Background colors with preset quick-picks
- A "Powered by ENCORE" badge always remains visible

### What Clients See
When a client logs into the Client Portal:
- If their sub-account has whitelabeling enabled AND configured: they see the sub-account's logo, name, and colors
- Otherwise: the default ENCORE purple gradient header with spinning vinyl

## Changes

### 1. Add "Whitelabel Branding" to the modules list
**File:** `src/components/admin/subaccount/SubAccountModules.tsx`

Add a new entry to the `AVAILABLE_MODULES` array:
```text
{
  name: 'whitelabel_branding',
  label: 'Whitelabel Branding',
  description: 'Allow this sub-account to customize Client Portal branding with their own logo and colors',
  icon: Palette,
  financial: false,
}
```
This means ENCORE admins can toggle it on/off per sub-account via the existing Modules tab -- no new UI needed for Tier 1.

### 2. New Component: SubAccountBranding.tsx
**File:** `src/components/admin/subaccount/SubAccountBranding.tsx`

A settings panel with:
- Enable/disable whitelabel toggle (Switch)
- Logo URL input
- Portal display name input
- Color pickers for Primary, Accent, and Header Background (HSL format with live preview swatches)
- Quick preset palette row (Blue, Teal, Red, Orange, Green, Gold)
- Save button -- writes to `companies.settings` JSONB under a `branding` key

### 3. Update SubAccountDetailPage.tsx
**File:** `src/pages/SubAccountDetailPage.tsx`

- Check if the `whitelabel_branding` module is enabled for this sub-account
- If enabled, show the **"Branding"** tab (Palette icon) in the tabs list
- If not enabled, the tab is hidden entirely

### 4. New Hook: useClientBranding.ts
**File:** `src/hooks/useClientBranding.ts`

Resolves branding for the logged-in client:
1. Query `client_portal_access` to get `subscriber_user_id`
2. Query `company_users` to get the subscriber's `company_id`
3. Check `company_module_access` to confirm `whitelabel_branding` is enabled
4. Query `companies.settings` to read branding config
5. Return branding data (or null if module is disabled or branding not configured)

### 5. Update ClientPortal.tsx
**File:** `src/components/ClientPortal.tsx`

- Call `useClientBranding(user.id)`
- If branding is returned and enabled:
  - Header gradient uses the sub-account's colors instead of purple
  - Sub-account's logo replaces the spinning vinyl record
  - Display name replaces "Client Portal" title
  - Add "Powered by ENCORE" small text/badge in the header
- If not enabled: default ENCORE purple header, no changes
- Wrap portal content in a div with scoped CSS variable overrides so buttons and tabs within the portal also pick up the custom primary/accent colors

## Data Flow

```text
ENCORE Admin
  -> Modules tab: toggles "Whitelabel Branding" on/off for sub-account
    -> Stored in company_module_access table

Sub-Account (if module enabled)
  -> Branding tab: configures logo, name, colors
    -> Stored in companies.settings.branding JSONB

Client logs into Client Portal
  -> useClientBranding hook:
    -> client_portal_access (subscriber_user_id)
      -> company_users (company_id)
        -> company_module_access: is whitelabel_branding enabled?
          -> YES: read companies.settings.branding -> apply theme
          -> NO: show default ENCORE purple
```

## Technical Notes

- **No database migration needed** -- uses existing `company_module_access` table for Tier 1 and existing `companies.settings` JSONB column for Tier 2
- Colors applied via **inline styles and scoped CSS variables** on the Client Portal wrapper only -- the rest of the ENCORE app is never affected
- The "Branding" tab visibility is conditional on the `whitelabel_branding` module being enabled, so sub-accounts without the feature never see it

