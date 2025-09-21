import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RightsMultipliers {
  master: {
    streaming: number;
    sync: number;
    mechanical: number;
    other: number;
  };
  publishing: {
    performance: number;
    mechanical: number;
    sync: number;
    print: number;
    other: number;
  };
}

interface RightsData {
  masterRights: {
    ownership: number;
    recordings: Array<{
      isrc: string;
      title: string;
      artist: string;
    }>;
  };
  publishingRights: {
    ownership: number;
    compositions: Array<{
      iswc: string;
      title: string;
      writers: string[];
    }>;
  };
}

export const useRightsBasedCalculations = (
  selectedTracks: any[], 
  dealTerms: any, 
  artistName: string
) => {
  const [rightsData, setRightsData] = useState<RightsData | null>(null);
  const [loading, setLoading] = useState(false);

  // Rights-specific multipliers based on industry standards
  const rightsMultipliers: RightsMultipliers = {
    master: {
      streaming: 10, // Master streaming rights typically 10x
      sync: 15, // Master sync rights premium
      mechanical: 8, // Lower for master mechanicals
      other: 6
    },
    publishing: {
      performance: 18, // Publishing performance highest value
      mechanical: 15, // Publishing mechanicals
      sync: 12, // Publishing sync rights
      print: 10, // Sheet music, etc.
      other: 8
    }
  };

  // Fetch actual rights data from copyright system
  const fetchRightsData = async () => {
    if (!artistName || selectedTracks.length === 0) return;
    
    setLoading(true);
    try {
      // Get copyrights for this artist/tracks
      const trackTitles = selectedTracks.map(track => track.name || track.title);
      
      const { data: copyrights, error } = await supabase
        .from('copyrights')
        .select(`
          *,
          copyright_recordings (*),
          copyright_writers (*),
          copyright_publishers (*)
        `)
        .or(`work_title.in.(${trackTitles.join(',')})`);

      if (error) throw error;

      // Process rights data
      const processedRights: RightsData = {
        masterRights: {
          ownership: 0,
          recordings: []
        },
        publishingRights: {
          ownership: 0,
          compositions: []
        }
      };

      copyrights?.forEach(copyright => {
        // Process recording rights
        copyright.copyright_recordings?.forEach((recording: any) => {
          processedRights.masterRights.recordings.push({
            isrc: recording.isrc,
            title: recording.recording_title,
            artist: recording.artist_name
          });
        });

        // Process publishing rights (writers + publishers)
        const totalWriterShare = copyright.copyright_writers?.reduce((sum: number, writer: any) => 
          sum + (writer.ownership_percentage || 0), 0) || 0;
        
        const totalPublisherShare = copyright.copyright_publishers?.reduce((sum: number, pub: any) => 
          sum + (pub.ownership_percentage || 0), 0) || 0;

        processedRights.publishingRights.ownership = Math.max(
          processedRights.publishingRights.ownership,
          totalWriterShare + totalPublisherShare
        );

        processedRights.publishingRights.compositions.push({
          iswc: copyright.iswc,
          title: copyright.work_title,
          writers: copyright.copyright_writers?.map((w: any) => w.writer_name) || []
        });
      });

      setRightsData(processedRights);
    } catch (error) {
      console.error('Error fetching rights data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRightsData();
  }, [artistName, selectedTracks]);

  // Calculate rights-specific projections
  const calculateRightsBasedProjections = useMemo(() => {
    if (!dealTerms) return [];

    const { rightsType, advance, termLength, royaltyRate, recoupmentRate } = dealTerms;
    const projections = [];

    // Base revenue estimation (simplified)
    let baseAnnualRevenue = selectedTracks.reduce((total, track) => {
      const popularity = track.popularity || 50;
      return total + (popularity * 2000); // Base revenue per popularity point
    }, 0);

    // Apply rights-specific multipliers
    let rightsMultiplier = 1;
    if (rightsType === 'master') {
      rightsMultiplier = 1.2; // Master rights typically generate more immediate revenue
    } else if (rightsType === 'publishing') {
      rightsMultiplier = 1.5; // Publishing rights have longer-term value
    } else if (rightsType === 'both') {
      rightsMultiplier = 2.0; // 360 deals capture both revenue streams
    }

    baseAnnualRevenue *= rightsMultiplier;

    // Account for actual ownership data if available
    if (rightsData) {
      if (rightsType === 'master' && rightsData.masterRights.ownership > 0) {
        baseAnnualRevenue *= (rightsData.masterRights.ownership / 100);
      } else if (rightsType === 'publishing' && rightsData.publishingRights.ownership > 0) {
        baseAnnualRevenue *= (rightsData.publishingRights.ownership / 100);
      }
    }

    let cumulativeRecoupment = advance;
    
    for (let year = 1; year <= termLength; year++) {
      // Apply decay for catalog aging
      const decayRate = rightsType === 'publishing' ? 0.92 : 0.88; // Publishing decays slower
      const yearlyRevenue = baseAnnualRevenue * Math.pow(decayRate, year - 1);
      
      const netRevenue = yearlyRevenue * 0.7; // Platform fees
      const acquirerShare = dealTerms.dealType === 'acquisition' ? netRevenue : netRevenue * (royaltyRate / 100);
      
      // Recoupment calculation
      const recoupmentPayment = Math.min(cumulativeRecoupment, acquirerShare * (recoupmentRate / 100));
      cumulativeRecoupment = Math.max(0, cumulativeRecoupment - recoupmentPayment);
      
      const netEarnings = acquirerShare - recoupmentPayment;
      const artistEarnings = netRevenue - acquirerShare;
      
      // ROI calculation
      const totalInvested = advance;
      const cumulativeEarnings = projections.reduce((sum, p) => sum + p.acquirerEarnings, 0) + netEarnings;
      const roi = totalInvested > 0 ? ((cumulativeEarnings - totalInvested) / totalInvested) * 100 : 0;
      
      projections.push({
        year,
        grossRevenue: yearlyRevenue,
        netRevenue,
        artistEarnings,
        acquirerEarnings: netEarnings,
        recoupmentBalance: cumulativeRecoupment,
        roi
      });
    }

    return projections;
  }, [dealTerms, selectedTracks, rightsData]);

  return {
    projections: calculateRightsBasedProjections,
    rightsData,
    loading,
    rightsMultipliers,
    totalProjectedRevenue: calculateRightsBasedProjections.reduce((sum, p) => sum + p.acquirerEarnings, 0),
    finalROI: calculateRightsBasedProjections.length > 0 ? calculateRightsBasedProjections[calculateRightsBasedProjections.length - 1].roi : 0,
    paybackPeriod: calculateRightsBasedProjections.findIndex(p => p.roi > 0) + 1 || null
  };
};