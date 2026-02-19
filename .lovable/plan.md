# Create "Getting Started" Email with Screenshots

## Overview

Create a new email template and edge function for sending a "Getting Started" guide to sub-account teams (like PAQ Publishing). The email walks recipients through uploading contracts and works via the Operations tab, with embedded screenshots from the live platform. This email is automatically triggered once when a subaccount reaches Phase 4 of the onboarding process and distributed to all Admin users of the subaccount.

## Image Hosting Strategy

The uploaded screenshots have been copied to `public/lovable-uploads/`. Once published, they will be accessible at the production domain. The email will reference them via the published URL (`https://www.encoremusic.tech/lovable-uploads/...`), matching the pattern used for `HERO_BG`.

The 4 screenshots map to:

1. **Active Contracts list** (`subaccount-contracts-list.png`) - image-190
2. **Upload Contract** (`subaccount-contract-upload.png`) - image-191
3. **AI Analysis** (`subaccount-contract-analysis.png`) - image-192
4. **Works Upload** (`subaccount-works-upload.png`) - image-193

## Changes

### 1. New email template in `supabase/functions/_shared/email-templates.ts`

Add template #13: `gettingStartedOperationsEmail`

Parameters:

- `recipientName` (string) -- e.g. "PAQ Publishing Team"
- `companyName` (string) -- e.g. "PAQ Publishing"

The email body follows the user's revised copy exactly, structured as:

- Greeting and intro paragraph
- **Step 1: Upload Your Contracts** -- numbered instructions with two embedded screenshots (Upload Contract view + AI Analysis view)
- Paragraph about team review and PDF storage
- **Step 2: Upload Your Works** -- numbered instructions with one embedded screenshot (Works Upload view)
- **Why This Matters** section with bullet points
- CTA button linking to `https://www.encoremusic.tech/dashboard/operations`
- Reply-to support link

Screenshots will be rendered as full-width images (max 520px) with rounded corners and subtle borders, placed inline after the relevant step descriptions.

### 2. New edge function: `supabase/functions/send-getting-started-operations/index.ts`

A simple edge function that:

- Accepts `{ user_email, recipient_name, company_name }` in the POST body
- Calls `gettingStartedOperationsEmail()` from shared templates
- Sends via `sendGmail()` with subject: "Getting Started -- Submitting Your Contracts & Works on ENCORE"
- From: "Encore Music"

Follows the same pattern as `send-catalog-valuation-onboarding`.

## Technical Details

### Email Template Structure

- Uses the existing `emailLayout()` wrapper for consistent ENCORE branding (hero image, logo, footer)
- Header title: "Getting Started with Operations"
- Header subtitle: "Submit your contracts and works"
- Screenshots embedded as `<img>` tags with URLs pointing to `https://www.encoremusic.tech/lovable-uploads/subaccount-*.png`
- Each screenshot wrapped in a styled container with border-radius, border, and margin for visual polish
- Step numbers styled as colored circles matching the primary accent color

### Edge Function

- Standard CORS headers
- Supabase client for optional logging
- Error handling matching existing patterns