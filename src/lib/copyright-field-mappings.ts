/**
 * CWR/DDEX Field Mappings for Copyright Registration Metadata
 * Based on industry standards for music copyright registration
 * Updated for compliance with CWR 2.1 and DDEX 4.3 standards
 */

export interface FieldMapping {
  uiField: string;
  cwrField: string;
  ddexField: string;
  description?: string;
  required?: boolean;
  validationType?: 'text' | 'number' | 'date' | 'percentage' | 'territory' | 'ipi' | 'isrc' | 'iswc';
  maxLength?: number;
  pattern?: string;
}

export interface TerritoryMapping {
  code: string;
  name: string;
  cwrCode: string;
  ddexCode: string;
  isWorldwide?: boolean;
}

export const COPYRIGHT_FIELD_MAPPINGS: FieldMapping[] = [
  {
    uiField: 'work_title',
    cwrField: 'NWR:Title',
    ddexField: 'MusicalWork/Title',
    description: 'The title of the musical work',
    required: true,
    validationType: 'text',
    maxLength: 60
  },
  {
    uiField: 'iswc',
    cwrField: 'NWR:ISWC',
    ddexField: 'MusicalWorkId/ISWC',
    description: 'International Standard Musical Work Code',
    validationType: 'iswc',
    pattern: '^T-\\d{10}-\\d$'
  },
  {
    uiField: 'language_code',
    cwrField: 'NWR:Language Code',
    ddexField: 'LanguageOfLyrics',
    description: 'Language of the lyrics or work',
    validationType: 'text',
    maxLength: 2
  },
  {
    uiField: 'creation_date',
    cwrField: 'NWR:Creation Date',
    ddexField: 'MusicalWork/CreationDate',
    description: 'Date the work was created',
    validationType: 'date'
  },
  {
    uiField: 'work_type',
    cwrField: 'NWR:Work Type',
    ddexField: 'MusicalWork/WorkType',
    description: 'Type of work (original, arrangement, etc.)',
    validationType: 'text'
  },
  {
    uiField: 'writer_name',
    cwrField: 'SWR:Name',
    ddexField: 'WorkContributors/Contributor/PartyName',
    description: 'Name of the songwriter/writer',
    required: true,
    validationType: 'text',
    maxLength: 60
  },
  {
    uiField: 'writer_role',
    cwrField: 'SWR:Role',
    ddexField: 'WorkContributors/Contributor/ContributorRole',
    description: 'Role of the writer (composer, lyricist, etc.)',
    validationType: 'text'
  },
  {
    uiField: 'writer_ipi',
    cwrField: 'SWR:IPI Number',
    ddexField: 'WorkContributors/Contributor/IPI',
    description: 'Interested Parties Information number for writer',
    validationType: 'ipi',
    pattern: '^\\d{11}$'
  },
  {
    uiField: 'writer_ownership_percentage',
    cwrField: 'SWR:Ownership %',
    ddexField: 'WorkContributors/Contributor/ContributorShare',
    description: 'Percentage ownership of the writer',
    required: true,
    validationType: 'percentage'
  },
  {
    uiField: 'publisher_name',
    cwrField: 'PWR:Name',
    ddexField: 'WorkContributors/Contributor/PartyName',
    description: 'Name of the publisher',
    validationType: 'text',
    maxLength: 60
  },
  {
    uiField: 'publisher_ipi',
    cwrField: 'PWR:IPI Number',
    ddexField: 'WorkContributors/Contributor/IPI',
    description: 'Interested Parties Information number for publisher',
    validationType: 'ipi',
    pattern: '^\\d{11}$'
  },
  {
    uiField: 'publisher_ownership_percentage',
    cwrField: 'PWR:Ownership %',
    ddexField: 'WorkContributors/Contributor/ContributorShare',
    description: 'Percentage ownership of the publisher',
    validationType: 'percentage'
  },
  {
    uiField: 'isrc',
    cwrField: 'REC:ISRC',
    ddexField: 'SoundRecording/ISRC',
    description: 'International Standard Recording Code',
    validationType: 'isrc',
    pattern: '^[A-Z]{2}[A-Z0-9]{3}\\d{7}$'
  },
  {
    uiField: 'recording_artist',
    cwrField: 'REC:Artist Name',
    ddexField: 'SoundRecording/DisplayArtistName',
    description: 'Name of the recording artist',
    validationType: 'text',
    maxLength: 60
  },
  {
    uiField: 'duration_seconds',
    cwrField: 'REC:Duration',
    ddexField: 'SoundRecording/Duration',
    description: 'Duration of the recording in seconds',
    validationType: 'number'
  },
  {
    uiField: 'release_date',
    cwrField: 'REC:Release Date',
    ddexField: 'SoundRecording/ReleaseDate',
    description: 'Date when the recording was released',
    validationType: 'date'
  },
  {
    uiField: 'collection_territories',
    cwrField: 'TER:Territory Code',
    ddexField: 'TerritoryOfControl/TerritoryCode',
    description: 'Territory codes for rights control',
    validationType: 'territory'
  }
];

