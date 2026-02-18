

# Fix: Populate Interested Parties, Schedule of Works, and Controlled Share After Contract Upload

## Problem

The AI `parse-contract` edge function successfully extracts `works`, `parties`, and `controlled_share_percentage` from the uploaded PDF. This data is saved inside the `contract_data` JSON blob on the `contracts` row. However, the `SubAccountContractUpload.tsx` component only creates the parent contract record -- it **never inserts child rows** into:

- `contract_interested_parties` (parties with their splits)
- `contract_schedule_works` (works with ISWCs, writer names, controlled status)

It also does not write the `controlled_share_percentage` parsed from the contract.

The data is there (you can see it in the database's `contract_data` column), but it is not being used to seed the downstream tables that the royalty engine depends on.

## Root Cause

In `SubAccountContractUpload.tsx`, the `handleSaveContract` function calls `createContract(...)` which inserts a single row into `contracts`, then stops. There is no follow-up logic to iterate over `parsedData.parties` and `parsedData.works` and insert them into their respective tables.

## Solution

After `createContract()` returns the new contract record (with its `id`), add two post-insert steps:

### Step 1: Insert Interested Parties

Loop over `parsedData.parties` (the array extracted by OpenAI) and insert each into `contract_interested_parties`:

- `contract_id` = new contract's ID
- `name` = `party.party_name`
- `party_type` = `party.party_type` (e.g., "Administrator", "Original Publisher")
- `pro_affiliation` = `party.pro_affiliation`
- `performance_percentage` = `party.mechanical_royalty_rate_percentage` (mapped)
- `mechanical_percentage` = `party.mechanical_royalty_rate_percentage`
- `synch_percentage` = `party.sync_royalty_rate_percentage`
- `controlled_status` = derived from `parsedData.controlled_share_percentage` or party-level data
- `client_company_id` = `companyId` (will also be set by the DB trigger)

### Step 2: Insert Schedule of Works

Loop over `parsedData.works` and insert each into `contract_schedule_works`:

- `contract_id` = new contract's ID
- `song_title` = `work.work_title`
- `iswc` = `work.iswc_number`
- `writer_names` = `work.writer_names` (stored as JSON or text)
- `publisher_names` = `work.publisher_names`
- `album_title` = `work.album_title`
- `controlled_share` = `work.controlled_share_percentage`
- `controlled_status` = `work.controlled_status`
- `performance_percentage` = `work.performance_percentage`
- `mechanical_percentage` = `work.mechanical_percentage`
- `sync_percentage` = `work.sync_percentage`
- `client_company_id` = `companyId`

Optionally attempt to match each work to an existing `copyrights` record by title or ISWC to populate `copyright_id`.

### Step 3: Write Controlled Share to Contract

Set `controlled_share_percentage` (from `parsedData.controlled_share_percentage`) on the contract's `financial_terms` JSON or the appropriate column if available.

## File Changes

| File | Change |
|---|---|
| `src/components/admin/subaccount/SubAccountContractUpload.tsx` | Add post-insert logic in `handleSaveContract` to insert `contract_interested_parties` and `contract_schedule_works` rows from `parsedData.parties` and `parsedData.works`. Also display a summary of how many parties and works were imported. |

No database migrations are needed -- the `contract_interested_parties` and `contract_schedule_works` tables already exist with all required columns. The `set_contract_child_client_company_id` trigger will automatically propagate `client_company_id` to child rows.

## Technical Detail

The key code addition in `handleSaveContract` after the `createContract` call:

```text
const contract = await createContract({...});

// Insert interested parties from parsed data
if (parsedData?.parties?.length > 0) {
  for (const party of parsedData.parties) {
    await supabase.from('contract_interested_parties').insert({
      contract_id: contract.id,
      name: party.party_name,
      party_type: party.party_type,
      pro_affiliation: party.pro_affiliation,
      mechanical_percentage: party.mechanical_royalty_rate_percentage,
      synch_percentage: party.sync_royalty_rate_percentage,
      client_company_id: companyId,
    });
  }
}

// Insert schedule of works from parsed data
if (parsedData?.works?.length > 0) {
  for (const work of parsedData.works) {
    await supabase.from('contract_schedule_works').insert({
      contract_id: contract.id,
      song_title: work.work_title,
      iswc: work.iswc_number,
      controlled_share: work.controlled_share_percentage,
      controlled_status: work.controlled_status,
      client_company_id: companyId,
    });
  }
}
```

## Expected Outcome

After this fix, uploading a PDF contract for a sub-account will:
1. Create the contract record (already works)
2. Populate `contract_interested_parties` with all parties extracted from the PDF
3. Populate `contract_schedule_works` with all works/songs listed in the agreement
4. Store controlled share percentages at both the contract and work level
5. All child records will be correctly scoped to the sub-account via `client_company_id`
