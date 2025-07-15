import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

// BMI field mapping configuration
export const BMI_FIELD_MAPPINGS = {
  // Core mappings from BMI to ENCORE
  fields: {
    'Work Title': 'songTitle',
    'BMI Work #': 'originalBMIWorkId', 
    'ISWC': 'iswc',
    'Interested Parties (IP Names)': 'clientName',
    'Share %': 'sharePercentage',
    'Role': 'clientRole',
    'Source Code': 'source',
    'Usage Type': 'royaltyType',
    'Period': 'period',
    'Amount Paid': 'grossRoyaltyAmount',
    'Payment Date': 'paymentDate'
  },
  
  // Source code mappings
  sourceCodes: {
    'R': 'Radio',
    'D': 'Digital', 
    'T': 'Television',
    'L': 'Live Performance',
    'S': 'Streaming',
    'G': 'General Licensing',
    'C': 'Commercial',
    'B': 'Background Music',
    'F': 'Feature Film',
    'V': 'Video',
    'W': 'Website',
    'M': 'Mobile',
    'I': 'Interactive',
    'N': 'Network',
    'U': 'Unknown'
  },
  
  // Usage type mappings
  usageTypes: {
    'Performance': 'Performance',
    'Mechanical': 'Mechanical',
    'Synchronization': 'Sync',
    'Digital Performance': 'Digital Performance', 
    'Streaming Mechanical': 'Streaming Mechanical',
    'Download Mechanical': 'Download Mechanical',
    'Interactive': 'Interactive',
    'Reproduction': 'Mechanical',
    'Public Performance': 'Performance'
  },
  
  // Role mappings
  roles: {
    'Author': 'Writer',
    'Composer': 'Writer', 
    'Writer': 'Writer',
    'Publisher': 'Publisher',
    'Sub-Publisher': 'Publisher',
    'Administrator': 'Publisher',
    'Original Publisher': 'Publisher'
  }
};

export interface BMIImportStats {
  totalProcessed: number;
  successfulMappings: number;
  failedMappings: number;
  duplicatesFound: number;
  newWorksCreated: number;
  newClientsCreated: number;
  totalAmount: number;
}

