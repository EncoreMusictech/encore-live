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
