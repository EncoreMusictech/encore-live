# Sub-Account Data Filtering

## Overview

The data filtering system ensures that when administrators view the application as a sub-account, all data queries are automatically filtered to show only data belonging to that sub-account's users.

## Architecture

### 1. ViewModeContext (`src/contexts/ViewModeContext.tsx`)
- Tracks the current view mode (system admin vs sub-account view)
- Stores the active sub-account company ID and name
- Provides methods to enter/exit sub-account view mode

### 2. useDataFiltering Hook (`src/hooks/useDataFiltering.ts`)
- Consumes ViewModeContext to determine if filtering should be active
- Fetches all user IDs associated with the active sub-account company
- Provides utility functions to apply filters to Supabase queries

### 3. Data Hooks Integration
Updated hooks automatically apply filters:
- `useCopyright` - Filters copyrights by sub-account users
- `useContracts` - Filters contracts by sub-account users  
- `useRoyaltyAllocations` - Filters royalty data by sub-account users

## Usage

### In Data Hooks

```typescript
import { useDataFiltering } from '@/hooks/useDataFiltering';

export const useMyData = () => {
  const { applyUserIdFilter, applyCompanyIdFilter } = useDataFiltering();

  const fetchData = async () => {
    // For tables with user_id column
    let query = supabase
      .from('my_table')
      .select('*');
    
    query = applyUserIdFilter(query);
    
    const { data, error } = await query;
    
    // For tables with company_id column
    let companyQuery = supabase
      .from('catalog_items')
      .select('*');
    
    companyQuery = applyCompanyIdFilter(companyQuery);
    
    const { data: companyData, error: companyError } = await companyQuery;
  };
};
```

### In UI Components

```typescript
import { DataFilteringIndicator } from '@/components/DataFilteringIndicator';

export function MyDashboardPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1>Dashboard</h1>
        <DataFilteringIndicator />
      </div>
      {/* Rest of component */}
    </div>
  );
}
```

## How It Works

1. **Admin enters sub-account view:**
   - Clicks "View as User" on sub-account detail page
   - ViewSwitcher stores company context in sessionStorage
   - ViewModeBanner appears at top of all pages

2. **Data fetching is automatically filtered:**
   - useDataFiltering detects active view mode
   - Fetches all user_ids for the sub-account's company
   - Query filters are automatically applied to limit results

3. **Admin exits sub-account view:**
   - Clicks "Exit View Mode" in banner
   - Context is cleared from sessionStorage
   - All filters are removed, full data access restored

## Tables with Filtering

### By user_id
- copyrights
- contracts
- royalty_allocations
- sync_licenses
- payouts
- contacts

### By company_id  
- catalog_items
- company_users
- company_module_access

## Adding Filtering to New Data Hooks

1. Import the hook:
```typescript
import { useDataFiltering } from '@/hooks/useDataFiltering';
```

2. Get the filter functions:
```typescript
const { applyUserIdFilter, applyCompanyIdFilter } = useDataFiltering();
```

3. Apply to your query:
```typescript
let query = supabase.from('table').select('*');
query = applyUserIdFilter(query); // or applyCompanyIdFilter(query)
const { data, error } = await query;
```

## Security Considerations

- Filtering happens at the query level, not just UI
- RLS policies still apply as the final security layer
- Sub-account users cannot see system admin data
- System admins can toggle between views safely

## Testing

To test the filtering:
1. Create a sub-account with test users
2. Add test data for those users
3. View as the sub-account
4. Verify only sub-account data appears
5. Exit view mode and verify all data reappears
