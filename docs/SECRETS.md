# Environment Secrets Configuration

This document lists all the secrets required for the ENCORE platform to function properly.

## Supabase Secrets

These secrets should be configured in the [Supabase Edge Functions Secrets](https://supabase.com/dashboard/project/plxsenykjisqutxcvjeg/settings/functions) dashboard.

### Core Secrets

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for admin operations | ✅ Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI-powered features (chatbot, contract parsing) | ✅ Yes |
| `RESEND_API_KEY` | Resend API key for sending transactional emails | ✅ Yes |

### MLC Integration Secrets

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `MLC_USERNAME` | MLC API username (email) | ✅ Yes |
| `MLC_PASSWORD` | MLC API password | ✅ Yes |
| `MLC_CLIENT_ID` | MLC OAuth client ID | Optional |
| `MLC_CLIENT_SECRET` | MLC OAuth client secret | Optional |

> **Note:** The MLC API uses the `idToken` (not `accessToken`) as the Bearer token for authentication.

### DocuSign Integration Secrets

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `DOCUSIGN_INTEGRATION_KEY` | DocuSign integration/client key | ✅ Yes |
| `DOCUSIGN_ACCOUNT_ID` | DocuSign account ID | ✅ Yes |
| `DOCUSIGN_SECRET_KEY` | DocuSign private key (RSA) for JWT authentication | ✅ Yes |
| `DOCUSIGN_USER_ID` | DocuSign user ID for impersonation | ✅ Yes |

### Music Data Provider Secrets

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `CHARTMETRIC_API_KEY` | Chartmetric API key for music analytics | Optional |
| `SOUNDCHARTS_API_KEY` | Soundcharts API key | Optional |
| `SOUNDCHARTS_APP_ID` | Soundcharts application ID | Optional |

## How to Configure

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard/project/plxsenykjisqutxcvjeg/settings/functions)
2. Navigate to **Project Settings** → **Edge Functions**
3. Click on **Secrets** section
4. Add or update each secret with its corresponding value

## Security Notes

- Never commit secret values to version control
- Rotate secrets periodically
- Use strong, unique values for each secret
- Keep a secure backup of your secrets
