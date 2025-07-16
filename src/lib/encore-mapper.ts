export interface EncoreMapping {
  [encoreField: string]: {
    [source: string]: string | string[];
  };
}

export interface MappedResult {
  mappedData: Record<string, any>;
  unmappedFields: string[];
  validationErrors: string[];
}

// ENCORE Standard Field Definitions
export const ENCORE_STANDARD_FIELDS = [
  'QUARTER',
  'SOURCE', 
  'REVENUE SOURCE',
  'WORK IDENTIFIER',
  'WORK TITLE',
  'WORK WRITERS',
  'SHARE',
  'MEDIA TYPE',
  'MEDIA SUB-TYPE', 
  'COUNTRY',
  'QUANTITY',
  'GROSS',
  'NET',
  'ISWC',
  'ISRC'
] as const;

// Default ENCORE mapping configuration
export const DEFAULT_ENCORE_MAPPING: EncoreMapping = {
  'QUARTER': {
    BMI: 'Period',
    ASCAP: 'Quarter',
    YouTube: 'Period',
    SoundExchange: 'Quarter',
  },
  'SOURCE': {
    BMI: 'Source',
    ASCAP: 'Source', 
    YouTube: 'Platform',
    SoundExchange: 'Service',
  },
  'REVENUE SOURCE': {
    BMI: 'Performance Type',
    ASCAP: 'Survey',
    YouTube: 'Revenue Type',
    SoundExchange: 'Royalty Type',
  },
  'WORK IDENTIFIER': {
    BMI: 'Work ID',
    ASCAP: 'Work Number',
    YouTube: '',
    SoundExchange: '',
  },
  'WORK TITLE': {
    BMI: 'Work Title',
    ASCAP: 'Title',
    YouTube: 'Asset Title',
    SoundExchange: 'Sound Recording Title',
  },
  'WORK WRITERS': {
    BMI: 'IP Name',
    ASCAP: 'Writer Name',
    YouTube: 'Channel Name',
    SoundExchange: 'Featured Artist',
  },
  'SHARE': {
    BMI: 'Share %',
    ASCAP: 'Writer Share',
    YouTube: 'Share',
    SoundExchange: 'Share Percentage',
  },
  'MEDIA TYPE': {
    BMI: 'Media Type',
    ASCAP: 'Media Type',
    YouTube: 'Content Type',
    SoundExchange: 'Service Type',
  },
  'MEDIA SUB-TYPE': {
    BMI: 'Media Sub-Type',
    ASCAP: 'Media Sub-Type',
    YouTube: 'Content Sub-Type',
    SoundExchange: 'Service Sub-Type',
  },
  'COUNTRY': {
    BMI: 'Country',
    ASCAP: 'Territory',
    YouTube: 'Country',
    SoundExchange: 'Country',
  },
  'QUANTITY': {
    BMI: 'Performances',
    ASCAP: 'Plays',
    YouTube: 'Views',
    SoundExchange: 'Plays',
  },
  'GROSS': {
    BMI: ['Current Quarter Royalties', 'Amount', 'Royalty', 'Payment', 'Total Amount', 'Quarter Royalties'],
    ASCAP: ['Amount Paid', 'Amount', 'Royalty', 'Payment', 'Total', 'Total Amount', 'Quarter Royalties'],
    YouTube: 'Earnings',
    SoundExchange: 'Royalty',
  },
  'NET': {
    BMI: 'Net Amount',
    ASCAP: 'Net Amount',
    YouTube: 'Net Earnings',
    SoundExchange: 'Net Royalty',
  },
  'ISWC': {
    BMI: 'ISWC',
    ASCAP: 'ISWC',
    YouTube: '',
    SoundExchange: '',
  },
  'ISRC': {
    BMI: '',
    ASCAP: '',
    YouTube: 'ISRC',
    SoundExchange: 'ISRC',
  },
};

export class EncoreMapper {
  private mapping: EncoreMapping;

  constructor(customMapping?: EncoreMapping) {
    this.mapping = customMapping || DEFAULT_ENCORE_MAPPING;
  }

