

## Problem Analysis

Two issues:

1. **"Apply Crop" button silently fails** — The `handleConfirm` function returns early if `croppedAreaPixels` is `null`. When re-cropping an existing image (especially a data URL from fetch), `react-easy-crop` may not fire `onCropComplete` until the user actually moves/zooms the crop. So if a user opens the modal and immediately clicks "Apply Crop" without adjusting anything, nothing happens.

2. **Padding is confusing and counterproductive** — You're right: adding padding *shrinks* the logo by adding transparent space around it. You want the opposite — a way to make the logo **bigger** to match the ENCORE logo dimensions. The padding slider is working against your goal.

## Plan

### 1. Fix "Apply Crop" button
- Remove the `if (!croppedAreaPixels) return` guard
- Instead, if `croppedAreaPixels` is null, fall back to cropping the entire image (full dimensions)
- Add a loading/disabled state to the button during processing
- Add try/catch with a toast error message so failures are visible

### 2. Replace "Padding" with "Scale" slider
- Remove the padding slider and all padding logic
- Replace with a **Scale** slider (range: 50%–100%, default 100%)
- 100% = logo fills the entire 512×512 frame (what you want to match ENCORE)
- Lower values = logo appears smaller within the frame
- Update `getCroppedImg` to use scale instead of padding (mathematically similar but the mental model is inverted — higher = bigger)
- Update the label and description to be intuitive: "Scale (100% = full size)"

### Files to Edit
- `src/components/admin/subaccount/LogoCropper.tsx` — both fixes

