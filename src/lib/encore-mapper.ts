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

// Default ENCORE mapping configuration
export const DEFAULT_ENCORE_MAPPING: EncoreMapping = {
  'Work ID': {
    BMI: 'Work ID',
    ASCAP: 'Work Number',
    YouTube: '',
    SoundExchange: 'ISRC',
  },
  'Song Title': {
    BMI: 'Work Title',
    ASCAP: 'Title',
    YouTube: 'Asset Title',
    SoundExchange: 'Sound Recording Title',
  },
  'ISWC': {
    BMI: 'ISWC',
    ASCAP: 'ISWC',
    YouTube: '',
    SoundExchange: '',
  },
  'Client Name': {
    BMI: 'IP Name',
    ASCAP: 'Writer Name',
    YouTube: 'Channel Name',
    SoundExchange: 'Featured Artist',
  },
  'Client Role': {
    BMI: 'IP Role',
    ASCAP: 'Role',
    YouTube: 'Owner',
    SoundExchange: 'Artist Type',
  },
  'Source': {
    BMI: 'Source',
    ASCAP: 'Source',
    YouTube: 'Platform',
    SoundExchange: 'Service',
  },
  'Royalty Type': {
    BMI: 'Performance Type',
    ASCAP: 'Survey',
    YouTube: 'Revenue Type',
    SoundExchange: 'Royalty Type',
  },
  'Share %': {
    BMI: 'Share %',
    ASCAP: 'Writer Share',
    YouTube: 'Share',
    SoundExchange: 'Share Percentage',
  },
  'Gross Amount': {
    BMI: ['Current Quarter Royalties', 'Amount', 'Royalty', 'Payment', 'Total Amount', 'Quarter Royalties'],
    ASCAP: ['Amount Paid', 'Amount', 'Royalty', 'Payment', 'Total', 'Total Amount', 'Quarter Royalties'],
    YouTube: 'Earnings',
    SoundExchange: 'Royalty',
  },
  'Period Start': {
    BMI: 'Period',
    ASCAP: 'Start Date',
    YouTube: 'Revenue Start',
    SoundExchange: 'Usage Period Start',
  },
  'Period End': {
    BMI: 'Period',
    ASCAP: 'End Date',
    YouTube: 'Revenue End',
    SoundExchange: 'Usage Period End',
  },
  'Payment Date': {
    BMI: 'Payment Date',
    ASCAP: 'Payment Date',
    YouTube: 'Payment Date',
    SoundExchange: 'Distribution Date',
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

      // Validate required fields
      const requiredFields = ['Song Title', 'Client Name', 'Gross Amount'];
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
      case 'Gross Amount':
        // Remove currency symbols and convert to number
        const cleanAmount = stringValue.replace(/[$,€£¥]/g, '');
        const numValue = parseFloat(cleanAmount);
        return isNaN(numValue) ? 0 : numValue;

      case 'Share %':
        // Handle percentage values
        const cleanPercent = stringValue.replace(/%/g, '');
        const percentValue = parseFloat(cleanPercent);
        return isNaN(percentValue) ? 0 : percentValue;

      case 'Period Start':
        // Special handling for BMI Period extraction
        if (detectedSource === 'BMI') {
          return this.extractBMIPeriodStart(stringValue);
        }
        // Fall through to date normalization for other sources
        return this.normalizeDate(stringValue);

      case 'Period End':
      case 'Payment Date':
        // Normalize date formats
        return this.normalizeDate(stringValue);

      case 'Song Title':
      case 'Client Name':
        // Clean up text fields
        return stringValue.replace(/\s+/g, ' ').trim();

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

      // Validate year and quarter
      const yearNum = parseInt(year);
      const quarterNum = parseInt(quarter);

      if (isNaN(yearNum) || isNaN(quarterNum) || quarterNum < 1 || quarterNum > 4) {
        return null;
      }

      // Calculate Period Start based on quarter
      switch (quarterNum) {
        case 1:
          return `${year}-01-01`;
        case 2:
          return `${year}-04-01`;
        case 3:
          return `${year}-07-01`;
        case 4:
          return `${year}-10-01`;
        default:
          return null;
      }
    } catch (error) {
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