  mapData(sourceData: Record<string, any>[], detectedSource: string): MappedResult {
    const mappedData: Record<string, any>[] = [];
    const unmappedFields = new Set<string>();
    const validationErrors: string[] = [];

    // Get source headers from first row
    const sourceHeaders = sourceData.length > 0 ? Object.keys(sourceData[0]) : [];

    // Find unmapped fields
    sourceHeaders.forEach(header => {
      const isMapped = Object.values(this.mapping).some(sourceMap => {
        const sourceField = sourceMap[detectedSource];
        if (Array.isArray(sourceField)) {
          return sourceField.includes(header);
        }
        return sourceField === header;
      });

      if (!isMapped) {
        unmappedFields.add(header);
      }
    });

    // Map each row
    sourceData.forEach((row, index) => {
      const mappedRow: Record<string, any> = {};

      // Add standard fields
      mappedRow['Statement Source'] = detectedSource;

      // Map each ENCORE field
      Object.entries(this.mapping).forEach(([encoreField, sourceMap]) => {
        const sourceField = sourceMap[detectedSource];
        
        if (sourceField) {
          if (Array.isArray(sourceField)) {
            // Handle multiple possible source fields
            for (const field of sourceField) {
              if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
                mappedRow[encoreField] = this.normalizeValue(row[field], encoreField, detectedSource);
                break;
              }
            }
          } else if (sourceField !== '') {
            // Handle single source field
            if (row[sourceField] !== undefined) {
              mappedRow[encoreField] = this.normalizeValue(row[sourceField], encoreField, detectedSource);
            }
          }
        }
      });

      // Validate required fields using ENCORE standard fields
      const requiredFields = ['WORK TITLE', 'WORK WRITERS', 'GROSS'];
      requiredFields.forEach(field => {
        if (!mappedRow[field] || mappedRow[field] === '') {
          validationErrors.push(`Row ${index + 1}: Missing required field '${field}'`);
        }
      });

      // Add original row reference for debugging
      mappedRow['_original_row_index'] = index;

      mappedData.push(mappedRow);
    });

    return {
      mappedData,
      unmappedFields: Array.from(unmappedFields),
      validationErrors,
    };
  }

  private normalizeValue(value: any, encoreField: string, detectedSource?: string): any {
    if (value === null || value === undefined) return null;

    const stringValue = String(value).trim();
    if (stringValue === '') return null;

    switch (encoreField) {
      case 'GROSS':
      case 'NET':
        // Remove currency symbols and convert to number
        const cleanAmount = stringValue.replace(/[$,€£¥]/g, '');
        const numValue = parseFloat(cleanAmount);
        return isNaN(numValue) ? 0 : numValue;

      case 'SHARE':
      case 'QUANTITY':
        // Handle percentage and numeric values
        const cleanPercent = stringValue.replace(/%/g, '');
        const percentValue = parseFloat(cleanPercent);
        return isNaN(percentValue) ? 0 : percentValue;

      case 'QUARTER':
        // Special handling for BMI Period extraction
        if (detectedSource === 'BMI') {
          return this.extractBMIPeriodStart(stringValue);
        }
        // Fall through to date normalization for other sources
        return this.normalizeDate(stringValue);

      case 'WORK TITLE':
      case 'WORK WRITERS':
      case 'SOURCE':
      case 'REVENUE SOURCE':
      case 'MEDIA TYPE':
      case 'MEDIA SUB-TYPE':
      case 'COUNTRY':
        // Clean up text fields
        return stringValue.replace(/\s+/g, ' ').trim();

      case 'WORK IDENTIFIER':
      case 'ISWC':
      case 'ISRC':
        // Keep identifier fields as-is
        return stringValue.trim();

      default:
        return stringValue;
    }
  }

  private extractBMIPeriodStart(periodValue: string): string | null {
    if (!periodValue || periodValue.length < 5) return null;

    try {
      // Extract year (first 4 digits) and quarter (last digit)
      const year = periodValue.substring(0, 4);
      const quarter = periodValue.slice(-1);

      console.log('BMI Period extraction:', { periodValue, year, quarter });

      // Validate year and quarter
      const yearNum = parseInt(year);
      const quarterNum = parseInt(quarter);

      if (isNaN(yearNum) || isNaN(quarterNum) || quarterNum < 1 || quarterNum > 4) {
        console.log('Invalid year or quarter:', { yearNum, quarterNum });
        return null;
      }

      // Calculate Period Start based on quarter
      let periodStart: string;
      switch (quarterNum) {
        case 1:
          periodStart = `${year}-01-01`;
          break;
        case 2:
          periodStart = `${year}-04-01`;
          break;
        case 3:
          periodStart = `${year}-07-01`;
          break;
        case 4:
          periodStart = `${year}-10-01`;
          break;
        default:
          return null;
      }

      console.log('BMI Period Start calculated:', periodStart);
      return periodStart;
    } catch (error) {
      console.error('Error extracting BMI period:', error);
      return null;
    }
  }

  private normalizeDate(dateString: string): string | null {
    if (!dateString) return null;

    try {
      // Try parsing common date formats
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Try other formats like MM/DD/YYYY or DD/MM/YYYY
        const parts = dateString.split(/[\/\-\.]/);
        if (parts.length === 3) {
          // Assume MM/DD/YYYY format first
          const testDate = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
          if (!isNaN(testDate.getTime())) {
            return testDate.toISOString().split('T')[0];
          }
        }
        return dateString; // Return original if can't parse
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      return dateString; // Return original if parsing fails
    }
  }

  updateMapping(newMapping: EncoreMapping) {
    this.mapping = { ...this.mapping, ...newMapping };
  }

  getMapping(): EncoreMapping {
    return this.mapping;
  }

  getMappingForSource(source: string): Record<string, string | string[]> {
    const result: Record<string, string | string[]> = {};
    Object.entries(this.mapping).forEach(([encoreField, sourceMap]) => {
      if (sourceMap[source]) {
        result[encoreField] = sourceMap[source];
      }
    });
    return result;
  }
}