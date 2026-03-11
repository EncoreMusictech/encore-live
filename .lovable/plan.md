

## Updated Plan: Send Migration Tracker Update Email (with Upload Instructions)

Same plan as previously approved, with the email body now including two additional sections describing how PAQ Publishing admins can independently upload contracts and copyrights.

### Email Content Additions

After the "How to Use the Migration Tracker" section, add:

**Uploading Contracts**
- Navigate to your Account Detail page and select the **Contracts** tab
- Click the **Upload** tab to upload individual contract PDFs
- Our AI-powered parser will automatically extract key terms, interested parties, and schedules from the PDF
- Review the extracted data across three tabs: Details, PDF Preview, and Analysis
- Confirm and save — the contract will be linked to your account and visible in the Contracts List
- For bulk imports, use the **Bulk Import** tab to upload a spreadsheet of contract metadata

**Uploading Copyrights / Works**
- Navigate to the **Works** tab in your Account Detail page
- Click the **Upload** tab to upload a spreadsheet of your works catalog
- The system accepts standard spreadsheet formats with columns for work title, writers, publishers, ISWC, and other metadata
- Review the grouped and validated works before committing them to the database
- Uploaded works will appear in the Works List and can be linked to contracts

### Files

- **Create**: `supabase/functions/send-migration-update/index.ts` — edge function using `sendGmail` from `_shared/gmail.ts` and `emailLayout` from `_shared/email-templates.ts`, with the full email HTML inline containing all sections (tracker overview, data security, upload instructions, Phase 4 action items, Phase 5 preview). Sends to the provided `to_email` parameter.

### Technical Details

- Follows the same pattern as `send-catalog-valuation-onboarding` (CORS headers, `sendGmail`, serve handler)
- Single `to_email` + `company_name` body params
- Deploy via `deploy_edge_functions` after creation
- Test send to `info@encoremusic.tech`

