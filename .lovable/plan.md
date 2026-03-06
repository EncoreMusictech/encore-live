

## Plan: Logo Upload for Sub-account Branding

### Summary
Add a file upload option alongside the existing Logo URL input in the branding configuration. Logos are stored in a new `company-logos` Supabase storage bucket, and the resulting public URL is set as the `logo_url` in branding settings.

### Changes

#### 1. Create `company-logos` storage bucket
**New migration file**

- Create a public bucket `company-logos` with image-only MIME type restrictions (PNG, JPG, SVG, WebP) and a 2MB size limit.
- RLS policies: authenticated users can upload/update/delete files in a path prefixed by the company ID, and anyone can read (public bucket).

#### 2. Add upload UI to `SubAccountBranding.tsx`
**File: `src/components/admin/subaccount/SubAccountBranding.tsx`** (~lines 189-198)

Replace the single Logo URL input with a two-option approach:
- **Upload button**: Uses a hidden `<input type="file" accept="image/*">` triggered by a button. On file select, uploads to `company-logos/{companyId}/logo.{ext}` via `supabase.storage`, gets the public URL, and sets it as `branding.logo_url`.
- **OR paste URL**: Keep the existing text input as a fallback for users who already have a hosted logo.
- Show a small preview thumbnail of the current logo (whether uploaded or URL-pasted).
- Show upload progress/loading state during the upload.

The upload path uses the `companyId` prop already available in the component, ensuring each sub-account's logo is isolated.

#### 3. Apply same upload option to `BrandConfigurationPanel.tsx`
**File: `src/components/whitelabel/BrandConfigurationPanel.tsx`**

Add the same upload capability to the enterprise-level brand configuration panel for consistency.

### Technical Details
- Storage path: `company-logos/{companyId}/logo-{timestamp}.{ext}` (timestamp avoids browser caching issues on re-upload)
- On successful upload, the public URL from `supabase.storage.from('company-logos').getPublicUrl(...)` is written into `branding.logo_url`
- No new database tables needed — the URL is stored in the existing `companies.settings.branding.logo_url` JSON field

