

# Add Type Column and Parent Association to Sub-Account Table

## What Changes

Update `src/components/admin/SubAccountDashboard.tsx` to show two new pieces of information in the table:

### 1. "Type" column
A new column between "Company" and "Contact" that displays a color-coded badge for `company_type`:
- **Publishing Firm** -- blue badge
- **Client Label** -- purple badge
- **Standard** -- gray/outline badge

### 2. "Parent" identifier in the Company column
For any company that has a `parent_company_id`, show a small line beneath the display name indicating which parent it belongs to, e.g.:
> **Tzurel Halfon pka Zuri / PAQ**
> Tzurel Halfon pka Zuri
> *Client of PAQ Publishing*

This uses a left-arrow or link icon to make the relationship visually clear.

---

## Technical Details

### Interface update
Add `company_type`, `parent_company_id`, and `parent_company_name` to the `Company` interface.

### Query update
Change the Supabase query to join the parent company name:
```
.select('*, parent:companies!parent_company_id(name)')
```
This fetches the parent company's name in a single query without extra round-trips.

### Table rendering
- Add a `<TableHead>Type</TableHead>` column after "Company"
- Render a badge with the formatted company type
- In the "Company" cell, if `parent_company_id` is set, render a muted line: "Client of {parent_company_name}" with a small link icon

### Stats update
Optionally split the stats to show count by type (publishing firms vs client labels vs standard).

### Search update
Include `company_type` and `parent_company_name` in the search filter so admins can search "client label" or "PAQ" to find associated accounts.

