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
    SESAC: 'Title #',
    YouTube: '',
    SoundExchange: 'ISRC',
    'Generic PRO': ['Work ID', 'Title ID', 'Song ID'],
  },
  'Song Title': {
    BMI: 'Work Title',
    ASCAP: 'Title',
    SESAC: 'Title Name',
    YouTube: 'Asset Title',
    SoundExchange: 'Sound Recording Title',
    'Generic PRO': ['Work Title', 'Title', 'Song Title', 'Title Name'],
  },
  'ISWC': {
    BMI: 'ISWC',
    ASCAP: 'ISWC',
    SESAC: '',
    YouTube: '',
    SoundExchange: '',
    'Generic PRO': 'ISWC',
  },
  'Client Name': {
    BMI: 'IP Name',
    ASCAP: 'Writer Name',
    SESAC: 'Participant Name',
    YouTube: 'Channel Name',
    SoundExchange: 'Featured Artist',
    'Generic PRO': ['Writer Name', 'Participant Name', 'IP Name', 'Client Name'],
  },
  'Client Role': {
    BMI: 'IP Role',
    ASCAP: 'Role',
    SESAC: 'W OR P',
    YouTube: 'Owner',
    SoundExchange: 'Artist Type',
    'Generic PRO': ['Role', 'Type', 'W OR P'],
  },
  'Source': {
    BMI: 'Source',
    ASCAP: 'Source',
    SESAC: 'Perf Source',
    YouTube: 'Platform',
    SoundExchange: 'Service',
    'Generic PRO': ['Source', 'Platform', 'Service'],
  },
  'Royalty Type': {
    BMI: 'Performance Type',
    ASCAP: 'Survey',
    SESAC: 'Use Code',
    YouTube: 'Revenue Type',
    SoundExchange: 'Royalty Type',
    'Generic PRO': ['Performance Type', 'Use Code', 'Revenue Type'],
  },
  'Share %': {
    BMI: 'Share %',
    ASCAP: 'Writer Share',
    SESAC: 'Participant %',
    YouTube: 'Share',
    SoundExchange: 'Share Percentage',
    'Generic PRO': ['Share %', 'Participant %', 'Writer Share', 'Share'],
  },
  'Gross Amount': {
    BMI: ['Current Quarter Royalties', 'Amount', 'Royalty', 'Payment', 'Total Amount', 'Quarter Royalties'],
    ASCAP: ['Amount Paid', 'Amount', 'Royalty', 'Payment', 'Total', 'Total Amount', 'Quarter Royalties'],
    SESAC: ['Royalty Amount', 'Current Activity Amt'],
    YouTube: 'Earnings',
    SoundExchange: 'Royalty',
    'Generic PRO': ['Amount', 'Royalty', 'Payment', 'Total', 'Earnings'],
  },
  'Period Start': {
    BMI: 'Period',
    ASCAP: 'Start Date',
    SESAC: 'Perf Period',
    YouTube: 'Revenue Start',
    SoundExchange: 'Usage Period Start',
    'Generic PRO': ['Period', 'Start Date', 'Period Start'],
  },
  'Period End': {
    BMI: 'Period',
    ASCAP: 'End Date',
    SESAC: 'Perf Period',
    YouTube: 'Revenue End',
    SoundExchange: 'Usage Period End',
    'Generic PRO': ['Period', 'End Date', 'Period End'],
  },
  'Payment Date': {
    BMI: 'Payment Date',
    ASCAP: 'Payment Date',
    SESAC: '',
    YouTube: 'Payment Date',
    SoundExchange: 'Distribution Date',
    'Generic PRO': ['Payment Date', 'Distribution Date'],
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

    // Validate data structure
    this.validateDataStructure(sourceData, validationErrors);

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
                mappedRow[encoreField] = this.normalizeValue(row[field], encoreField);
                break;
              }
            }
          } else if (sourceField !== '') {
            // Handle single source field
            if (row[sourceField] !== undefined) {
              mappedRow[encoreField] = this.normalizeValue(row[sourceField], encoreField);
            }
          }
        }
      });

      // Perform comprehensive validation for this row
      this.validateRow(mappedRow, row, index, validationErrors);

      // Add original row reference for debugging
      mappedRow['_original_row_index'] = index;

      mappedData.push(mappedRow);
    });

    // Perform aggregate validations
    this.validateAggregateData(mappedData, validationErrors);

    return {
      mappedData,
      unmappedFields: Array.from(unmappedFields),
      validationErrors,
    };
  }

  private normalizeValue(value: any, encoreField: string): any {
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

  private validateDataStructure(sourceData: Record<string, any>[], validationErrors: string[]): void {
    // Check if data is empty
    if (sourceData.length === 0) {
      validationErrors.push('No data rows found in the statement');
      return;
    }

    // Check for duplicate header detection
    const firstRow = sourceData[0];
    const headers = Object.keys(firstRow);
    
    // Check for duplicate headers
    const uniqueHeaders = new Set(headers);
    if (uniqueHeaders.size !== headers.length) {
      validationErrors.push('Duplicate column headers detected in the data');
    }

    // Check for empty headers
    const emptyHeaders = headers.filter(header => !header || header.trim() === '');
    if (emptyHeaders.length > 0) {
      validationErrors.push(`${emptyHeaders.length} empty column headers found`);
    }

    // Check data consistency across rows
    const expectedColumns = headers.length;
    const inconsistentRows = [];
    
    sourceData.forEach((row, index) => {
      const rowColumns = Object.keys(row).length;
      if (rowColumns !== expectedColumns) {
        inconsistentRows.push(index + 1);
      }
    });

    if (inconsistentRows.length > 0) {
      validationErrors.push(`Inconsistent column count in rows: ${inconsistentRows.slice(0, 5).join(', ')}${inconsistentRows.length > 5 ? ' and more' : ''}`);
    }
  }

  private validateRow(mappedRow: Record<string, any>, originalRow: Record<string, any>, index: number, validationErrors: string[]): void {
    const rowNum = index + 1;

    // Required fields validation
    const requiredFields = ['Song Title', 'Client Name', 'Gross Amount'];
    requiredFields.forEach(field => {
      if (!mappedRow[field] || mappedRow[field] === '') {
        validationErrors.push(`Row ${rowNum}: Missing required field '${field}'`);
      }
    });

    // Amount validation
    if (mappedRow['Gross Amount'] !== undefined) {
      const amount = mappedRow['Gross Amount'];
      if (typeof amount === 'number') {
        if (amount < 0) {
          validationErrors.push(`Row ${rowNum}: Negative amount detected (${amount})`);
        }
        if (amount > 1000000) {
          validationErrors.push(`Row ${rowNum}: Unusually high amount detected (${amount}) - please verify`);
        }
      } else if (amount !== null) {
        validationErrors.push(`Row ${rowNum}: Gross Amount is not a valid number`);
      }
    }

    // Share percentage validation
    if (mappedRow['Share %'] !== undefined && mappedRow['Share %'] !== null) {
      const share = mappedRow['Share %'];
      if (typeof share === 'number') {
        if (share < 0 || share > 100) {
          validationErrors.push(`Row ${rowNum}: Share percentage (${share}%) outside valid range (0-100%)`);
        }
      }
    }

    // Date validation
    const dateFields = ['Period Start', 'Period End', 'Payment Date'];
    dateFields.forEach(field => {
      if (mappedRow[field] && mappedRow[field] !== null) {
        const dateValue = mappedRow[field];
        if (typeof dateValue === 'string') {
          const parsedDate = new Date(dateValue);
          if (isNaN(parsedDate.getTime())) {
            validationErrors.push(`Row ${rowNum}: Invalid date format in '${field}': ${dateValue}`);
          } else {
            // Check for future dates that might indicate data issues
            const today = new Date();
            if (parsedDate > today && field === 'Period End') {
              validationErrors.push(`Row ${rowNum}: Period End date is in the future: ${dateValue}`);
            }
          }
        }
      }
    });

    // Text field validation
    const textFields = ['Song Title', 'Client Name'];
    textFields.forEach(field => {
      if (mappedRow[field] && typeof mappedRow[field] === 'string') {
        const value = mappedRow[field];
        
        // Check for suspiciously short names
        if (value.length < 2) {
          validationErrors.push(`Row ${rowNum}: ${field} seems too short: "${value}"`);
        }
        
        // Check for special characters that might indicate parsing issues
        if (/[^\w\s\-\.,'&()]/.test(value)) {
          validationErrors.push(`Row ${rowNum}: ${field} contains unusual characters: "${value}"`);
        }
      }
    });

    // Check for completely empty rows
    const hasAnyData = Object.values(mappedRow).some(value => 
      value !== null && value !== undefined && value !== '' && !String(value).startsWith('_')
    );
    
    if (!hasAnyData) {
      validationErrors.push(`Row ${rowNum}: No valid data found in this row`);
    }
  }

  private validateAggregateData(mappedData: Record<string, any>[], validationErrors: string[]): void {
    if (mappedData.length === 0) return;

    // Check for duplicate song entries
    const songEntries = new Map<string, number[]>();
    mappedData.forEach((row, index) => {
      const songKey = `${row['Song Title']}-${row['Client Name']}-${row['Period Start']}`;
      if (!songEntries.has(songKey)) {
        songEntries.set(songKey, []);
      }
      songEntries.get(songKey)!.push(index + 1);
    });

    songEntries.forEach((rowNumbers, songKey) => {
      if (rowNumbers.length > 1) {
        validationErrors.push(`Potential duplicate entries found for "${songKey.split('-')[0]}" in rows: ${rowNumbers.join(', ')}`);
      }
    });

    // Validate total amounts
    const amounts = mappedData
      .map(row => row['Gross Amount'])
      .filter(amount => typeof amount === 'number' && !isNaN(amount));

    if (amounts.length > 0) {
      const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
      const avgAmount = totalAmount / amounts.length;
      
      // Check for zero total
      if (totalAmount === 0) {
        validationErrors.push('Total royalty amount is zero - please verify the data');
      }

      // Check for outliers
      const outliers = amounts.filter(amount => amount > avgAmount * 50);
      if (outliers.length > 0) {
        validationErrors.push(`Found ${outliers.length} entries with amounts significantly higher than average - please verify`);
      }
    }

    // Check date consistency
    const periods = mappedData.filter(row => row['Period Start'] && row['Period End']);
    periods.forEach((row, index) => {
      const start = new Date(row['Period Start']);
      const end = new Date(row['Period End']);
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
        validationErrors.push(`Row ${index + 1}: Period Start date is after Period End date`);
      }
    });

    // Summary validation info
    const validRows = mappedData.filter(row => 
      row['Song Title'] && row['Client Name'] && row['Gross Amount'] !== null
    ).length;
    
    if (validRows < mappedData.length * 0.5) {
      validationErrors.push(`Only ${validRows} out of ${mappedData.length} rows contain complete data - please review the mapping`);
    }
  }
}