/**
 * CWR 2.1 Schema Validation and Format Compliance
 * Comprehensive validation framework for music copyright registration
 */

export interface CWRValidationRule {
  field: string;
  required: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
  allowedValues?: string[];
  customValidator?: (value: any) => boolean;
  errorMessage?: string;
}

export interface CWRValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  compliance: {
    cwr21: number;
    ddex: number;
    format: number;
  };
}

// CWR 2.1 Header Configuration
export const CWR_HEADER_CONFIG = {
  HEADER_RECORD_TYPE: 'HDR',
  VERSION: '21',
  SENDER_TYPE: 'SO',
  SENDER_ID: 'ENCOREMUSIC',
  SENDER_NAME: 'ENCORE MUSIC PUBLISHING',
  EDI_STANDARD: 'CWR',
  CHARACTER_SET: 'ASCII',
  DATE_FORMAT: 'CCYYMMDD',
  TIME_FORMAT: 'HHMMSS'
};

// CWR 2.1 Field Validation Rules
export const CWR_VALIDATION_RULES: Record<string, CWRValidationRule> = {
  // Header Fields
  'HDR.SENDER_TYPE': {
    field: 'sender_type',
    required: true,
    maxLength: 2,
    allowedValues: ['SO', 'PB', 'WR', 'AD'],
    errorMessage: 'Sender type must be SO, PB, WR, or AD'
  },
  'HDR.SENDER_ID': {
    field: 'sender_id',
    required: true,
    maxLength: 9,
    pattern: /^[A-Z0-9]{2,9}$/,
    errorMessage: 'Sender ID must be 2-9 alphanumeric characters'
  },
  'HDR.CREATION_DATE': {
    field: 'creation_date',
    required: true,
    maxLength: 8,
    pattern: /^\d{8}$/,
    errorMessage: 'Creation date must be CCYYMMDD format'
  },
  'HDR.CREATION_TIME': {
    field: 'creation_time',
    required: true,
    maxLength: 6,
    pattern: /^\d{6}$/,
    errorMessage: 'Creation time must be HHMMSS format'
  },

  // NWR (New Work Registration) Fields
  'NWR.WORK_TITLE': {
    field: 'work_title',
    required: true,
    maxLength: 60,
    minLength: 1,
    errorMessage: 'Work title is required and cannot exceed 60 characters'
  },
  'NWR.ISWC': {
    field: 'iswc',
    required: false,
    maxLength: 15,
    pattern: /^T-?\d{9}-?\d$/,
    errorMessage: 'ISWC must follow format T-123456789-0'
  },
  'NWR.LANGUAGE_CODE': {
    field: 'language_code',
    required: false,
    maxLength: 2,
    allowedValues: ['EN', 'ES', 'FR', 'DE', 'IT', 'PT', 'JA', 'KO', 'ZH'],
    errorMessage: 'Language code must be a valid ISO 639-1 code'
  },
  'NWR.WORK_TYPE': {
    field: 'work_type',
    required: true,
    maxLength: 3,
    allowedValues: ['ORI', 'ARR', 'ADP', 'TRA', 'COM'],
    errorMessage: 'Work type must be ORI, ARR, ADP, TRA, or COM'
  },
  'NWR.DURATION': {
    field: 'duration_seconds',
    required: false,
    customValidator: (value: any) => !value || (typeof value === 'number' && value > 0 && value <= 86400),
    errorMessage: 'Duration must be between 1 and 86400 seconds'
  },

  // SWR (Songwriter/Writer) Fields
  'SWR.WRITER_FIRST_NAME': {
    field: 'writer_first_name',
    required: true,
    maxLength: 30,
    errorMessage: 'Writer first name is required and cannot exceed 30 characters'
  },
  'SWR.WRITER_LAST_NAME': {
    field: 'writer_last_name',
    required: true,
    maxLength: 45,
    errorMessage: 'Writer last name is required and cannot exceed 45 characters'
  },
  'SWR.IPI_NUMBER': {
    field: 'ipi_number',
    required: false,
    maxLength: 11,
    pattern: /^\d{9,11}$/,
    errorMessage: 'IPI number must be 9-11 digits'
  },
  'SWR.WRITER_ROLE': {
    field: 'writer_role',
    required: true,
    maxLength: 2,
    allowedValues: ['CA', 'A ', 'C ', 'AR', 'TR', 'AD'],
    errorMessage: 'Writer role must be CA, A, C, AR, TR, or AD'
  },
  'SWR.WRITER_SHARE': {
    field: 'ownership_percentage',
    required: true,
    customValidator: (value: any) => typeof value === 'number' && value >= 0 && value <= 100,
    errorMessage: 'Writer share must be between 0 and 100'
  },

  // PWR (Publisher) Fields
  'PWR.PUBLISHER_NAME': {
    field: 'publisher_name',
    required: true,
    maxLength: 45,
    errorMessage: 'Publisher name is required and cannot exceed 45 characters'
  },
  'PWR.PUBLISHER_TYPE': {
    field: 'publisher_role',
    required: true,
    maxLength: 2,
    allowedValues: ['E ', 'ES', 'PA', 'SE'],
    errorMessage: 'Publisher type must be E, ES, PA, or SE'
  },

  // TER (Territory) Fields
  'TER.TERRITORY_CODE': {
    field: 'territory_code',
    required: true,
    maxLength: 2,
    pattern: /^[A-Z]{2}$/,
    errorMessage: 'Territory code must be a valid ISO 3166-1 alpha-2 code'
  },
  'TER.INCLUSION_EXCLUSION': {
    field: 'inclusion_exclusion',
    required: true,
    maxLength: 1,
    allowedValues: ['I', 'E'],
    errorMessage: 'Inclusion/Exclusion flag must be I or E'
  },

  // REC (Recording) Fields
  'REC.ISRC': {
    field: 'isrc',
    required: false,
    maxLength: 12,
    pattern: /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/,
    errorMessage: 'ISRC must follow format: CC-XXX-YY-NNNNN'
  },
  'REC.RECORDING_TITLE': {
    field: 'recording_title',
    required: false,
    maxLength: 60,
    errorMessage: 'Recording title cannot exceed 60 characters'
  },
  'REC.RECORDING_ARTIST': {
    field: 'artist_name',
    required: false,
    maxLength: 60,
    errorMessage: 'Recording artist name cannot exceed 60 characters'
  }
};

