import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { computeCatalogPipeline, defaultPipelineConfig, type SongMetaForPipeline } from '@/utils/pipelineValuation';
import { useToast } from '@/hooks/use-toast';

export interface AuditPresentationData {
  artistName: string;
  catalogSize: number;
  albumCount: number;
  singleCount: number;
  registrationGaps: {
    missingISWC: number;
    missingPRO: number;
    incompleteMetadata: number;
    total: number;
  };
  pipelineEstimate: {
    total: number;
    performance: number;
    mechanical: number;
    sync: number;
    missingImpact: number;
    confidenceLevel: 'high' | 'medium' | 'low';
  };
  searchId: string;
  generatedAt: string;
}

interface SongMetadata {
  id: string;
  song_title: string;
  metadata_completeness_score?: number | null;
  verification_status?: string | null;
  iswc?: string | null;
  publishers?: Record<string, number> | Record<string, unknown> | null;
  estimated_splits?: Record<string, number> | Record<string, unknown> | null;
  pro_registrations?: Record<string, unknown> | null;
  source_data?: Record<string, unknown> | null;
}

interface SearchData {
  id: string;
  songwriter_name: string;
  total_songs_found: number | null;
  metadata_complete_count: number | null;
  pipeline_estimate_total: number | null;
  ai_research_summary: {
    registration_gap_analysis?: {
      total_gaps?: number;
      missing_iswc?: number;
      missing_pro?: number;
    };
  } | null;
}

