// CMO (Collective Management Organization) data by territory
// Based on the comprehensive list provided

export interface CMO {
  id: string;
  name: string;
  territory: string;
  rightsType: 'Performance Rights' | 'Mechanical Rights' | 'Neighboring Rights' | 'Performance & Mechanical Rights' | 'Performance & Neighboring Rights';
  type?: 'PRO' | 'CMO' | 'MCO' | 'Both';
}

export const CMO_DATA: CMO[] = [
  // USA
  { id: 'ascap', name: 'ASCAP', territory: 'USA', rightsType: 'Performance Rights', type: 'PRO' },
  { id: 'bmi', name: 'BMI', territory: 'USA', rightsType: 'Performance Rights', type: 'PRO' },
  { id: 'sesac', name: 'SESAC', territory: 'USA', rightsType: 'Performance Rights', type: 'PRO' },
  { id: 'gmr', name: 'GMR', territory: 'USA', rightsType: 'Performance Rights', type: 'PRO' },
  { id: 'alltrack', name: 'AllTrack', territory: 'USA', rightsType: 'Performance Rights', type: 'PRO' },
  { id: 'mlc', name: 'The MLC', territory: 'USA', rightsType: 'Mechanical Rights', type: 'MCO' },
  { id: 'soundexchange', name: 'SoundExchange', territory: 'USA', rightsType: 'Neighboring Rights', type: 'CMO' },

  // Canada
  { id: 'socan', name: 'SOCAN', territory: 'Canada', rightsType: 'Performance & Mechanical Rights', type: 'Both' },
  { id: 'cmrra', name: 'CMRRA', territory: 'Canada', rightsType: 'Mechanical Rights', type: 'CMO' },
  { id: 'sopproq', name: 'SOPPROQ', territory: 'Canada', rightsType: 'Neighboring Rights', type: 'CMO' },
  { id: 'connect', name: 'CONNECT Music Licensing', territory: 'Canada', rightsType: 'Neighboring Rights', type: 'CMO' },

  // UK
  { id: 'prs', name: 'PRS for Music', territory: 'UK', rightsType: 'Performance Rights', type: 'PRO' },
  { id: 'mcps', name: 'MCPS', territory: 'UK', rightsType: 'Mechanical Rights', type: 'CMO' },
  { id: 'ppl', name: 'PPL', territory: 'UK', rightsType: 'Neighboring Rights', type: 'CMO' },
  { id: 'vpl', name: 'VPL', territory: 'UK', rightsType: 'Neighboring Rights', type: 'CMO' },

  // France
  { id: 'sacem', name: 'SACEM', territory: 'France', rightsType: 'Performance & Mechanical Rights', type: 'Both' },
  { id: 'sdrm', name: 'SDRM', territory: 'France', rightsType: 'Mechanical Rights', type: 'CMO' },

  // Germany
  { id: 'gema', name: 'GEMA', territory: 'Germany', rightsType: 'Performance & Mechanical Rights', type: 'Both' },
  { id: 'gvl', name: 'GVL', territory: 'Germany', rightsType: 'Neighboring Rights', type: 'CMO' },

  // Spain
  { id: 'sgae', name: 'SGAE', territory: 'Spain', rightsType: 'Performance & Mechanical Rights', type: 'Both' },
  { id: 'agedi', name: 'AGEDI', territory: 'Spain', rightsType: 'Neighboring Rights', type: 'CMO' },
  { id: 'aie', name: 'AIE', territory: 'Spain', rightsType: 'Neighboring Rights', type: 'CMO' },

  // Italy
  { id: 'siae', name: 'SIAE', territory: 'Italy', rightsType: 'Performance & Mechanical Rights', type: 'Both' },
  { id: 'scf', name: 'SCF', territory: 'Italy', rightsType: 'Neighboring Rights', type: 'CMO' },

  // Sweden
  { id: 'stim', name: 'STIM', territory: 'Sweden', rightsType: 'Performance Rights', type: 'PRO' },
  { id: 'sami', name: 'SAMI', territory: 'Sweden', rightsType: 'Neighboring Rights', type: 'CMO' },

  // Netherlands
  { id: 'buma_stemra', name: 'BUMA/STEMRA', territory: 'Netherlands', rightsType: 'Performance & Mechanical Rights', type: 'Both' },
  { id: 'sena', name: 'SENA', territory: 'Netherlands', rightsType: 'Neighboring Rights', type: 'CMO' },

  // Colombia
  { id: 'sayco', name: 'SAYCO', territory: 'Colombia', rightsType: 'Performance Rights', type: 'PRO' },

  // Argentina
  { id: 'sadaic', name: 'SADAIC', territory: 'Argentina', rightsType: 'Performance & Mechanical Rights', type: 'Both' },

  // Brazil
  { id: 'abramus', name: 'ABRAMUS', territory: 'Brazil', rightsType: 'Performance & Neighboring Rights', type: 'Both' },
  { id: 'ubc', name: 'UBC', territory: 'Brazil', rightsType: 'Performance Rights', type: 'PRO' },
  { id: 'apdayc', name: 'APDAYC', territory: 'Peru', rightsType: 'Performance Rights', type: 'PRO' },
  { id: 'ecad', name: 'ECAD', territory: 'Brazil', rightsType: 'Neighboring Rights', type: 'CMO' },

  // South Africa
  { id: 'samro', name: 'SAMRO', territory: 'South Africa', rightsType: 'Performance Rights', type: 'PRO' },
  { id: 'capasso', name: 'CAPASSO', territory: 'South Africa', rightsType: 'Mechanical Rights', type: 'CMO' },
  { id: 'sampra', name: 'SAMPRA', territory: 'South Africa', rightsType: 'Neighboring Rights', type: 'CMO' },

  // Tanzania
  { id: 'cosota', name: 'COSOTA', territory: 'Tanzania', rightsType: 'Performance Rights', type: 'PRO' },

  // Japan
  { id: 'jasrac', name: 'JASRAC', territory: 'Japan', rightsType: 'Performance & Mechanical Rights', type: 'Both' },
  { id: 'nextone', name: 'NexTone', territory: 'Japan', rightsType: 'Mechanical Rights', type: 'CMO' },
  { id: 'cpra', name: 'CPRA', territory: 'Japan', rightsType: 'Neighboring Rights', type: 'CMO' },

  // South Korea
  { id: 'komca', name: 'KOMCA', territory: 'South Korea', rightsType: 'Performance Rights', type: 'PRO' },

  // China
  { id: 'mcsc', name: 'MCSC', territory: 'China', rightsType: 'Performance Rights', type: 'PRO' },

  // India
  { id: 'iprs', name: 'IPRS', territory: 'India', rightsType: 'Performance & Mechanical Rights', type: 'Both' },
  { id: 'ppl_india', name: 'PPL India', territory: 'India', rightsType: 'Neighboring Rights', type: 'CMO' },
  { id: 'isra', name: 'ISRA', territory: 'India', rightsType: 'Neighboring Rights', type: 'CMO' },

  // Australia/New Zealand
  { id: 'apra_amcos', name: 'APRA AMCOS', territory: 'Australia/NZ', rightsType: 'Performance & Mechanical Rights', type: 'Both' },
  { id: 'ppca', name: 'PPCA', territory: 'Australia', rightsType: 'Neighboring Rights', type: 'CMO' },
  { id: 'recorded_music_nz', name: 'Recorded Music NZ', territory: 'New Zealand', rightsType: 'Neighboring Rights', type: 'CMO' },
];

