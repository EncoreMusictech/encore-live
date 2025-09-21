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

// Media Type Standardization Mapping - Based on ENCORE Media Type Lookup Table
export const MEDIA_TYPE_STANDARDIZATION: Record<string, string> = {
  // Performance types
  'PR': 'PERF',
  'Performance': 'PERF',
  'Digital - Performance': 'PERF',
  'Streaming - Performance': 'PERF',
  'Digital Download - Performance': 'PERF',
  'Writer Performance': 'PERF',
  'YouTube': 'PERF',
  'Terrestrial Radio': 'PERF',
  'Television': 'PERF',
  'PERF': 'PERF',
  
  // Mechanical types
  'N/A': 'MECH',
  'Streaming': 'MECH',
  'MECH': 'MECH',
  'Download': 'MECH',
  'Streaming - Mechanical': 'MECH',
  'Mechanical': 'MECH',
  'Digital Download - Mechanical': 'MECH',
  'Digital - Mechanical': 'MECH',
  
  // Synchronization types
  'SYNCH': 'SYNCH',
  'Synchronization': 'SYNCH',
  
  // Print types
  'PRINT': 'PRINT',
  
  // Other types
  'OTHER': 'OTHER',
};

// Source-specific media type column mappings
export const SOURCE_MEDIA_TYPE_COLUMNS: Record<string, string> = {
  'BMI': 'N/A', // BMI doesn't have a media type column
  'ASCAP (International)': 'Type Of Right',
  'ASCAP (Domestic)': 'Type Of Right', 
  'HFA (Harry Fox Agency)': 'CONFIGURATION GROUP',
  'Kobalt Music Publishing': 'RIGHT_TYPE_GROUP',
  'The Mechanical Licensing Collective (The MLC)': 'Use Type',
};

