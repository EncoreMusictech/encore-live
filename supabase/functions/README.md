# Supabase Edge Functions

## Dynamic Royalty Statement Exports

This directory contains Edge Functions for generating professional royalty statements in multiple formats.

### Functions

#### `generate-payout-statement`

Generates individual payout statements in PDF or Excel format.

**Endpoint:** `POST /api/generate-payout-statement`

**Query Parameters:**
- `format` (optional): `'pdf'` | `'xlsx'` (default: `'pdf'`)
- `includeDetails` (optional): `true` | `false` (PDF only, default: `false`)

**Request Body:**
```json
{
  "payoutId": "uuid-string"
}
```

**Response:**
- Content-Type: `application/pdf` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="payout-statement-{period}-{id}.{ext}"`

**Examples:**
```bash
# Generate PDF statement
curl -X POST '/api/generate-payout-statement?format=pdf' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {token}' \
  -d '{"payoutId": "12345-67890"}'

# Generate Excel statement
curl -X POST '/api/generate-payout-statement?format=xlsx' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {token}' \
  -d '{"payoutId": "12345-67890"}'

# Generate PDF with details page
curl -X POST '/api/generate-payout-statement?format=pdf&includeDetails=true' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {token}' \
  -d '{"payoutId": "12345-67890"}'
```

#### `generate-bulk-statements`

Generates multiple payout statements packaged in a ZIP file.

**Endpoint:** `POST /api/generate-bulk-statements`

**Query Parameters:**
- `format` (optional): `'pdf'` | `'xlsx'` | `'both'` (default: `'pdf'`)
- `includeDetails` (optional): `true` | `false` (PDF only, default: `false`)

**Request Body:**
```json
{
  "payoutIds": ["uuid-1", "uuid-2", "uuid-3"],
  "format": "pdf",
  "includeDetails": false
}
```

**Response:**
- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename="bulk-payout-statements-{timestamp}.zip"`

**Examples:**
```bash
# Generate PDF statements in ZIP
curl -X POST '/api/generate-bulk-statements?format=pdf' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {token}' \
  -d '{"payoutIds": ["id1", "id2", "id3"]}'

# Generate both PDF and Excel statements in ZIP
curl -X POST '/api/generate-bulk-statements?format=both' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {token}' \
  -d '{"payoutIds": ["id1", "id2", "id3"]}'
```

### Statement Structure

#### Summary Page/Sheet
- **Header**: Period, Payee, Statement ID, Date Issued
- **Income Summary**: Categorized by Performance, Mechanical, Sync, Other
- **Balance Summary**: Opening Balance, Net for Period, Payments Made, Closing Balance
- **Payment Method**: How payment will be processed

#### Details Page/Sheet (Excel only, PDF optional)
Contains line-by-line royalty details with columns:
- QUARTER
- SOURCE  
- WORK ID
- WORK TITLE
- WRITER(S)
- PUB SHARE (%)
- INCOME TYPE
- TERRITORY
- UNITS
- AMOUNT
- PAYEE

### Income Type Categorization

The system automatically categorizes revenue sources:

- **Performance**: ASCAP, BMI, SESAC, performance royalties
- **Mechanical**: Streaming, digital sales, mechanical royalties  
- **Sync**: Film, TV, advertising, synchronization licenses
- **Other**: All other revenue sources

### File Naming Conventions

- **Single statements**: `payout-statement-{period}-{id}.{ext}`
- **Bulk ZIP files**: `bulk-payout-statements-{YYYYMMDD-HHmmss}.zip`

### Security

- JWT authentication required for all endpoints
- Row-Level Security enforced - users can only access their own payouts
- Authorization header must contain valid bearer token

### Error Handling

**Common Error Responses:**
- `400`: Missing or invalid request parameters
- `401`: Missing or invalid authorization
- `404`: Payout not found or access denied
- `500`: Server error during generation

### Libraries Used

- **PDF Generation**: pdf-lib for programmatic PDF creation
- **Excel Generation**: SheetJS (xlsx) for XLSX file creation
- **ZIP Creation**: Custom implementation using standard ZIP format
- **Data Processing**: Supabase client for database operations

### Performance Notes

- All processing done in memory (no disk writes)
- ZIP files created using streaming approach for large datasets
- PDF generation optimized for letter-size pages
- Excel files include proper formatting and column widths

### Development

To test the functions locally:

```bash
# Start Supabase locally
supabase start

# Test single PDF generation
supabase functions serve generate-payout-statement

# Test bulk ZIP generation  
supabase functions serve generate-bulk-statements
```

### Deployment

Functions are automatically deployed when code is pushed. No manual deployment required.