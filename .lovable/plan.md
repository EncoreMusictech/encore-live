

# Publishing Entity Toggle -- Myind Sound Test

Implement a platform-wide publishing entity toggle for Myind Sound as a test. When viewing Myind Sound in View Mode, admins (and Myind Sound users) will see an "Entity" dropdown in the ViewModeBanner that filters contracts, copyrights, payees, royalties, and expenses by the selected publishing entity.

---

## Architecture

The implementation follows the exact same pattern as the existing Client Scope Selector:

```text
ViewModeContext (stores publishingEntityId in sessionStorage)
       |
       v
useDataFiltering (exposes applyEntityFilter)
       |
       v
Data hooks (usePayees, useCopyright, useRoyaltyAllocations, useExpenses, contracts)
       |
       v
EntityScopeSelector (dropdown in ViewModeBanner)
```

---

## Changes by File

### 1. `src/contexts/ViewModeContext.tsx`

- Add `publishingEntityId?: string` and `publishingEntityName?: string` to the `ViewContext` interface
- Add `setPublishingEntity: (entityId: string | null, entityName?: string) => void` to `ViewModeContextType`
- Add `isEntityFiltered: boolean` computed property (true when `publishingEntityId` is set)
- Implement `setPublishingEntity` -- updates the stored context and dispatches `viewContextChanged`
- Update `useViewModeOptional.ts` to include the new defaults

### 2. `src/hooks/useDataFiltering.ts`

- Read `viewContext.publishingEntityId` from the view mode context
- Add `applyEntityFilter(query)` function: if `publishingEntityId` is set, appends `.eq('publishing_entity_id', publishingEntityId)` to the query; otherwise returns query unchanged
- Include `publishingEntityId` in the `filterKey` string so dependent hooks refetch on toggle
- Update `getFilterSummary()` to append entity name when entity filter is active

### 3. New file: `src/components/hierarchy/EntityScopeSelector.tsx`

A dropdown component modeled on `ClientScopeSelector`:

- Fetches `publishing_entities` for the current company (`viewContext.companyId` or `parentCompanyId`) where `status = 'active'`
- Renders nothing if the company has zero entities (backward compatible)
- Shows "All Entities" option (clears filter) and individual entity names
- Calls `setPublishingEntity(entityId, entityName)` on selection
- Highlights the currently selected entity with a check icon

### 4. `src/components/ViewModeBanner.tsx`

- Import and render `EntityScopeSelector` next to the existing `ClientScopeSelector`
- When an entity is selected, append the entity name to the breadcrumb trail

### 5. `src/components/DataFilteringIndicator.tsx`

- Read entity filter state from `useDataFiltering`
- When entity filter is active, include entity name in the badge text

### 6. Data hooks -- apply `applyEntityFilter`

Only hooks whose underlying tables have `publishing_entity_id`:

| Hook | Table | Action |
|---|---|---|
| `src/hooks/useCopyright.ts` | copyrights | Add `applyEntityFilter(query)` |
| `src/hooks/usePayees.ts` | payees | Add `applyEntityFilter(query)` |
| `src/hooks/useRoyaltyAllocations.ts` | royalty_allocations | Add `applyEntityFilter(query)` |
| `src/hooks/useExpenses.ts` | payout_expenses | Add `applyEntityFilter(query)` |

Hooks for tables without `publishing_entity_id` (contacts, payouts, sync_licenses, notifications, operations) are left untouched.

Contract-fetching queries (wherever they appear in sub-account contract views) will also get the entity filter applied.

### 7. `src/hooks/useViewModeOptional.ts`

- Add `setPublishingEntity` and `isEntityFiltered` to the default return object

---

## What stays the same

- Companies without publishing entities see no change (selector hidden)
- Client scope selector continues to work independently
- Both selectors can be active simultaneously (entity within a client scope)
- All existing RLS policies remain intact
- No database migrations needed

## Testing with Myind Sound

Myind Sound already has one publishing entity ("Myind Sound" / ASCAP). To test the toggle:

1. Enter View Mode for Myind Sound
2. The Entity dropdown should appear showing "All Entities" and "Myind Sound"
3. Selecting "Myind Sound" filters all scoped data; selecting "All Entities" clears the filter
4. Add a second entity via the Entities tab to verify multi-entity toggling

