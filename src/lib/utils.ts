import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getQuarterFromDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const month = date.getMonth(); // 0-11
    const year = date.getFullYear();
    
    let quarter: number;
    if (month >= 0 && month <= 2) {
      quarter = 1; // Q1: Jan-Mar
    } else if (month >= 3 && month <= 5) {
      quarter = 2; // Q2: Apr-Jun
    } else if (month >= 6 && month <= 8) {
      quarter = 3; // Q3: Jul-Sep
    } else {
      quarter = 4; // Q4: Oct-Dec
    }
    
    return `Q${quarter} ${year}`;
  } catch (error) {
    console.error('Error parsing date for quarter calculation:', error);
    return 'N/A';
  }
}

// Standardize and build safe filenames for downloads (no extension)
export function sanitizeFileBaseName(name: string): string {
  if (!name) return 'document';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics to dashes
    .replace(/-{2,}/g, '-') // collapse multiple dashes
    .replace(/^-+|-+$/g, '') // trim dashes
    .slice(0, 120); // keep it reasonable
}

export function formatYMD(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${da}`;
}

export function buildPdfFileName(opts: { kind?: string; title?: string; id?: string | number; date?: Date | string; }): string {
  const parts: string[] = [];
  if (opts.kind) parts.push(sanitizeFileBaseName(String(opts.kind)));
  if (opts.title) parts.push(sanitizeFileBaseName(String(opts.title)));
  if (opts.id) parts.push(sanitizeFileBaseName(String(opts.id)));
  parts.push(formatYMD(opts.date));
  return parts.filter(Boolean).join('-');
}

