

## Update Bulk Contract Import for Publishing Entity Support

### Problem
The bulk import template and processing logic have no awareness of publishing entities. All imported contracts get `publishing_entity_id = NULL`, bypassing entity-level recoupment isolation and reporting.

### Changes

**File: `src/components/admin/subaccount/BulkContractImport.tsx`**

1. **Add a `publishing_entity` column to the template**
   - New column in the downloadable Excel template: `publishing_entity`
   - Example value: `"PAQ / Kobalt"` (matches the entity's `name` or `display_name`)
   - This is a human-readable name, not a UUID -- friendlier for spreadsheet users

2. **Fetch available entities on mount**
   - Query `publishing_entities` WHERE `company_id = companyId` AND `status = 'active'`
   - Build a lookup map: `entity name (lowercase) -> entity id`
   - If the company has zero entities, the column is simply ignored (backward compatible)

3. **Update `ParsedRow` interface**
   - Add `publishing_entity?: string` and `publishing_entity_id?: string` fields

4. **Update validation logic (`validateAndPreview`)**
   - Read `publishing_entity` from each row
   - If provided but not found in the lookup map, add a validation error: `"Unknown publishing entity: {value}. Valid options: ..."`
   - If not provided and the company has entities, add a warning: `"No publishing entity specified -- contract will be unscoped"`

5. **Update the validation table UI**
   - Add a "Publishing Entity" column to the preview table between "Type" and "Post-Term"

6. **Update import logic (`handleImport`)**
   - When calling `createContract`, include `publishing_entity_id` from the resolved lookup
   - The existing `createContract` function already passes through all fields to the Supabase insert, so this flows directly to the `contracts` table

### What stays the same
- Companies without publishing entities are unaffected (column is optional)
- All existing validation rules remain intact
- Duplicate detection logic unchanged
- Interested parties and schedule works insertion unchanged

### Technical Detail: Entity Resolution
Rather than requiring users to paste UUIDs into a spreadsheet, the system resolves by name. The lookup is case-insensitive and trims whitespace. If a company has entities named "PAQ / Kobalt" and "PAQ / EMPIRE", the user types exactly that string in the spreadsheet cell.
