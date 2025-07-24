// CMO (Collective Management Organization) data by territory
// Based on the comprehensive list provided

export interface CMO {
  id: string;
  name: string;
  territory: string;
  type?: 'PRO' | 'CMO' | 'Both';
}

export const CMO_DATA: CMO[] = [
  // USA
  { id: 'ascap', name: 'ASCAP', territory: 'USA', type: 'PRO' },
  { id: 'bmi', name: 'BMI', territory: 'USA', type: 'PRO' },
  { id: 'sesac', name: 'SESAC', territory: 'USA', type: 'PRO' },
  { id: 'gmr', name: 'GMR', territory: 'USA', type: 'CMO' },
  { id: 'alltrack', name: 'AllTrack', territory: 'USA', type: 'CMO' },
  { id: 'mlc', name: 'The MLC', territory: 'USA', type: 'CMO' },
  { id: 'soundexchange', name: 'SoundExchange', territory: 'USA', type: 'CMO' },

  // Canada
  { id: 'socan', name: 'SOCAN', territory: 'Canada', type: 'PRO' },
  { id: 'cmrra', name: 'CMRRA', territory: 'Canada', type: 'CMO' },
  { id: 'soprroq', name: 'SOPPROQ', territory: 'Canada', type: 'PRO' },
  { id: 'connect', name: 'CONNECT Music Licensing', territory: 'Canada', type: 'CMO' },

  // UK
  { id: 'prs', name: 'PRS for Music', territory: 'UK', type: 'PRO' },
  { id: 'mcps', name: 'MCPS', territory: 'UK', type: 'CMO' },
  { id: 'ppl', name: 'PPL', territory: 'UK', type: 'CMO' },
  { id: 'vpl', name: 'VPL', territory: 'UK', type: 'CMO' },

  // France
  { id: 'sacem', name: 'SACEM', territory: 'France', type: 'PRO' },
  { id: 'sdrm', name: 'SDRM', territory: 'France', type: 'CMO' },

  // Germany
  { id: 'gema', name: 'GEMA', territory: 'Germany', type: 'Both' },
  { id: 'gvl', name: 'GVL', territory: 'Germany', type: 'CMO' },

  // Spain
  { id: 'sgae', name: 'SGAE', territory: 'Spain', type: 'PRO' },
  { id: 'agedi', name: 'AGEDI', territory: 'Spain', type: 'CMO' },
  { id: 'aie', name: 'AIE', territory: 'Spain', type: 'CMO' },

  // Italy
  { id: 'siae', name: 'SIAE', territory: 'Italy', type: 'Both' },
  { id: 'scf', name: 'SCF', territory: 'Italy', type: 'CMO' },

  // Sweden
  { id: 'stim', name: 'STIM', territory: 'Sweden', type: 'PRO' },
  { id: 'sami', name: 'SAMI', territory: 'Sweden', type: 'CMO' },

  // Netherlands
  { id: 'buma_stemra', name: 'BUMA/STEMRA', territory: 'Netherlands', type: 'Both' },
  { id: 'sena', name: 'SENA', territory: 'Netherlands', type: 'CMO' },

  // Colombia
  { id: 'sayco', name: 'SAYCO', territory: 'Colombia', type: 'PRO' },

  // Argentina
  { id: 'sadaic', name: 'SADAIC', territory: 'Argentina', type: 'PRO' },

  // Brazil
  { id: 'abramus', name: 'ABRAMUS', territory: 'Brazil', type: 'PRO' },
  { id: 'ubc', name: 'UBC', territory: 'Brazil', type: 'PRO' },
  { id: 'ecad', name: 'ECAD', territory: 'Brazil', type: 'CMO' },

  // Peru
  { id: 'apdayc', name: 'APDAYC', territory: 'Peru', type: 'PRO' },

  // South Africa
  { id: 'samro', name: 'SAMRO', territory: 'South Africa', type: 'PRO' },
  { id: 'capasso', name: 'CAPASSO', territory: 'South Africa', type: 'CMO' },
  { id: 'sampra', name: 'SAMPRA', territory: 'South Africa', type: 'CMO' },

  // Tanzania
  { id: 'cosota', name: 'COSOTA', territory: 'Tanzania', type: 'PRO' },

  // Japan
  { id: 'jasrac', name: 'JASRAC', territory: 'Japan', type: 'Both' },
  { id: 'nextone', name: 'NexTone', territory: 'Japan', type: 'CMO' },
  { id: 'cpra', name: 'CPRA', territory: 'Japan', type: 'CMO' },

  // South Korea
  { id: 'komca', name: 'KOMCA', territory: 'South Korea', type: 'PRO' },

  // China
  { id: 'mcsc', name: 'MCSC', territory: 'China', type: 'PRO' },

  // India
  { id: 'iprs', name: 'IPRS', territory: 'India', type: 'PRO' },
  { id: 'ppl_india', name: 'PPL India', territory: 'India', type: 'CMO' },
  { id: 'isra', name: 'ISRA', territory: 'India', type: 'CMO' },

  // Australia/New Zealand
  { id: 'apra_amcos', name: 'APRA AMCOS', territory: 'Australia/NZ', type: 'Both' },
  { id: 'ppca', name: 'PPCA', territory: 'Australia', type: 'CMO' },
  { id: 'recorded_music_nz', name: 'Recorded Music NZ', territory: 'New Zealand', type: 'CMO' },
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
  
  // Sort by territory first, then by name
  pros.sort((a, b) => {
    if (a.territory !== b.territory) {
      return a.territory.localeCompare(b.territory);
    }
    return a.value.localeCompare(b.value);
  });
  
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