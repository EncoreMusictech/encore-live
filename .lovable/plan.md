

# Upgrade Sub-Account Contract Upload to Match Main Contract Upload

## Overview
The sub-account contract upload (`SubAccountContractUpload`) currently has a simplified parsing flow with a basic form. The main contract management upload (`ContractUpload`) has a much richer post-parse experience including OCR fallback, confidence-based auto-population, and a tabbed review interface with PDF preview and full analysis. This plan aligns the sub-account version with the main tool.

## What Changes

### 1. Add OCR Fallback for Scanned PDFs
The main tool falls back to Tesseract.js OCR when extracted text is too short (< 200 chars). The sub-account version currently skips this entirely. We will port the OCR fallback logic from `ContractUpload.extractTextClientside`.

### 2. Add Rich Data Transformation
Port the `transformParsedData` function that normalizes raw edge function output into a structured `ParsedContractData` shape (parties with contact info, financial terms with royalty rates, key dates, works covered, payment terms, recoupment status, termination clauses, additional terms).

### 3. Replace Simple Form with Tabbed Review Interface
After parsing, instead of a flat form, show:
- **Status header card** with confidence badge (matching the main tool's green/yellow/red styling)
- **Contract Details tab** -- editable fields (title, counterparty, type, dates, advance, commission, post-term) plus auto-populated notes
- **PDF Preview tab** -- reuse the existing `PDFViewer` component
- **Full Analysis tab** -- reuse the existing `ContractDetailsView` component

### 4. Add Auto-Populator Flow
Reuse `ContractAutoPopulator` component:
- Confidence >= 0.6: auto-populate fields directly
- Confidence 0.4-0.6: show the auto-populator card for user confirmation
- Below 0.4: show form for manual entry

### 5. Preserve Sub-Account-Specific Logic
Keep the `client_company_id` attribution, post-term collection fields, and `useContracts` hook for saving -- these are unique to the sub-account flow and must remain.

## Technical Details

### File: `src/components/admin/subaccount/SubAccountContractUpload.tsx`

**Imports to add:**
- `ContractAutoPopulator` from `@/components/contracts/ContractAutoPopulator`
- `ContractDetailsView` from `@/components/contracts/ContractDetailsView`
- `PDFViewer` from `@/components/contracts/PDFViewer`
- `Tabs, TabsContent, TabsList, TabsTrigger` from `@/components/ui/tabs`
- `Textarea` from `@/components/ui/textarea`
- `Separator` from `@/components/ui/separator`

**State additions:**
- `rawParsedData` -- store raw edge function response for ContractDetailsView
- `showAutoPopulator` -- toggle auto-populator card
- `autoPopulatedData` -- store auto-populated form values
- `notes` -- free-text notes field
- `transformedData` -- the structured ParsedContractData

**extractTextClientside enhancement:**
- Add the text-length check (>= 200 chars threshold)
- Add Tesseract.js OCR fallback for scanned PDFs (first 2 pages rendered to canvas)

**Post-parse flow update:**
- Call `transformParsedData` on raw results (same logic as main tool)
- Build form data object with derived title, notes (payment terms, recoupment, termination, delivery info)
- Route to auto-populator or direct auto-populate based on confidence threshold

**Review UI replacement:**
- Replace the current flat grid form with the tabbed interface:
  - Tab 1 "Contract Details": editable fields (title, counterparty, type, dates, advance, commission, post-term card, notes textarea) + save/cancel buttons
  - Tab 2 "PDF Preview": `<PDFViewer>` component
  - Tab 3 "Full Analysis": `<ContractDetailsView>` component showing raw parsed data

**Save logic:**
- Remains the same (using `createContract` with `client_company_id`), but additionally stores `notes` and richer `financial_terms` from the transformed data

