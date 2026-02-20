

# Consolidate Redundant Client Navigation Items

## Problem
There are 4 overlapping client-related items across the sidebar and header, causing confusion:

| Item | Location | Route | What It Does |
|---|---|---|---|
| **Client Portal** (sidebar) | Sidebar > Management | `/dashboard/client-admin` | Manage portal invitations and access |
| **Manage Clients** (sidebar) | Sidebar > Management | `/dashboard/clients` | Create/manage client labels (same `ClientsManager` component as Operations > Clients tab) |
| **Operations > Clients tab** | Sidebar > Management > Operations | `/dashboard/operations/sub-accounts/{id}` | Also uses `ClientsManager` -- identical functionality to "Manage Clients" |
| **View Client Portal** (header) | Mobile hamburger menu | `/client-portal` | Admin preview of the external-facing portal |

## Changes

### 1. Remove "Manage Clients" sidebar button
Since the **Operations > Clients tab** already provides the exact same `ClientsManager` component, the standalone "Manage Clients" link (`/dashboard/clients`) is fully redundant. Remove it from **both** sidebar Management sections in `CRMSidebar.tsx`.

### 2. Rename "Client Portal" sidebar item to "Portal Access"
Rename the sidebar link from "Client Portal" to **"Portal Access"** to clearly distinguish it from the actual external-facing client portal (`/client-portal`). This makes it obvious this is about managing who gets access, not viewing the portal itself.

### 3. Keep the header "View Client Portal" link as-is
This serves a different purpose (admin preview of the external portal) and is only visible to administrators in the mobile menu. No change needed.

### 4. Remove the `/dashboard/clients` route from App.tsx
Since the standalone page is being removed, clean up the route entry and the `ClientManagementPage` import.

## Files Changed

| File | Change |
|---|---|
| `src/components/crm/CRMSidebar.tsx` | Remove "Manage Clients" sidebar items (2 locations: lines 243-250 and 368-375). Rename "Client Portal" to "Portal Access" (2 locations: lines 231 and 356). |
| `src/App.tsx` | Remove route for `/dashboard/clients` (line 128) and the `ClientManagementPage` import (line 52). |

The `ClientManagementPage.tsx` file itself can be kept for now (no harm) or deleted -- the important thing is it's no longer linked anywhere.