// Territory mappings for CWR/DDEX compliance
export const TERRITORY_MAPPINGS: TerritoryMapping[] = [
  {
    code: 'WORLD',
    name: 'Worldwide',
    cwrCode: '2136',
    ddexCode: 'Worldwide',
    isWorldwide: true
  },
  {
    code: 'US',
    name: 'United States',
    cwrCode: '840',
    ddexCode: 'US'
  },
  {
    code: 'CA',
    name: 'Canada',
    cwrCode: '124',
    ddexCode: 'CA'
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    cwrCode: '826',
    ddexCode: 'GB'
  },
  {
    code: 'FR',
    name: 'France',
    cwrCode: '250',
    ddexCode: 'FR'
  },
  {
    code: 'DE',
    name: 'Germany',
    cwrCode: '276',
    ddexCode: 'DE'
  },
  {
    code: 'JP',
    name: 'Japan',
    cwrCode: '392',
    ddexCode: 'JP'
  },
  {
    code: 'AU',
    name: 'Australia',
    cwrCode: '036',
    ddexCode: 'AU'
  }
];

/**
 * Get CWR field mapping for a UI field
 */
export const getCWRField = (uiField: string): string | undefined => {
  return COPYRIGHT_FIELD_MAPPINGS.find(mapping => mapping.uiField === uiField)?.cwrField;
};

/**
 * Get DDEX field mapping for a UI field
 */
export const getDDEXField = (uiField: string): string | undefined => {
  return COPYRIGHT_FIELD_MAPPINGS.find(mapping => mapping.uiField === uiField)?.ddexField;
};

/**
 * Get all mappings for a specific UI field
 */
export const getFieldMapping = (uiField: string): FieldMapping | undefined => {
  return COPYRIGHT_FIELD_MAPPINGS.find(mapping => mapping.uiField === uiField);
};

/**
 * Export functions for CWR/DDEX data transformation
 */
export const transformToCWR = (copyrightData: any): Record<string, any> => {
  const cwrData: Record<string, any> = {};
  
  COPYRIGHT_FIELD_MAPPINGS.forEach(mapping => {
    const value = copyrightData[mapping.uiField];
    if (value !== undefined && value !== null) {
      cwrData[mapping.cwrField] = value;
    }
  });
  
  return cwrData;
};

export const transformToDDEX = (copyrightData: any): Record<string, any> => {
  const ddexData: Record<string, any> = {};
  
  COPYRIGHT_FIELD_MAPPINGS.forEach(mapping => {
    const value = copyrightData[mapping.uiField];
    if (value !== undefined && value !== null) {
      // Handle nested DDEX paths
      const fieldPath = mapping.ddexField.split('/');
      let current = ddexData;
      
      for (let i = 0; i < fieldPath.length - 1; i++) {
        if (!current[fieldPath[i]]) {
          current[fieldPath[i]] = {};
        }
        current = current[fieldPath[i]];
      }
      
      current[fieldPath[fieldPath.length - 1]] = value;
    }
  });
  
  return ddexData;
};

/**
 * Territory mapping utilities
 */
