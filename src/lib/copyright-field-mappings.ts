/**
 * CWR/DDEX Field Mappings for Copyright Registration Metadata
 * Based on industry standards for music copyright registration
 */

export interface FieldMapping {
  uiField: string;
  cwrField: string;
  ddexField: string;
  description?: string;
}

export const COPYRIGHT_FIELD_MAPPINGS: FieldMapping[] = [
  {
    uiField: 'work_title',
    cwrField: 'NWR:Title',
    ddexField: 'MusicalWork/Title',
    description: 'The title of the musical work'
  },
  {
    uiField: 'iswc',
    cwrField: 'NWR:ISWC',
    ddexField: 'MusicalWorkId/ISWC',
    description: 'International Standard Musical Work Code'
  },
  {
    uiField: 'language_code',
    cwrField: 'NWR:Language Code',
    ddexField: 'LanguageOfLyrics',
    description: 'Language of the lyrics or work'
  },
  {
    uiField: 'writer_name',
    cwrField: 'SWR:Name',
    ddexField: 'WorkContributors/Contributor/PartyName',
    description: 'Name of the songwriter/writer'
  },
  {
    uiField: 'writer_role',
    cwrField: 'SWR:Role',
    ddexField: 'WorkContributors/Contributor/ContributorRole',
    description: 'Role of the writer (composer, lyricist, etc.)'
  },
  {
    uiField: 'writer_ipi',
    cwrField: 'SWR:IPI Number',
    ddexField: 'WorkContributors/Contributor/IPI',
    description: 'Interested Parties Information number for writer'
  },
  {
    uiField: 'writer_ownership_percentage',
    cwrField: 'SWR:Ownership %',
    ddexField: 'WorkContributors/Contributor/ContributorShare',
    description: 'Percentage ownership of the writer'
  },
  {
    uiField: 'publisher_name',
    cwrField: 'PWR:Name',
    ddexField: 'WorkContributors/Contributor/PartyName',
    description: 'Name of the publisher'
  },
  {
    uiField: 'publisher_ipi',
    cwrField: 'PWR:IPI Number',
    ddexField: 'WorkContributors/Contributor/IPI',
    description: 'Interested Parties Information number for publisher'
  },
  {
    uiField: 'publisher_ownership_percentage',
    cwrField: 'PWR:Ownership %',
    ddexField: 'WorkContributors/Contributor/ContributorShare',
    description: 'Percentage ownership of the publisher'
  },
  {
    uiField: 'isrc',
    cwrField: 'REC:ISRC',
    ddexField: 'SoundRecording/ISRC',
    description: 'International Standard Recording Code'
  },
  {
    uiField: 'recording_artist',
    cwrField: 'REC:Artist Name',
    ddexField: 'SoundRecording/DisplayArtistName',
    description: 'Name of the recording artist'
  },
  {
    uiField: 'duration',
    cwrField: 'REC:Duration',
    ddexField: 'SoundRecording/Duration',
    description: 'Duration of the recording in seconds'
  },
  {
    uiField: 'release_date',
    cwrField: 'REC:Release Date',
    ddexField: 'SoundRecording/ReleaseDate',
    description: 'Date when the recording was released'
  },
  {
    uiField: 'territory',
    cwrField: 'TER:Territory Code',
    ddexField: 'TerritoryOfControl/TerritoryCode',
    description: 'Territory code for rights control'
  },
  {
    uiField: 'contract_id',
    cwrField: 'AGR:Agreement ID',
    ddexField: 'Agreement/AgreementId',
    description: 'Unique identifier for the agreement/contract'
  },
  {
    uiField: 'contract_start_date',
    cwrField: 'AGR:Start Date',
    ddexField: 'Agreement/StartDate',
    description: 'Start date of the agreement/contract'
  },
  {
    uiField: 'contract_end_date',
    cwrField: 'AGR:End Date',
    ddexField: 'Agreement/EndDate',
    description: 'End date of the agreement/contract'
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