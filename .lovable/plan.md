

## Implement Chart Images & CSV Attachment in Migration Email

### Changes

**1. `supabase/functions/_shared/gmail.ts`** — Add attachment support
- Add `EmailAttachment` interface (`filename`, `mimeType`, `content` as base64)
- Update `buildMimeMessage` to use `multipart/mixed` outer boundary when attachments present, with `multipart/alternative` nested for HTML
- Add `attachments?` param to `sendGmail` opts and pass through to `buildMimeMessage`

**2. `supabase/functions/send-migration-update/index.ts`** — Add completion report & CSV
- Accept optional `stats` object in request body:
  - `overall_progress` (0-100), `total_writers`, `completed_checkpoints`, `total_checkpoints`
  - `checkpoint_breakdown`: array of `{ label, pct }`
  - `writers`: array of `{ writer_name, entity_name, administrator, checkpoints }` for CSV
- Generate two QuickChart.io image URLs:
  - **Doughnut chart** for overall completion %
  - **Horizontal bar chart** for per-entity breakdown
- Insert a "Completion Report" section at the top of the email body with `<img>` tags pointing to QuickChart URLs and summary stats
- Generate a CSV string from the `writers` array, base64-encode it, and attach via the new `sendGmail` attachments param
- If no `stats` provided, email sends without the report section (backward compatible)

**3. Deploy & test send** to `info@encoremusic.tech` with sample stats for PAQ Publishing

### Sample stats for test
```json
{
  "overall_progress": 67,
  "total_writers": 12,
  "completed_checkpoints": 72,
  "total_checkpoints": 108,
  "checkpoint_breakdown": [
    { "label": "Contract Entered", "pct": 100 },
    { "label": "Copyrights Entered", "pct": 58 },
    { "label": "Schedules Attached", "pct": 42 },
    { "label": "Payees Created", "pct": 75 },
    { "label": "Contract Terms Confirmed", "pct": 83 },
    { "label": "Payee Splits Confirmed", "pct": 50 },
    { "label": "Beginning Balance Entered", "pct": 33 },
    { "label": "Client Portal Created", "pct": 92 },
    { "label": "Client Assets Granted", "pct": 67 }
  ]
}
```

