

# Fix: Percentage Share Normalization in Bulk Upload

## The Problem

Excel stores percentage-formatted cells as decimals internally. A cell displaying **70%** is stored as **0.70** in the file. When `XLSX.utils.sheet_to_json()` reads it, it returns `0.70`, not `70`. The system's `ownership_percentage` column uses a 0-100 scale, so `0.70` gets stored directly -- showing as 0.70% instead of 70%.

## The Rule

In `bulkUploadUtils.ts`, after parsing the raw share value, apply this normalization:

1. If the parsed value is between 0 and 1 (exclusive of both endpoints being exactly 0 or 1 is ambiguous, but 1.0 could mean 1% or 100%), treat values **<= 1.0** as Excel-decimal format and multiply by 100
2. If the value is already > 1 (e.g., `70`), assume it is already in percentage scale and use as-is
3. Edge case: a value of exactly `1.0` should be treated as 100% (since 1% ownership is rare and would typically be written as `1` in a non-percentage-formatted cell)

Concretely:

```
if share > 0 and share <= 1 → share = share * 100
```

## Changes

**File: `src/components/admin/subaccount/bulkUploadUtils.ts`**

Update the `extractWriter` function (around line 100-101) and the `extractInlineWriters` function (around line 125) to normalize the share value after parsing:

```
const shareRaw = parseFloat(String(...)) || 0;
const share = (shareRaw > 0 && shareRaw <= 1) ? shareRaw * 100 : shareRaw;
```

This single change applies to both PAQ-style grouped rows and flat inline writer columns, fixing all upload paths.

## Why This Is Safe

- A share of `0.70` becomes `70` (correct)
- A share of `70` stays `70` (correct)
- A share of `0.50` becomes `50` (correct)  
- A share of `1.0` becomes `100` (correct -- sole writer)
- A share of `0` stays `0` (correct -- no share)
- Backward compatible with uploads that already use whole numbers