export function useBMIImport() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importStats, setImportStats] = useState<BMIImportStats | null>(null);

  const validateBMIData = (data: any[]): { valid: any[], invalid: any[], errors: string[] } => {
    const valid: any[] = [];
    const invalid: any[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      const rowErrors: string[] = [];

      // Required field validation
      if (!row['Work Title']?.trim()) {
        rowErrors.push('Missing Work Title');
      }
      if (!row['BMI Work #']?.trim()) {
        rowErrors.push('Missing BMI Work #');
      }
      if (!row['Amount Paid'] || isNaN(parseFloat(row['Amount Paid']))) {
        rowErrors.push('Invalid Amount Paid');
      }
      if (!row['Interested Parties (IP Names)']?.trim()) {
        rowErrors.push('Missing Interested Parties');
      }

      // Data type validation
      if (row['Share %'] && isNaN(parseFloat(row['Share %']))) {
        rowErrors.push('Invalid Share %');
      }

      if (rowErrors.length === 0) {
        valid.push(row);
      } else {
        invalid.push({ ...row, _rowIndex: index + 2 });
        errors.push(`Row ${index + 2}: ${rowErrors.join(', ')}`);
      }
    });

    return { valid, invalid, errors };
  };

  const normalizePeriod = (period: string): { start: string, end: string } => {
    // Handle various BMI period formats
    const formats = [
      /(\d{1,2})\/(\d{4})/, // MM/YYYY or M/YYYY
      /(\d{4})-(\d{1,2})/, // YYYY-MM or YYYY-M
      /Q(\d)[\s-](\d{4})/, // Q1 2024 or Q1-2024
      /(\d{4})/, // Just year
    ];

    for (const format of formats) {
      const match = period.match(format);
      if (match) {
        if (format === formats[0]) { // MM/YYYY
          const [, month, year] = match;
          const startDate = `${year}-${month.padStart(2, '0')}-01`;
          const endDate = new Date(parseInt(year), parseInt(month), 0);
          return {
            start: startDate,
            end: endDate.toISOString().split('T')[0]
          };
        } else if (format === formats[1]) { // YYYY-MM
          const [, year, month] = match;
          const startDate = `${year}-${month.padStart(2, '0')}-01`;
          const endDate = new Date(parseInt(year), parseInt(month), 0);
          return {
            start: startDate,
            end: endDate.toISOString().split('T')[0]
          };
        } else if (format === formats[2]) { // Quarter
          const [, quarter, year] = match;
          const quarterStart = ['01', '04', '07', '10'][parseInt(quarter) - 1];
          const quarterEnd = ['03', '06', '09', '12'][parseInt(quarter) - 1];
          return {
            start: `${year}-${quarterStart}-01`,
            end: `${year}-${quarterEnd}-${quarterEnd === '02' ? '28' : quarterEnd === '04' || quarterEnd === '06' || quarterEnd === '09' ? '30' : '31'}`
          };
        } else if (format === formats[3]) { // Just year
          const [, year] = match;
          return {
            start: `${year}-01-01`,
            end: `${year}-12-31`
          };
        }
      }
    }

    // Default fallback
    const currentYear = new Date().getFullYear();
    return {
      start: `${currentYear}-01-01`,
      end: `${currentYear}-12-31`
    };
  };

  const cleanAndTransformData = (validData: any[]) => {
    return validData.map(row => {
      const period = normalizePeriod(row['Period'] || '');
      
      // Map source code
      const sourceCode = row['Source Code']?.toString().toUpperCase();
      const mappedSource = BMI_FIELD_MAPPINGS.sourceCodes[sourceCode as keyof typeof BMI_FIELD_MAPPINGS.sourceCodes] || sourceCode || 'Other';
      
      // Map usage type
      const usageType = row['Usage Type']?.toString();
      const mappedRoyaltyType = BMI_FIELD_MAPPINGS.usageTypes[usageType as keyof typeof BMI_FIELD_MAPPINGS.usageTypes] || usageType || 'Performance';
      
      // Map role
      const role = row['Role']?.toString();
      const mappedRole = BMI_FIELD_MAPPINGS.roles[role as keyof typeof BMI_FIELD_MAPPINGS.roles] || role || 'Writer';

      // Parse and format payment date
      let paymentDate = new Date().toISOString().split('T')[0];
      if (row['Payment Date']) {
        try {
          const parsed = new Date(row['Payment Date']);
          if (!isNaN(parsed.getTime())) {
            paymentDate = parsed.toISOString().split('T')[0];
          }
        } catch (e) {
          // Keep default date if parsing fails
        }
      }

      return {
        workId: `BMI-${row['BMI Work #']}`, // Will be updated during matching
        songTitle: row['Work Title']?.toString().trim() || '',
        iswc: row['ISWC']?.toString().trim() || '',
        clientName: row['Interested Parties (IP Names)']?.toString().trim() || '',
        clientRole: mappedRole,
        sharePercentage: parseFloat(row['Share %']?.toString() || '0'),
        source: mappedSource,
        royaltyType: mappedRoyaltyType,
        grossRoyaltyAmount: parseFloat(row['Amount Paid']?.toString() || '0'),
        periodStart: period.start,
        periodEnd: period.end,
        statementSource: 'BMI',
        paymentDate,
        originalBMIWorkId: row['BMI Work #']?.toString().trim() || '',
        originalSourceCode: sourceCode,
        originalUsageType: usageType,
        originalRole: role,
        matchStatus: 'unmatched' as const,
        matchDetails: 'Pending matching process'
      };
    });
  };

  const processImport = async (
    rawData: any[], 
    onProgress?: (progress: number) => void,
    onValidationComplete?: (stats: { valid: number, invalid: number, errors: string[] }) => void
  ) => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Step 1: Validate data
      onProgress?.(10);
      const { valid, invalid, errors } = validateBMIData(rawData);
      
      onValidationComplete?.({
        valid: valid.length,
        invalid: invalid.length,
        errors
      });

      if (valid.length === 0) {
        throw new Error('No valid data found to process');
      }

      // Step 2: Clean and transform data
      onProgress?.(30);
      const transformedData = cleanAndTransformData(valid);

      // Step 3: Calculate statistics
      onProgress?.(50);
      const stats: BMIImportStats = {
        totalProcessed: transformedData.length,
        successfulMappings: transformedData.length,
        failedMappings: invalid.length,
        duplicatesFound: 0, // TODO: Implement duplicate detection
        newWorksCreated: 0, // TODO: Calculate based on matching
        newClientsCreated: 0, // TODO: Calculate based on matching
        totalAmount: transformedData.reduce((sum, row) => sum + row.grossRoyaltyAmount, 0)
      };

      onProgress?.(100);
      setImportStats(stats);

      toast({
        title: "Import Processing Complete",
        description: `Successfully processed ${stats.successfulMappings} of ${rawData.length} rows`,
      });

      return {
        transformedData,
        stats,
        errors: invalid.length > 0 ? errors : []
      };

    } catch (error) {
      toast({
        title: "Import Processing Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const resetImport = () => {
    setProgress(0);
    setImportStats(null);
    setIsProcessing(false);
  };

  return {
    isProcessing,
    progress,
    importStats,
    processImport,
    resetImport,
    validateBMIData,
    cleanAndTransformData,
    BMI_FIELD_MAPPINGS
  };
}