export function useCatalogAuditPresentation(searchId?: string, artistName?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [songMetadata, setSongMetadata] = useState<SongMetadata[]>([]);
  const [presentationData, setPresentationData] = useState<AuditPresentationData | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const isAuthoritativeIswc = (song: Pick<SongMetadata, 'verification_status' | 'source_data'>): boolean => {
    // Policy: only trust ISWCs from MLC (verified) or MusicBrainz.
    if (song.verification_status === 'mlc_verified') return true;
    const sources = (song.source_data as any)?.sources;
    return Array.isArray(sources) && (sources.includes('musicbrainz') || sources.includes('mlc'));
  };

  // Fetch search data and song metadata
  useEffect(() => {
    const fetchData = async () => {
      if (!searchId && !artistName) return;
      
      setLoading(true);
      setError(null);

      try {
        let search: SearchData | null = null;

        if (searchId) {
          const { data, error: searchError } = await supabase
            .from('song_catalog_searches')
            .select('id, songwriter_name, total_songs_found, metadata_complete_count, pipeline_estimate_total, ai_research_summary')
            .eq('id', searchId)
            .maybeSingle();

          if (searchError) throw searchError;
          
          if (!data) {
            throw new Error(`Search not found. The search may have been deleted.`);
          }
          
          search = data as SearchData;
        } else if (artistName) {
          // Find most recent search for this artist
          const { data, error: searchError } = await supabase
            .from('song_catalog_searches')
            .select('id, songwriter_name, total_songs_found, metadata_complete_count, pipeline_estimate_total, ai_research_summary')
            .ilike('songwriter_name', artistName)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (searchError) throw searchError;
          
          if (!data) {
            throw new Error(`No catalog search found for "${artistName}".`);
          }

          // If we have a search record but it produced no works, treat it as missing so
          // the UI can automatically re-run discovery.
          const totalFound = (data as any)?.total_songs_found ?? 0;
          if (!totalFound || totalFound <= 0) {
            throw new Error(`No catalog search found for "${artistName}".`);
          }
          
          search = data as SearchData;
        }

        if (!search) {
          throw new Error('No search data found');
        }

        setSearchData(search);

        // Fetch song metadata for pipeline calculations
        const { data: songs, error: songsError } = await supabase
          .from('song_metadata_cache')
          .select('id, song_title, metadata_completeness_score, verification_status, iswc, publishers, estimated_splits, pro_registrations, source_data')
          .eq('search_id', search.id);

        if (songsError) throw songsError;
        // IMPORTANT: prevent PRO/AI-derived ISWCs from showing up in the UI/PDF.
        const sanitized = ((songs || []) as SongMetadata[]).map((s) => ({
          ...s,
          iswc: isAuthoritativeIswc(s) ? s.iswc : null,
        }));
        setSongMetadata(sanitized);

      } catch (err: any) {
        console.error('Error fetching presentation data:', err);
        setError(err.message);
        // Don't show toast here - let the page component decide whether to show it
        // based on discovery state
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchId, artistName]);

  // Calculate presentation data from raw data
  const calculatedData = useMemo((): AuditPresentationData | null => {
    if (!searchData || !songMetadata.length) return null;

    // Compute pipeline using the deterministic valuation
    const pipelineMeta: SongMetaForPipeline[] = songMetadata.map(song => ({
      id: song.id,
      song_title: song.song_title,
      metadata_completeness_score: song.metadata_completeness_score ?? undefined,
      verification_status: song.verification_status ?? undefined,
      iswc: song.iswc,
      publishers: song.publishers as Record<string, number> | null | undefined,
      estimated_splits: song.estimated_splits as Record<string, number> | null | undefined,
      pro_registrations: song.pro_registrations as Record<string, unknown> | null | undefined,
    }));

    const catalog = computeCatalogPipeline(pipelineMeta, defaultPipelineConfig);
    
    // Calculate registration gaps
    const missingISWC = songMetadata.filter(s => !s.iswc).length;
    const missingPRO = songMetadata.filter(s => !s.pro_registrations || Object.keys(s.pro_registrations).length === 0).length;
    const incompleteMetadata = songMetadata.filter(s => (s.metadata_completeness_score || 0) < 0.7).length;

    // Determine confidence level
    const confidenceLevel: 'high' | 'medium' | 'low' = 
      catalog.confidenceScore >= 80 ? 'high' : 
      catalog.confidenceScore >= 60 ? 'medium' : 'low';

    // Calculate missing impact (difference between base and collectible)
    const totalBasePipeline = catalog.songResults.reduce((s, r) => s + r.basePipeline, 0);
    const missingImpact = Math.max(0, totalBasePipeline - catalog.total);

    // Album count estimation - for this table we don't have album_title, so estimate based on catalog size
    const albumCount = Math.max(1, Math.floor(songMetadata.length / 12)); // Rough estimate
    const singleCount = Math.max(0, songMetadata.length - (albumCount * 10));

    return {
      artistName: searchData.songwriter_name,
      catalogSize: songMetadata.length,
      albumCount,
      singleCount,
      registrationGaps: {
        missingISWC,
        missingPRO,
        incompleteMetadata,
        total: missingISWC + missingPRO + incompleteMetadata,
      },
      pipelineEstimate: {
        total: catalog.total,
        performance: catalog.breakdown.performance,
        mechanical: catalog.breakdown.mechanical,
        sync: catalog.breakdown.sync,
        missingImpact,
        confidenceLevel,
      },
      searchId: searchData.id,
      generatedAt: new Date().toISOString(),
    };
  }, [searchData, songMetadata]);

  useEffect(() => {
    if (calculatedData) {
      setPresentationData(calculatedData);
    }
  }, [calculatedData]);

  // Save presentation to database
  const savePresentation = async () => {
    if (!user || !presentationData) return null;

    try {
      const { data, error: saveError } = await supabase
        .from('catalog_audit_presentations')
        .insert({
          user_id: user.id,
          artist_name: presentationData.artistName,
          search_id: presentationData.searchId,
          presentation_data: presentationData as any,
          generated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (saveError) throw saveError;
      
      toast({
        title: 'Presentation Saved',
        description: 'Your audit presentation has been saved',
      });

      return data;
    } catch (err: any) {
      console.error('Error saving presentation:', err);
      toast({
        title: 'Error',
        description: 'Failed to save presentation',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update last presented timestamp
  const markAsPresented = async (presentationId: string) => {
    try {
      await supabase
        .from('catalog_audit_presentations')
        .update({ last_presented_at: new Date().toISOString() })
        .eq('id', presentationId);
    } catch (err) {
      console.error('Error updating presentation:', err);
    }
  };

  // Get top songs sorted by metadata completeness (best first)
  const topSongs = useMemo(() => {
    return [...songMetadata]
      .sort((a, b) => (b.metadata_completeness_score ?? 0) - (a.metadata_completeness_score ?? 0))
      .slice(0, 10);
  }, [songMetadata]);

  return {
    loading,
    error,
    presentationData,
    searchData,
    songMetadata,
    topSongs,
    savePresentation,
    markAsPresented,
  };
}
