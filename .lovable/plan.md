
# Fix: Handle Missing Search Data Gracefully

## Problem

When a user searches for an artist (e.g., "summer walker") that has **no prior catalog search** in the database, the `.single()` method throws an error because it expects exactly one row but gets zero.

**Current behavior**: Shows error "JSON object requested, multiple (or no) rows returned"
**Expected behavior**: Show a helpful message that no search data exists and offer to run a new search

---

## Root Cause

In `useCatalogAuditPresentation.ts`, lines 88-97 use `.single()` which throws an error when:
- Zero rows are returned (no search exists for this artist)
- Multiple rows are returned (shouldn't happen with `limit(1)`)

---

## Solution

### 1. Replace `.single()` with `.maybeSingle()`

Change the Supabase query to use `.maybeSingle()` which:
- Returns the data if exactly one row matches
- Returns `null` if no rows match (instead of throwing)
- Still throws if multiple rows match (safety check)

### 2. Improve Error Messaging

When no search data is found for an artist, instead of showing a generic error, show a user-friendly message explaining:
- No previous catalog search exists for this artist
- They need to run a Song Estimator search first
- Provide a link/button to the Song Estimator Tool

### 3. Update Error State

Add a more specific error type to distinguish between:
- "No search found" (user needs to run a search first)
- "Failed to load" (actual database/network error)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useCatalogAuditPresentation.ts` | Replace `.single()` with `.maybeSingle()` for artist name search |
| `src/pages/CatalogAuditPresentationPage.tsx` | Add better error UI with link to Song Estimator |

---

## Code Changes

### `useCatalogAuditPresentation.ts`

```typescript
// Line 88-97: Change from .single() to .maybeSingle()
} else if (artistName) {
  const { data, error: searchError } = await supabase
    .from('song_catalog_searches')
    .select('id, songwriter_name, total_songs_found, metadata_complete_count, pipeline_estimate_total, ai_research_summary')
    .ilike('songwriter_name', artistName)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();  // Changed from .single()

  if (searchError) throw searchError;
  
  if (!data) {
    throw new Error(`No catalog search found for "${artistName}". Please run a search in the Song Estimator Tool first.`);
  }
  
  search = data as SearchData;
}
```

### `CatalogAuditPresentationPage.tsx`

Improve the error state to show actionable options:
- Display the specific error message
- Add a button linking to `/song-estimator` to run a new search
- Keep the "Go Back" option

---

## Expected Result

When a user searches for an artist with no prior catalog search:

```text
+------------------------------------------+
|            ⚠️ No Search Found            |
|                                          |
|  No catalog search found for             |
|  "summer walker".                        |
|                                          |
|  Please run a search in the Song         |
|  Estimator Tool first.                   |
|                                          |
|  [Run Search]        [← Go Back]         |
+------------------------------------------+
```

---

## Technical Notes

- `.maybeSingle()` is the Supabase-recommended approach for "find one or none" queries
- This aligns with the guidance in the useful-context about avoiding `.single()` when no data might be returned
- The searchId path (lines 77-85) should also be updated for consistency, though it's less likely to fail since IDs are typically valid
