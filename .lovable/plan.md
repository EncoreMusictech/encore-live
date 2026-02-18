# Add "Contracts" Tab to Sub-Account Detail Page

## Overview

Add a new **Contracts** tab to the sub-account detail page (`SubAccountDetailPage.tsx`) that provides three capabilities: single PDF contract upload with AI parsing, bulk contract import via spreadsheet, and post-term collection period tracking with admin notifications.

## Database Migration

A new migration adds two columns to the `contracts` table to support post-term collection periods:


| Column                          | Type      | Default | Purpose                                              |
| ------------------------------- | --------- | ------- | ---------------------------------------------------- |
| `post_term_collection_end_date` | `date`    | `null`  | Date when post-term royalty collection rights expire |
| `post_term_collection_months`   | `integer` | `null`  | Duration of post-term collection period in months    |


No new tables are needed -- the existing `contracts`, `contract_interested_parties`, and `contract_schedule_works` tables already support all required data.

## New Components

### 1. `SubAccountContracts.tsx`

Top-level wrapper rendered inside the new "Contracts" tab. Contains inner tabs:

- **Upload Contract** -- single PDF upload
- **Bulk Import** -- spreadsheet-based bulk import
- **Active Contracts** -- list of contracts for this sub-account with post-term status

### 2. `SubAccountContractUpload.tsx`

Adapts the existing `ContractUpload.tsx` pattern for sub-account context:

- Accepts `companyId` and `companyName` props
- Uses `getActingUserId()` from `useContracts` to attribute uploads to the service account
- Sets `client_company_id` to the sub-account's company ID on insert
- After parsing, displays a review form that includes new **Post-Term Collection Period** fields (end date and duration in months)
- Creates the contract record with `post_term_collection_end_date` and `post_term_collection_months`

### 3. `BulkContractImport.tsx`

Spreadsheet-based bulk import modeled after `BulkWorksUpload.tsx`:

- **Template download** button generating an Excel file with columns: `title`, `counterparty_name`, `contract_type`, `start_date`, `end_date`, `post_term_collection_end_date`, `post_term_collection_months`, `advance_amount`, `commission_percentage`, `territories`, `party_name`, `party_type`, `performance_pct`, `mechanical_pct`, `synch_pct`, `work_title`, `work_isrc`
- **Validation step** before import: displays parsed rows in a table for user review, highlighting any validation issues (missing required fields, invalid contract types, splits not totaling 100%)
- **Import execution** using batch processing (batch size 10) with retry and exponential backoff, matching existing bulk upload reliability patterns
- Uses service account identity via `getActingUserId()` for all writes
- Sets `client_company_id` on every contract
- After import, runs `validate_royalty_splits` RPC and shows a summary of royalty-ready vs. needs-review contracts

### 4. `SubAccountContractsList.tsx`

Displays contracts belonging to this sub-account:

- Queries `contracts` where `client_company_id = companyId`
- Shows title, type, status, dates, and a **Post-Term Status** badge:
  - "Active" (green) -- within initial term
  - "Post-Term Collection" (amber) -- past `end_date` but before `post_term_collection_end_date`
  - "Collection Expired" (red) -- past `post_term_collection_end_date`
  - "Expiring Soon" (amber, pulsing) -- within 90 days of `post_term_collection_end_date`
- "Expiring Soon" contracts show an alert banner at the top of the list to notify admin users

## Page Integration

In `SubAccountDetailPage.tsx`:

- Add a new `TabsTrigger` for "Contracts" with a `FileText` icon, visible to ENCORE admins
- Add corresponding `TabsContent` rendering `<SubAccountContracts companyId={company.id} companyName={company.name} />`

## Files to Create/Modify


| File                                                           | Action                                                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/components/admin/subaccount/SubAccountContracts.tsx`      | **Create** -- tab wrapper                                                                   |
| `src/components/admin/subaccount/SubAccountContractUpload.tsx` | **Create** -- single PDF upload adapted for sub-account                                     |
| `src/components/admin/subaccount/BulkContractImport.tsx`       | **Create** -- spreadsheet bulk import                                                       |
| `src/components/admin/subaccount/SubAccountContractsList.tsx`  | **Create** -- contract list with post-term badges                                           |
| `src/pages/SubAccountDetailPage.tsx`                           | **Edit** -- add Contracts tab                                                               |
| Migration SQL                                                  | **Create** -- add `post_term_collection_end_date` and `post_term_collection_months` columns |


## Technical Details

### Service Account Attribution

All write operations use the service account pattern already established:

```text
const actingUserId = await getActingUserId();
// Insert with: user_id: actingUserId, client_company_id: companyId
```

### Post-Term Collection Logic

```text
if now < end_date                          -> "Active"
if now >= end_date AND now < post_term_end -> "Post-Term Collection"  
if now >= post_term_end                    -> "Collection Expired"
if post_term_end - now <= 90 days          -> "Expiring Soon" alert
```

### Bulk Import Validation Rules

- `title` and `counterparty_name` are required
- `contract_type` must be one of: publishing, artist, producer, sync, distribution
- `start_date` and `end_date` must be valid date strings
- `post_term_collection_months` must be a positive integer if provided
- Duplicate detection: skip rows where `title + counterparty_name + contract_type` already exists for the same `client_company_id`
- If `party_name` is present, `performance_pct + mechanical_pct + synch_pct` are validated but not required to total 100% (flagged as warning)

### Parse-Contract Edge Function

The existing `parse-contract` edge function is reused as-is. The `SubAccountContractUpload` component wraps it with sub-account-scoped identity and adds post-term fields to the review form before final contract creation.