// Get unique territories for dropdown
export const TERRITORIES = Array.from(new Set(CMO_DATA.map(cmo => cmo.territory))).sort();

// Get CMOs for a specific territory
export const getCMOsByTerritory = (territory: string): CMO[] => {
  return CMO_DATA.filter(cmo => cmo.territory === territory);
};

// Get all PROs for the PRO Affiliation dropdown
export const getAllPROs = (): { value: string; label: string; territory: string }[] => {
  const pros = CMO_DATA
    .filter(cmo => cmo.type === 'PRO' || cmo.type === 'Both')
    .map(cmo => ({
      value: cmo.name,
      label: `${cmo.name} (${cmo.territory})`,
      territory: cmo.territory
    }));
  
  // Sort alphabetically by name only
  pros.sort((a, b) => a.value.localeCompare(b.value));
  
  return pros;
};

// Registration status options
export const REGISTRATION_STATUS_OPTIONS = [
  { value: 'not_registered', label: 'Not Registered' },
  { value: 'pending', label: 'Pending' },
  { value: 'registered', label: 'Registered' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'needs_amendment', label: 'Needs Amendment' },
] as const;

export type RegistrationStatus = typeof REGISTRATION_STATUS_OPTIONS[number]['value'];

// CMO Registration entry
export interface CMORegistration {
  id: string;
  cmoId: string;
  cmoName: string;
  territory: string;
  workNumber: string;
  registrationStatus: RegistrationStatus;
}