export const getTerritoryMapping = (code: string): TerritoryMapping | undefined => {
  return TERRITORY_MAPPINGS.find(territory => territory.code === code);
};

export const getCWRTerritoryCode = (uiCode: string): string => {
  const mapping = getTerritoryMapping(uiCode);
  return mapping?.cwrCode || '2136'; // Default to worldwide
};

export const getDDEXTerritoryCode = (uiCode: string): string => {
  const mapping = getTerritoryMapping(uiCode);
  return mapping?.ddexCode || 'Worldwide'; // Default to worldwide
};

export const transformTerritoriesToCWR = (territories: string[]): string[] => {
  if (!territories || territories.length === 0) {
    return ['2136']; // Default to worldwide
  }
  return territories.map(getCWRTerritoryCode);
};

export const transformTerritoriesToDDEX = (territories: string[]): string[] => {
  if (!territories || territories.length === 0) {
    return ['Worldwide']; // Default to worldwide
  }
  return territories.map(getDDEXTerritoryCode);
};

/**
 * Enhanced validation functions
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateField = (value: any, mapping: FieldMapping): ValidationResult => {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // Check required fields
  if (mapping.required && (value === null || value === undefined || value === '')) {
    result.isValid = false;
    result.errors.push(`${mapping.description || mapping.uiField} is required`);
    return result;
  }

  // Skip validation if value is empty and field is not required
  if (!value && !mapping.required) {
    return result;
  }

  // Type-specific validation
  switch (mapping.validationType) {
    case 'text':
      if (typeof value !== 'string') {
        result.isValid = false;
        result.errors.push(`${mapping.description || mapping.uiField} must be text`);
      }
      if (mapping.maxLength && value.length > mapping.maxLength) {
        result.isValid = false;
        result.errors.push(`${mapping.description || mapping.uiField} exceeds maximum length of ${mapping.maxLength}`);
      }
      break;

    case 'number':
      if (typeof value !== 'number' && isNaN(Number(value))) {
        result.isValid = false;
        result.errors.push(`${mapping.description || mapping.uiField} must be a number`);
      }
      break;

    case 'percentage':
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        result.isValid = false;
        result.errors.push(`${mapping.description || mapping.uiField} must be between 0 and 100`);
      }
      break;

    case 'date':
      if (isNaN(Date.parse(value))) {
        result.isValid = false;
        result.errors.push(`${mapping.description || mapping.uiField} must be a valid date`);
      }
      break;

    case 'territory':
      if (Array.isArray(value)) {
        const invalidTerritories = value.filter(t => !getTerritoryMapping(t));
        if (invalidTerritories.length > 0) {
          result.warnings.push(`Unknown territory codes: ${invalidTerritories.join(', ')}`);
        }
      }
      break;

    case 'ipi':
    case 'isrc':
    case 'iswc':
      if (mapping.pattern && !new RegExp(mapping.pattern).test(value)) {
        result.isValid = false;
        result.errors.push(`${mapping.description || mapping.uiField} format is invalid`);
      }
      break;
  }

  return result;
};

export const validateCopyrightData = (copyrightData: any): ValidationResult => {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  COPYRIGHT_FIELD_MAPPINGS.forEach(mapping => {
    const fieldResult = validateField(copyrightData[mapping.uiField], mapping);
    result.errors.push(...fieldResult.errors);
    result.warnings.push(...fieldResult.warnings);
    if (!fieldResult.isValid) {
      result.isValid = false;
    }
  });

  return result;
};

/**
 * Contract integration functions
 */
export const transformContractData = (copyrightData: any, contractData?: any): Record<string, any> => {
  const enhanced = { ...copyrightData };
  
  if (contractData) {
    // Map contract fields to copyright fields for export
    enhanced.contract_id = contractData.agreement_id || contractData.id;
    enhanced.contract_start_date = contractData.start_date;
    enhanced.contract_end_date = contractData.end_date;
    enhanced.controlled_percentage = contractData.controlled_percentage;
    enhanced.territories = contractData.territories || ['WORLD'];
  }
  
  return enhanced;
};