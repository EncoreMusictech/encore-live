

# Add PDF View & Download to Active Contracts

## Problem

The `SubAccountContractUpload` component uploads the PDF to the `contract-documents` storage bucket and obtains a `publicUrl`, but never saves it to the `original_pdf_url` column on the `contracts` table. The Active Contracts list also does not query or display any PDF-related actions.

## Changes

### 1. Save PDF URL on contract creation (`SubAccountContractUpload.tsx`)

In `handleSaveContract`, pass `original_pdf_url` into the `createContract` call. The `publicUrl` is already available in the component scope during the upload flow -- it just needs to be persisted in state after upload and included in the insert payload.

- Add a new state variable `pdfUrl` to hold the public URL after upload.
- Set `pdfUrl` from `publicUrl` inside `handleUpload`.
- Include `original_pdf_url: pdfUrl` in the `createContract` call inside `handleSaveContract`.
- Reset `pdfUrl` in `resetForm`.

### 2. Add PDF column and actions to the contracts table (`SubAccountContractsList.tsx`)

- Add `original_pdf_url` to the `ContractRow` interface and to the `.select()` query.
- Add a new "PDF" column to the table header.
- For each contract row, if `original_pdf_url` exists, render two icon buttons:
  - **Eye icon** -- opens a dialog/modal displaying the PDF using an iframe (reusing the pattern from the existing `PDFViewer` component).
  - **Download icon** -- triggers a direct download of the PDF file.
- If no PDF URL exists, show a dash ("--").

### 3. PDF Viewer Dialog

Add a simple Dialog (Radix `Dialog`) inside `SubAccountContractsList.tsx` that:
- Opens when the user clicks the eye icon on any row.
- Displays the PDF in an iframe at full dialog width/height.
- Includes a download button in the dialog header.
- This is accessible to both sub-account admins and ENCORE admins since the component is rendered within the admin-scoped page and the `contract-documents` bucket has public read access.

## Files to Modify

| File | Change |
|---|---|
| `src/components/admin/subaccount/SubAccountContractUpload.tsx` | Add `pdfUrl` state; save `original_pdf_url` on contract creation |
| `src/components/admin/subaccount/SubAccountContractsList.tsx` | Query `original_pdf_url`; add PDF column with view/download actions; add PDF viewer dialog |

## No database or storage changes needed

- The `original_pdf_url` column already exists on the `contracts` table.
- The `contract-documents` bucket is already public with read access for all users.