// Rights-specific ownership validation
export const RIGHTS_VALIDATION_RULES = {
  PERFORMANCE: {
    totalMustEqual: 100,
    allowedParties: ['writer', 'publisher']
  },
  MECHANICAL: {
    totalMustEqual: 100,
    allowedParties: ['writer', 'publisher']
  },
  SYNCHRONIZATION: {
    totalMustEqual: 100,
    allowedParties: ['writer', 'publisher']
  },
  PRINT: {
    totalMustEqual: 100,
    allowedParties: ['writer', 'publisher']
  }
};

/**
 * Validates a single field against CWR 2.1 standards
 */
export const validateCWRField = (
  fieldPath: string,
  value: any,
  context?: Record<string, any>
): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const rule = CWR_VALIDATION_RULES[fieldPath];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rule) {
    warnings.push(`No validation rule found for field: ${fieldPath}`);
    return { isValid: true, errors, warnings };
  }

  // Required field validation
  if (rule.required && (value === null || value === undefined || value === '')) {
    errors.push(rule.errorMessage || `${rule.field} is required`);
    return { isValid: false, errors, warnings };
  }

  // Skip further validation if value is empty and not required
  if (!rule.required && (value === null || value === undefined || value === '')) {
    return { isValid: true, errors, warnings };
  }

  // Length validation
  if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
    errors.push(`${rule.field} exceeds maximum length of ${rule.maxLength} characters`);
  }

  if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
    errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
  }

  // Pattern validation
  if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
    errors.push(rule.errorMessage || `${rule.field} format is invalid`);
  }

  // Allowed values validation
  if (rule.allowedValues && !rule.allowedValues.includes(value)) {
    errors.push(`${rule.field} must be one of: ${rule.allowedValues.join(', ')}`);
  }

  // Custom validation
  if (rule.customValidator && !rule.customValidator(value)) {
    errors.push(rule.errorMessage || `${rule.field} failed custom validation`);
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Validates ownership percentages for specific rights
 */
export const validateRightsOwnership = (
  writers: any[],
  publishers: any[],
  rightsType: keyof typeof RIGHTS_VALIDATION_RULES
): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rules = RIGHTS_VALIDATION_RULES[rightsType];

  if (!rules) {
    warnings.push(`No validation rules for rights type: ${rightsType}`);
    return { isValid: true, errors, warnings };
  }

  // Calculate total ownership
  const writerShare = writers.reduce((sum, writer) => {
    const shareField = `${rightsType.toLowerCase()}_share`;
    return sum + (writer[shareField] || 0);
  }, 0);

  const publisherShare = publishers.reduce((sum, publisher) => {
    const shareField = `${rightsType.toLowerCase()}_share`;
    return sum + (publisher[shareField] || 0);
  }, 0);

  const totalShare = writerShare + publisherShare;

  // Validate total equals required percentage
  if (rules.totalMustEqual && totalShare !== rules.totalMustEqual) {
    if (totalShare > rules.totalMustEqual) {
      errors.push(`${rightsType} rights ownership exceeds ${rules.totalMustEqual}% (current: ${totalShare}%)`);
    } else if (totalShare < rules.totalMustEqual) {
      warnings.push(`${rightsType} rights ownership is less than ${rules.totalMustEqual}% (current: ${totalShare}%)`);
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Comprehensive CWR validation for copyright data
 */
export const validateCWRCompliance = (
  copyright: any,
  writers: any[] = [],
  publishers: any[] = [],
  recordings: any[] = []
): CWRValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate core copyright fields
  const workValidation = validateCWRField('NWR.WORK_TITLE', copyright.work_title);
  errors.push(...workValidation.errors);
  warnings.push(...workValidation.warnings);

  if (copyright.iswc) {
    const iswcValidation = validateCWRField('NWR.ISWC', copyright.iswc);
    errors.push(...iswcValidation.errors);
    warnings.push(...iswcValidation.warnings);
  }

  const workTypeValidation = validateCWRField('NWR.WORK_TYPE', copyright.work_type);
  errors.push(...workTypeValidation.errors);
  warnings.push(...workTypeValidation.warnings);

  // Validate writers
  if (writers.length === 0) {
    errors.push('At least one writer is required for CWR compliance');
  } else {
    writers.forEach((writer, index) => {
      const writerValidation = validateCWRField('SWR.WRITER_FIRST_NAME', writer.writer_name?.split(' ')[0]);
      const shareValidation = validateCWRField('SWR.WRITER_SHARE', writer.ownership_percentage);
      
      errors.push(...writerValidation.errors.map(e => `Writer ${index + 1}: ${e}`));
      errors.push(...shareValidation.errors.map(e => `Writer ${index + 1}: ${e}`));
      warnings.push(...writerValidation.warnings.map(w => `Writer ${index + 1}: ${w}`));
      warnings.push(...shareValidation.warnings.map(w => `Writer ${index + 1}: ${w}`));

      if (writer.ipi_number) {
        const ipiValidation = validateCWRField('SWR.IPI_NUMBER', writer.ipi_number);
        errors.push(...ipiValidation.errors.map(e => `Writer ${index + 1}: ${e}`));
        warnings.push(...ipiValidation.warnings.map(w => `Writer ${index + 1}: ${w}`));
      }
    });
  }

  // Validate publishers
  publishers.forEach((publisher, index) => {
    const nameValidation = validateCWRField('PWR.PUBLISHER_NAME', publisher.publisher_name);
    errors.push(...nameValidation.errors.map(e => `Publisher ${index + 1}: ${e}`));
    warnings.push(...nameValidation.warnings.map(w => `Publisher ${index + 1}: ${w}`));
  });

  // Validate recordings
  recordings.forEach((recording, index) => {
    if (recording.isrc) {
      const isrcValidation = validateCWRField('REC.ISRC', recording.isrc);
      errors.push(...isrcValidation.errors.map(e => `Recording ${index + 1}: ${e}`));
      warnings.push(...isrcValidation.warnings.map(w => `Recording ${index + 1}: ${w}`));
    }
  });

  // Validate rights ownership
  ['PERFORMANCE', 'MECHANICAL', 'SYNCHRONIZATION', 'PRINT'].forEach(rightsType => {
    const rightsValidation = validateRightsOwnership(
      writers,
      publishers,
      rightsType as keyof typeof RIGHTS_VALIDATION_RULES
    );
    errors.push(...rightsValidation.errors);
    warnings.push(...rightsValidation.warnings);
  });

  // Calculate compliance scores
  const totalChecks = 20; // Total number of validation checks
  const errorPenalty = errors.length * 5;
  const warningPenalty = warnings.length * 2;

  const cwr21Compliance = Math.max(0, 100 - errorPenalty - warningPenalty);
  const ddexCompliance = Math.max(0, 100 - errorPenalty - (warningPenalty * 0.5));
  const formatCompliance = Math.max(0, 100 - (errorPenalty * 1.5));

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    compliance: {
      cwr21: cwr21Compliance,
      ddex: ddexCompliance,
      format: formatCompliance
    }
  };
};

/**
 * Real-time field validation for forms
 */
export const validateFieldRealTime = (
  fieldName: string,
  value: any,
  context?: Record<string, any>
): { isValid: boolean; message?: string; severity?: 'error' | 'warning' } => {
  // Map UI field names to CWR field paths
  const fieldMappings: Record<string, string> = {
    'work_title': 'NWR.WORK_TITLE',
    'iswc': 'NWR.ISWC',
    'language_code': 'NWR.LANGUAGE_CODE',
    'work_type': 'NWR.WORK_TYPE',
    'duration_seconds': 'NWR.DURATION',
    'writer_name': 'SWR.WRITER_FIRST_NAME',
    'writer_role': 'SWR.WRITER_ROLE',
    'ipi_number': 'SWR.IPI_NUMBER',
    'ownership_percentage': 'SWR.WRITER_SHARE',
    'publisher_name': 'PWR.PUBLISHER_NAME',
    'isrc': 'REC.ISRC'
  };

  const cwrField = fieldMappings[fieldName];
  if (!cwrField) {
    return { isValid: true };
  }

  const validation = validateCWRField(cwrField, value, context);
  
  if (!validation.isValid) {
    return {
      isValid: false,
      message: validation.errors[0],
      severity: 'error'
    };
  }

  if (validation.warnings.length > 0) {
    return {
      isValid: true,
      message: validation.warnings[0],
      severity: 'warning'
    };
  }

  return { isValid: true };
};