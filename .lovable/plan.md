

## Plan: Enhanced Whitelabel — Remove ENCORE Branding, Add Color Picker, Sub-account Logo in Emails

### Summary

Three changes: (1) hide all "Powered by ENCORE" references when whitelabel branding is active, (2) replace raw HSL text inputs with a native color picker for precise color matching, and (3) pass the sub-account's logo into outgoing emails so they display the sub-account brand instead of the ENCORE logo.

---

### 1. Remove "Powered by ENCORE" When Whitelabel Is Active

**Files to edit:**

- **`src/components/ClientPortal.tsx`** (~line 368): Conditionally hide the "Powered by ENCORE" text. Only show it when `branding` is null (i.e., no whitelabel). Currently it shows *because* branding exists — invert the logic to remove it entirely when whitelabel is on.

- **`src/components/admin/subaccount/SubAccountBranding.tsx`** (~line 308): Remove the static "Powered by ENCORE" from the preview card. The preview should reflect what clients actually see — just the sub-account logo and name, no ENCORE mention.

- **`src/components/catalog-audit/slides/IntroSlide.tsx`** (~line 96): Make the "Powered by ENCORE's Integrated Rights Management Platform" line conditional — hide it when the user's company has whitelabel branding enabled (consume `useCompanyBranding` hook).

- **`src/components/LiveChatInterface.tsx`** (~line 239): Make the "Powered by ENCORE AI Support" footer conditional on whitelabel status.

### 2. Add Native Color Picker to Branding Configuration

**File to edit: `src/components/admin/subaccount/SubAccountBranding.tsx`**

Replace the raw HSL text `<Input>` fields for Primary, Accent, and Header Background with a dual-input approach:
- Add an `<input type="color">` (native browser color picker) alongside each HSL text input
- Convert between hex (for the picker) and HSL (stored value) using helper functions
- The color picker provides visual selection; the text input allows precise HSL entry
- Both stay in sync — changing one updates the other

Helper functions needed (inline or small utility):
- `hslStringToHex(hsl: string): string` — parse "H S% L%" to `#rrggbb`
- `hexToHslString(hex: string): string` — convert `#rrggbb` to "H S% L%"

Also apply the same enhancement to **`src/components/whitelabel/BrandConfigurationPanel.tsx`** for the enterprise-level brand colors section.

### 3. Sub-account Logo in Outgoing Emails

**File to edit: `supabase/functions/_shared/email-templates.ts`**

Modify the `emailLayout` function to accept an optional `logoUrl` parameter. When provided:
- Replace the hardcoded `LOGO_WITH_TITLE` image in the hero header with the sub-account's logo
- Replace the `LOGO_ICON` in the footer with the sub-account's logo (smaller size)
- Hide the "ANALOG SOUL. DIGITAL SPINE." badge and "RIGHTS MANAGEMENT SYSTEMS" pill
- Replace "Encore Music Technology" footer text with a generic or configurable company name

All template builder functions (`welcomeEmail`, `clientInvitationEmail`, etc.) will accept optional `brandLogoUrl` and `brandName` parameters and pass them through to `emailLayout`.

**Edge functions that send emails** (the callers) need to resolve the sub-account's branding before calling the template. Key files:

- **`supabase/functions/send-client-invitation/index.ts`**: Look up the inviting company's `settings.branding.logo_url` from the `companies` table and pass it to the template.
- **`supabase/functions/client-invitation-lifecycle/index.ts`**: Same lookup pattern.
- **`supabase/functions/send-invitation-reminder/index.ts`**: Same.
- Other email-sending functions: Add the same optional branding passthrough.

The lookup pattern in each edge function:
```text
1. Get company_id from the invitation/context
2. Query companies.settings where id = company_id
3. Extract settings.branding.logo_url and settings.branding.display_name
4. Pass to template as brandLogoUrl / brandName
5. Fall back to ENCORE defaults when branding is null/disabled
```

### Technical Details

**HSL ↔ Hex conversion** (for the color picker):
- Parse HSL string "220 90% 56%" → H=220, S=0.9, L=0.56
- Use standard HSL-to-RGB math → convert to hex
- Reverse for hex-to-HSL

**Email template `emailLayout` signature change:**
```text
emailLayout(opts: {
  ...existing params...
  brandLogoUrl?: string;   // sub-account logo, replaces ENCORE logo
  brandName?: string;      // sub-account name, replaces "ENCORE" text
})
```

When `brandLogoUrl` is provided, the hero section renders only the custom logo (no ENCORE tagline/badges), and the footer shows the brand name instead of "Encore Music Technology."

