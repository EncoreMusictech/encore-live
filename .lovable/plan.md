
# Add Search/Selection Interface to Catalog Audit Presentation Page

## Overview

When users visit `/catalog-audit-presentation` without parameters, instead of showing an error, we'll display a search and selection interface that allows them to:
1. Search for a new artist to audit
2. Select from recent/existing catalog searches

---

## User Experience

```text
+------------------------------------------+
|  ENCORE Catalog Audit Presentation       |
|                                          |
|  ┌────────────────────────────────────┐  |
|  │ Search for an artist...        🔍  │  |
|  └────────────────────────────────────┘  |
|                                          |
|  ─── OR SELECT FROM RECENT SEARCHES ───  |
|                                          |
|  ┌────────────────────────────────────┐  |
|  │ 🎵 Ryan Tedder     100 songs   ▶  │  |
|  │    Aug 24, 2025                    │  |
|  └────────────────────────────────────┘  |
|  ┌────────────────────────────────────┐  |
|  │ 🎵 Lawrence Berment  78 songs  ▶  │  |
|  │    Jan 9, 2026                     │  |
|  └────────────────────────────────────┘  |
|                                          |
+------------------------------------------+
```

---

## Implementation

### New Component: `AuditPresentationSelector.tsx`

Create a new component that displays when no parameters are provided:

**Features:**
- Artist name input with search button
- List of recent completed searches from `song_catalog_searches`
- Each search shows: songwriter name, song count, date, and a "Present" button
- Clicking a search navigates to the presentation with the `searchId` parameter
- Animated entry using existing `PresentationSlide` patterns
- ENCORE branding consistent with the presentation slides

**Data Fetching:**
- Query `song_catalog_searches` for the current user
- Filter to only show `completed` status searches
- Order by `created_at` descending
- Limit to most recent 10 searches

---

### Modify: `CatalogAuditPresentationPage.tsx`

Update the page logic:

1. **Add new state**: Track whether we're in "selection mode" vs "presentation mode"
2. **Add recent searches query**: Fetch recent searches when no params provided
3. **Conditional rendering**:
   - If `searchId` or `artist` params exist: Show loading then presentation (current behavior)
   - If no params: Show the `AuditPresentationSelector` component
4. **Handle selection**: When user selects a search, update URL params and trigger presentation load

---

### Modify: `useCatalogAuditPresentation.ts`

Add a function to fetch recent searches for the selector:

```typescript
// Add to the hook return
recentSearches: SearchData[];
fetchRecentSearches: () => Promise<void>;
```

---

## Technical Details

### Component Structure

```
CatalogAuditPresentationPage.tsx
├── No params? → AuditPresentationSelector
│   ├── Search input + button
│   ├── Divider "OR SELECT FROM RECENT"
│   └── List of recent searches (clickable cards)
│
└── Has params? → Existing flow
    ├── Loading state
    ├── Error state
    └── CatalogAuditPresentation
```

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/catalog-audit/AuditPresentationSelector.tsx` | Selection interface component |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/CatalogAuditPresentationPage.tsx` | Add conditional rendering for selector vs presentation |
| `src/hooks/useCatalogAuditPresentation.ts` | Add `recentSearches` state and fetch function |

---

## UI Design

### Search Section
- Full-width input with placeholder "Enter artist or songwriter name..."
- Primary button with search icon
- Loading state while searching

### Recent Searches List
- Cards with hover effect
- Each card shows:
  - Music icon
  - Songwriter name (bold)
  - Song count badge
  - Created date
  - "Present" button (right side)
- Only show searches with `search_status = 'completed'`
- Empty state if no recent searches

### Styling
- Dark gradient background matching presentation
- ENCORE branding header
- Animated fade-in on mount
- Cards with `bg-card/50 backdrop-blur` for glass effect

---

## Flow After Selection

When user clicks a search or submits a new artist name:
1. Update URL with `?searchId=xxx` or `?artist=xxx`
2. `useCatalogAuditPresentation` hook detects the change
3. Hook fetches data and triggers loading state
4. Presentation renders with the data
