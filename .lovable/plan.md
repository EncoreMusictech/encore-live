

# Gmail API Integration for Email Sending

## Overview
Replace the current Resend-based email system with Gmail API using a Google Workspace Service Account. All existing HTML templates will be preserved, with dynamic merge fields like `{{user.Name}}` replaced at send time.

## What You Need to Provide

1. **Google Cloud Console setup:**
   - Create a project at console.cloud.google.com
   - Enable the **Gmail API**
   - Create a **Service Account** with domain-wide delegation
   - In Google Workspace Admin (admin.google.com), grant the service account the scope `https://www.googleapis.com/auth/gmail.send`
   - Download the **Service Account JSON key file**

2. **Sender email address** (e.g., `noreply@encoremusic.tech`) -- this must be a real mailbox or alias in your Google Workspace that the service account is authorized to impersonate

## Implementation Steps

### Step 1: Store Secrets in Supabase
Store three secrets:
- `GOOGLE_SERVICE_ACCOUNT_JSON` -- the full JSON key file contents
- `GMAIL_SENDER_EMAIL` -- e.g., `noreply@encoremusic.tech`

### Step 2: Create a Shared Gmail Sender Utility
Create a reusable helper at `supabase/functions/gmail-send/index.ts` that:
- Generates a JWT from the service account credentials
- Exchanges it for a Google OAuth2 access token
- Calls the Gmail API `users.messages.send` endpoint
- Accepts HTML body, subject, recipient, and merge variables
- Replaces `{{variable}}` placeholders with provided values

```text
Flow:
  Edge Function receives (to, subject, html_template, merge_vars)
      |
      v
  Load Service Account JSON from env
      |
      v
  Create JWT (iss=service_account_email, sub=sender_email, scope=gmail.send)
      |
      v
  POST to https://oauth2.googleapis.com/token to get access_token
      |
      v
  Build RFC 2822 MIME message with HTML content
      |
      v
  Base64url encode the message
      |
      v
  POST to https://gmail.googleapis.com/gmail/v1/users/me/messages/send
      |
      v
  Return success/error
```

### Step 3: Create HTML Template Files
Store templates as constants or in a templates module within the edge function:
- **Welcome** -- sent when a new user is created
- **Invitation** -- sent for client portal invitations
- **Support Ticket Confirmation** -- sent to customers after submitting a ticket
- **Support Ticket Internal** -- sent to the support team
- **Onboarding** -- sent for module onboarding (catalog valuation, etc.)
- **Contract Email** -- sent when sharing contracts
- **Reminder** -- invitation expiry reminders

Each template uses merge fields: `{{user.Name}}`, `{{company.Name}}`, `{{action.Url}}`, etc.

### Step 4: Update Existing Edge Functions
Modify these 5 edge functions to call the Gmail sender instead of Resend:

| Function | Current Status | Change |
|----------|---------------|--------|
| `send-client-invitation` | Uses Resend | Switch to Gmail API |
| `send-support-ticket` | Uses Resend | Switch to Gmail API |
| `get-user-details` | Uses Resend (welcome email) | Switch to Gmail API |
| `send-contract-email` | Resend disabled | Reactivate with Gmail API |
| `client-invitation-lifecycle` | Resend disabled | Reactivate with Gmail API |
| `send-catalog-valuation-onboarding` | Resend disabled | Reactivate with Gmail API |

### Step 5: Remove Resend Dependency
Remove all `import { Resend }` and `RESEND_API_KEY` references from edge functions.

## Technical Details

**JWT signing in Deno:** The service account JSON contains an RSA private key. The edge function will:
1. Parse the PEM key using Deno's `crypto.subtle.importKey`
2. Create a JWT with claims: `iss`, `sub` (sender email), `aud` (token endpoint), `scope` (gmail.send), `iat`, `exp`
3. Sign with RS256

**MIME message construction:** Build a raw RFC 2822 message with `Content-Type: text/html`, then base64url-encode it for the Gmail API.

**No external dependencies required** -- pure Deno crypto APIs handle JWT signing, and `fetch` handles the HTTP calls.

## Benefits
- Emails come directly from your Google Workspace account
- Full delivery tracking in Gmail "Sent" folder
- No third-party email service costs
- Better deliverability (Google Workspace reputation)
- Templates are fully customizable HTML with merge fields

