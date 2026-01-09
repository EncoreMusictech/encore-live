/**
 * ASCAP-specific CWR Validation Rules
 * Additional validation for ASCAP submissions
 */

export const ASCAP_CONFIG = {
  RECIPIENT_CODE: '410', // ASCAP's CISAC society code
  RECIPIENT_NAME: 'ASCAP',
  SFTP_HOST: 'ftp.ascap.com', // Default ASCAP FTP endpoint
  SFTP_PORT: 22,
  BASE_PATH: '/incoming',
  FILE_PATTERN: /^CW\d{2}\d{4}[A-Z0-9]+_410\.V21$/,
};

export interface ASCAPValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface ASCAPCWRFileNameParts {
  transactionType: string;
  year: string;
  sequence: string;
  senderCode: string;
  recipientCode: string;
  version: string;
}

/**
 * Generates ASCAP-compliant CWR file name
 * Format: CW[YY][XXXX][SenderCode]_[RecipientCode].V21
 */
export const generateASCAPFileName = (
  senderCode: string,
  sequenceNumber: number
): string => {
  const year = new Date().getFullYear().toString().slice(-2);
  const sequence = sequenceNumber.toString().padStart(4, '0');
  return `CW${year}${sequence}${senderCode}_${ASCAP_CONFIG.RECIPIENT_CODE}.V21`;
};

/**
 * Validates ASCAP-specific CWR file naming convention
 */
export const validateASCAPFileName = (fileName: string): ASCAPValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check file extension
  if (!fileName.endsWith('.V21')) {
    errors.push('ASCAP requires CWR 2.1 format (.V21 extension)');
  }

  // Check file name pattern
  if (!ASCAP_CONFIG.FILE_PATTERN.test(fileName)) {
    errors.push('File name does not match ASCAP naming convention: CW[YY][XXXX][SenderCode]_410.V21');
  }

  // Check recipient code
  if (!fileName.includes('_410.')) {
    errors.push(`Recipient code must be 410 for ASCAP submissions`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations
  };
};

/**
 * Validates sender code format for ASCAP
 */
export const validateASCAPSenderCode = (senderCode: string): ASCAPValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (!senderCode) {
    errors.push('CISAC Sender Code is required for ASCAP submissions');
    return { isValid: false, errors, warnings, recommendations };
  }

  // Sender code should be 2-9 alphanumeric characters
  if (!/^[A-Z0-9]{2,9}$/.test(senderCode)) {
    errors.push('Sender Code must be 2-9 uppercase alphanumeric characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations
  };
};

/**
 * Validates writer data for ASCAP submission
 */
export const validateASCAPWriter = (writer: any): ASCAPValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check for IPI number (strongly recommended for ASCAP)
  if (!writer.ipi_number) {
    warnings.push(`Writer "${writer.writer_name}" is missing IPI number - strongly recommended for ASCAP`);
    recommendations.push('Obtain IPI numbers for all writers from their respective PROs');
  } else if (!/^\d{9,11}$/.test(writer.ipi_number)) {
    errors.push(`Writer "${writer.writer_name}" has invalid IPI number format (must be 9-11 digits)`);
  }

  // Check for PRO affiliation
  if (!writer.pro_affiliation) {
    warnings.push(`Writer "${writer.writer_name}" has no PRO affiliation specified`);
  }

  // Check for controlled status
  if (!writer.controlled_status) {
    warnings.push(`Writer "${writer.writer_name}" has no controlled status - defaulting to uncontrolled`);
  }

  // Validate ownership percentage
  if (typeof writer.ownership_percentage !== 'number' || writer.ownership_percentage < 0 || writer.ownership_percentage > 100) {
    errors.push(`Writer "${writer.writer_name}" has invalid ownership percentage`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations
  };
};

/**
 * Validates publisher data for ASCAP submission
 */
export const validateASCAPPublisher = (publisher: any): ASCAPValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (!publisher.publisher_name) {
    errors.push('Publisher name is required');
  }

  // Check for IPI number
  if (!publisher.ipi_number) {
    warnings.push(`Publisher "${publisher.publisher_name}" is missing IPI number`);
    recommendations.push('Register your publishing entity with ASCAP to obtain an IPI number');
  }

  // Check for PRO affiliation
  if (publisher.pro_affiliation && publisher.pro_affiliation !== 'ASCAP') {
    warnings.push(`Publisher "${publisher.publisher_name}" is affiliated with ${publisher.pro_affiliation}, not ASCAP`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations
  };
};