// Default ENCORE mapping configuration
export const DEFAULT_ENCORE_MAPPING: EncoreMapping = {
  'QUARTER': {
    BMI: 'PERIOD',
    ASCAP: 'Quarter',
    'ASCAP (International)': 'Quarter',
    'ASCAP (Domestic)': 'Quarter',
    YouTube: 'Period',
    SoundExchange: 'Quarter',
    'HFA (Harry Fox Agency)': 'Period',
    'Kobalt Music Publishing': 'Period',
    'The Mechanical Licensing Collective (The MLC)': 'Period',
  },
  'SOURCE': {
    BMI: 'Source',
    ASCAP: 'Source',
    'ASCAP (International)': 'Source',
    'ASCAP (Domestic)': 'Source', 
    YouTube: 'Platform',
    SoundExchange: 'Service',
    'HFA (Harry Fox Agency)': 'Source',
    'Kobalt Music Publishing': 'Source',
    'The Mechanical Licensing Collective (The MLC)': 'Source',
  },
  'REVENUE SOURCE': {
    BMI: 'PERF SOURCE',
    ASCAP: 'Survey',
    'ASCAP (International)': 'Survey',
    'ASCAP (Domestic)': 'Survey',
    YouTube: 'Revenue Type',
    SoundExchange: 'Royalty Type',
    'HFA (Harry Fox Agency)': 'License Type',
    'Kobalt Music Publishing': 'Revenue Source',
    'The Mechanical Licensing Collective (The MLC)': 'Revenue Type',
  },
  'WORK IDENTIFIER': {
    BMI: 'TITLE #',
    ASCAP: 'Work Number',
    'ASCAP (International)': 'Work Number',
    'ASCAP (Domestic)': 'Work Number',
    YouTube: '',
    SoundExchange: '',
    'HFA (Harry Fox Agency)': 'Work ID',
    'Kobalt Music Publishing': 'Work ID',
    'The Mechanical Licensing Collective (The MLC)': 'Work ID',
  },
  'WORK TITLE': {
    BMI: 'TITLE NAME',
    ASCAP: 'Title',
    'ASCAP (International)': 'Title',
    'ASCAP (Domestic)': 'Title',
    YouTube: 'Asset Title',
    SoundExchange: 'Sound Recording Title',
    'HFA (Harry Fox Agency)': 'Song Title',
    'Kobalt Music Publishing': 'Work Title',
    'The Mechanical Licensing Collective (The MLC)': 'Musical Work Title',
  },
  'WORK WRITERS': {
    BMI: 'PARTICIPANT NAME',
    ASCAP: 'Writer Name',
    'ASCAP (International)': 'Writer Name',
    'ASCAP (Domestic)': 'Writer Name',
    YouTube: 'Channel Name',
    SoundExchange: 'Featured Artist',
    'HFA (Harry Fox Agency)': 'Writer',
    'Kobalt Music Publishing': 'Writer Name',
    'The Mechanical Licensing Collective (The MLC)': 'Writer Name',
  },
  'SHARE': {
    BMI: 'PARTICIPANT %',
    ASCAP: 'Writer Share',
    'ASCAP (International)': 'Writer Share',
    'ASCAP (Domestic)': 'Writer Share',
    YouTube: 'Share',
    SoundExchange: 'Share Percentage',
    'HFA (Harry Fox Agency)': 'Share',
    'Kobalt Music Publishing': 'Share Percentage',
    'The Mechanical Licensing Collective (The MLC)': 'Share Percentage',
  },
  'MEDIA TYPE': {
    BMI: '',
    ASCAP: 'Type Of Right',
    'ASCAP (International)': 'Type Of Right',
    'ASCAP (Domestic)': 'Type Of Right',
    YouTube: 'Content Type',
    SoundExchange: 'Service Type',
    'HFA (Harry Fox Agency)': 'CONFIGURATION GROUP',
    'Kobalt Music Publishing': 'RIGHT_TYPE_GROUP',
    'The Mechanical Licensing Collective (The MLC)': 'Use Type',
  },
  'MEDIA SUB-TYPE': {
    BMI: 'Media Sub-Type',
    ASCAP: 'Media Sub-Type',
    YouTube: 'Content Sub-Type',
    SoundExchange: 'Service Sub-Type',
  },
  'COUNTRY': {
    BMI: 'COUNTRY OF PERFORMANCE',
    ASCAP: 'Territory',
    YouTube: 'Country',
    SoundExchange: 'Country',
  },
  'QUANTITY': {
    BMI: 'PERF COUNT',
    ASCAP: 'Plays',
    YouTube: 'Views',
    SoundExchange: 'Plays',
  },
  'GROSS': {
    BMI: ['CURRENT ACTIVITY AMT', 'ROYALTY AMOUNT'],
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
  private customMappings: Record<string, any> = {};

  constructor(customMapping?: EncoreMapping, savedMappings?: any[]) {
    this.mapping = customMapping || DEFAULT_ENCORE_MAPPING;
    
    // Apply saved mappings from database
    if (savedMappings) {
      savedMappings.forEach(config => {
        if (config.mapping_rules) {
          this.customMappings[config.source_name] = config.mapping_rules;
        }
      });
    }
  }

  mapData(sourceData: Record<string, any>[], detectedSource: string, userFieldMappings?: { [key: string]: string }): MappedResult {
    const mappedData: Record<string, any>[] = [];
    const unmappedFields = new Set<string>();
    const validationErrors: string[] = [];

    // Get source headers from first row
    const sourceHeaders = sourceData.length > 0 ? Object.keys(sourceData[0]) : [];

    // Apply custom mappings if available
    const effectiveMapping = this.getEffectiveMapping(detectedSource, userFieldMappings);

    // Find unmapped fields
    sourceHeaders.forEach(header => {
      const isMapped = Object.values(effectiveMapping).some(sourceField => {
        if (Array.isArray(sourceField)) {
          return sourceField.includes(header);
        }
        return sourceField === header;
      });

      // Also check if it's mapped in user field mappings
      const isUserMapped = userFieldMappings && Object.values(userFieldMappings).includes(header);

      if (!isMapped && !isUserMapped) {
        unmappedFields.add(header);
      }
    });

    // Map each row
    sourceData.forEach((row, index) => {
      const mappedRow: Record<string, any> = {};

      // Add standard fields
      mappedRow['Statement Source'] = detectedSource;

      // Map each ENCORE field using effective mapping
      Object.entries(effectiveMapping).forEach(([encoreField, sourceField]) => {
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

      // Special case: BMI always has PERF as media type (regardless of mapped value)
      if (detectedSource === 'BMI') {
        mappedRow['MEDIA TYPE'] = 'PERF';
      }

      // Apply user field mappings (these override default mappings)
      if (userFieldMappings) {
        Object.entries(userFieldMappings).forEach(([encoreField, sourceField]) => {
          if (row[sourceField] !== undefined) {
            mappedRow[encoreField] = this.normalizeValue(row[sourceField], encoreField, detectedSource);
          }
        });
      }

      // Ensure BMI always has PERF as media type after all mappings are applied
      if (detectedSource === 'BMI') {
        mappedRow['MEDIA TYPE'] = 'PERF';
      }

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
        // Clean up text fields without standardization
        return stringValue.replace(/\s+/g, ' ').trim();

      case 'SOURCE':
      case 'REVENUE SOURCE':
      case 'MEDIA TYPE':
        // Apply media type standardization
        const cleanMediaType = stringValue.replace(/\s+/g, ' ').trim();
        return this.standardizeMediaType(cleanMediaType, detectedSource);
        
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

  getEffectiveMapping(detectedSource: string, userFieldMappings?: { [key: string]: string }): Record<string, string | string[]> {
    // Start with custom mappings from database if available
    const customMapping = this.customMappings[detectedSource] || {};
    
    // Apply default mappings
    const effectiveMapping: Record<string, string | string[]> = {};
    Object.entries(this.mapping).forEach(([encoreField, sourceMap]) => {
      if (sourceMap[detectedSource]) {
        effectiveMapping[encoreField] = sourceMap[detectedSource];
      }
    });

    // Override with custom mappings from database
    Object.entries(customMapping).forEach(([encoreField, sourceField]) => {
      if (sourceField && (typeof sourceField === 'string' || Array.isArray(sourceField))) {
        effectiveMapping[encoreField] = sourceField;
      }
    });

    // Override with user field mappings (highest priority)
    if (userFieldMappings) {
      Object.entries(userFieldMappings).forEach(([encoreField, sourceField]) => {
        if (sourceField) {
          effectiveMapping[encoreField] = sourceField;
        }
      });
    }

    return effectiveMapping;
  }

  private standardizeMediaType(mediaType: string, detectedSource?: string): string {
    // First check direct mapping
    if (MEDIA_TYPE_STANDARDIZATION[mediaType]) {
      return MEDIA_TYPE_STANDARDIZATION[mediaType];
    }
    
    // For BMI, since they don't have a media type column, default to PERF
    if (detectedSource === 'BMI') {
      return 'PERF';
    }
    
    // Case-insensitive matching for edge cases
    const upperMediaType = mediaType.toUpperCase();
    const standardKeys = Object.keys(MEDIA_TYPE_STANDARDIZATION).map(k => k.toUpperCase());
    const matchingKey = standardKeys.find(key => key === upperMediaType);
    
    if (matchingKey) {
      const originalKey = Object.keys(MEDIA_TYPE_STANDARDIZATION)[standardKeys.indexOf(matchingKey)];
      return MEDIA_TYPE_STANDARDIZATION[originalKey];
    }
    
    // Default to OTHER for unrecognized types
    return 'OTHER';
  }

  saveMapping(detectedSource: string, userFieldMappings: { [key: string]: string }) {
    // Store in local custom mappings
    this.customMappings[detectedSource] = { ...this.customMappings[detectedSource], ...userFieldMappings };
    return this.customMappings[detectedSource];
  }
}