/**
 * Validates complete copyright work for ASCAP submission
 */
export const validateASCAPWork = (
  copyright: any,
  writers: any[] = [],
  publishers: any[] = []
): ASCAPValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Work title validation
  if (!copyright.work_title || copyright.work_title.trim().length === 0) {
    errors.push('Work title is required');
  } else if (copyright.work_title.length > 60) {
    errors.push('Work title exceeds ASCAP maximum of 60 characters');
  }

  // ISWC validation (recommended but not required)
  if (!copyright.iswc) {
    warnings.push('ISWC is not assigned - ASCAP may assign one upon registration');
  } else if (!/^T-?\d{9}-?\d$/.test(copyright.iswc)) {
    errors.push('ISWC format is invalid (expected: T-123456789-0)');
  }

  // Language code
  if (!copyright.language_code) {
    warnings.push('Language code not specified - defaulting to EN (English)');
  }

  // Work type
  if (!copyright.work_type) {
    warnings.push('Work type not specified - defaulting to ORI (Original)');
  }

  // Writers validation
  if (writers.length === 0) {
    errors.push('At least one writer is required for ASCAP submission');
  } else {
    // Check for at least one controlled writer
    const hasControlledWriter = writers.some(w => w.controlled_status === 'C');
    if (!hasControlledWriter) {
      warnings.push('No controlled writers found - you may not receive royalties for uncontrolled writers');
    }

    // Validate each writer
    writers.forEach(writer => {
      const writerValidation = validateASCAPWriter(writer);
      errors.push(...writerValidation.errors);
      warnings.push(...writerValidation.warnings);
      recommendations.push(...writerValidation.recommendations);
    });

    // Validate total ownership
    const totalOwnership = writers.reduce((sum, w) => sum + (w.ownership_percentage || 0), 0);
    if (totalOwnership > 100) {
      errors.push(`Total writer ownership (${totalOwnership}%) exceeds 100%`);
    } else if (totalOwnership < 100) {
      warnings.push(`Total writer ownership (${totalOwnership}%) is less than 100% - remaining shares may be unaccounted`);
    }
  }

  // Publishers validation
  publishers.forEach(publisher => {
    const pubValidation = validateASCAPPublisher(publisher);
    errors.push(...pubValidation.errors);
    warnings.push(...pubValidation.warnings);
    recommendations.push(...pubValidation.recommendations);
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations: [...new Set(recommendations)] // Remove duplicates
  };
};

/**
 * Validates a batch of works for ASCAP submission
 */
export const validateASCAPBatch = (
  works: Array<{ copyright: any; writers: any[]; publishers: any[] }>,
  senderCode: string
): ASCAPValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Validate sender code
  const senderValidation = validateASCAPSenderCode(senderCode);
  errors.push(...senderValidation.errors);
  warnings.push(...senderValidation.warnings);

  // Validate each work
  works.forEach((work, index) => {
    const workValidation = validateASCAPWork(work.copyright, work.writers, work.publishers);
    if (!workValidation.isValid) {
      errors.push(`Work ${index + 1} (${work.copyright.work_title}): ${workValidation.errors.join('; ')}`);
    }
    warnings.push(...workValidation.warnings.map(w => `Work ${index + 1}: ${w}`));
    recommendations.push(...workValidation.recommendations);
  });

  // Batch-level recommendations
  if (works.length > 500) {
    warnings.push('Batch contains more than 500 works - consider splitting into multiple submissions');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations: [...new Set(recommendations)]
  };
};

/**
 * Pre-fill ASCAP FTP configuration
 */
export const getASCAPFTPConfig = () => ({
  pro_name: 'ASCAP',
  pro_code: ASCAP_CONFIG.RECIPIENT_CODE,
  host: ASCAP_CONFIG.SFTP_HOST,
  port: ASCAP_CONFIG.SFTP_PORT,
  base_path: ASCAP_CONFIG.BASE_PATH,
  connection_type: 'sftp' as const
});
