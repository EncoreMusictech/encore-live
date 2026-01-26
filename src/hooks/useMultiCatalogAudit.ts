import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { computeCatalogPipeline, defaultPipelineConfig, type SongMetaForPipeline } from '@/utils/pipelineValuation';

export interface CatalogSummary {
  searchId: string;
  artistName: string;
  catalogSize: number;
  missingISWC: number;
  missingPRO: number;
  incompleteMetadata: number;
  totalGaps: number;
  pipelineTotal: number;
  performance: number;
  mechanical: number;
  sync: number;
  topMissingSongs: SongWithIssues[];
}

export interface SongWithIssues {
  id: string;
  song_title: string;
  artistName: string;
  issues: string[];
  metadata_completeness_score: number;
}

export interface AggregatedAuditData {
  catalogs: CatalogSummary[];
  totals: {
    catalogCount: number;
    totalWorks: number;
    missingISWC: number;
    missingPRO: number;
    incompleteMetadata: number;
    totalGaps: number;
    pipelineTotal: number;
    performance: number;
    mechanical: number;
    sync: number;
  };
  allMissingSongs: SongWithIssues[];
  generatedAt: string;
}

interface SelectedCatalog {
  searchId: string;
  artistName: string;
  songCount: number;
}

const isAuthoritativeIswc = (song: { verification_status?: string | null; source_data?: unknown }): boolean => {
  if (song.verification_status === 'mlc_verified') return true;
  const sources = (song.source_data as any)?.sources;
  return Array.isArray(sources) && (sources.includes('musicbrainz') || sources.includes('mlc'));
};

export function useMultiCatalogAudit() {
  const [selectedCatalogs, setSelectedCatalogs] = useState<SelectedCatalog[]>([]);
  const [loading, setLoading] = useState(false);
  const [aggregatedData, setAggregatedData] = useState<AggregatedAuditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const addCatalog = useCallback((catalog: SelectedCatalog) => {
    setSelectedCatalogs(prev => {
      if (prev.some(c => c.searchId === catalog.searchId)) {
        toast({
          title: 'Already added',
          description: `${catalog.artistName} is already in your selection`,
          variant: 'destructive',
        });
        return prev;
      }
      return [...prev, catalog];
    });
  }, [toast]);

  const removeCatalog = useCallback((searchId: string) => {
    setSelectedCatalogs(prev => prev.filter(c => c.searchId !== searchId));
  }, []);

  const clearCatalogs = useCallback(() => {
    setSelectedCatalogs([]);
    setAggregatedData(null);
  }, []);

  const fetchAggregatedData = useCallback(async () => {
    if (selectedCatalogs.length === 0) {
      toast({
        title: 'No catalogs selected',
        description: 'Add at least one catalog to generate a report',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const catalogSummaries: CatalogSummary[] = [];

      for (const catalog of selectedCatalogs) {
        // Fetch songs for this catalog
        const { data: songs, error: songsError } = await supabase
          .from('song_metadata_cache')
          .select('id, song_title, metadata_completeness_score, verification_status, iswc, publishers, estimated_splits, pro_registrations, source_data')
          .eq('search_id', catalog.searchId);

        if (songsError) throw songsError;

        // Sanitize ISWCs (only show authoritative ones)
        const sanitizedSongs = (songs || []).map(s => ({
          ...s,
          iswc: isAuthoritativeIswc(s) ? s.iswc : null,
        }));

        // Calculate pipeline
        const pipelineMeta: SongMetaForPipeline[] = sanitizedSongs.map(song => ({
          id: song.id,
          song_title: song.song_title,
          metadata_completeness_score: song.metadata_completeness_score ?? undefined,
          verification_status: song.verification_status ?? undefined,
          iswc: song.iswc,
          publishers: song.publishers as Record<string, number> | null | undefined,
          estimated_splits: song.estimated_splits as Record<string, number> | null | undefined,
          pro_registrations: song.pro_registrations as Record<string, unknown> | null | undefined,
        }));

        const pipelineResult = computeCatalogPipeline(pipelineMeta, defaultPipelineConfig);

        // Calculate gaps
        const missingISWC = sanitizedSongs.filter(s => !s.iswc).length;
        const missingPRO = sanitizedSongs.filter(s => {
          const regs = s.pro_registrations as Record<string, unknown> | null;
          if (!regs) return true;
          const hasAnyPRO = regs.ASCAP || regs.BMI || regs.SESAC || regs.MLC;
          return !hasAnyPRO;
        }).length;
        const incompleteMetadata = sanitizedSongs.filter(s => (s.metadata_completeness_score || 0) < 0.7).length;

        // Find top 5 songs with issues
        const songsWithIssues: SongWithIssues[] = sanitizedSongs
          .map(song => {
            const issues: string[] = [];
            if (!song.iswc) issues.push('Missing ISWC');
            const regs = song.pro_registrations as Record<string, unknown> | null;
            const hasAnyPRO = regs && (regs.ASCAP || regs.BMI || regs.SESAC || regs.MLC);
            if (!hasAnyPRO) issues.push('Missing PRO');
            if ((song.metadata_completeness_score || 0) < 0.7) issues.push('Incomplete Metadata');
            
            return {
              id: song.id,
              song_title: song.song_title,
              artistName: catalog.artistName,
              issues,
              metadata_completeness_score: song.metadata_completeness_score || 0,
            };
          })
          .filter(s => s.issues.length > 0)
          .sort((a, b) => b.issues.length - a.issues.length || a.metadata_completeness_score - b.metadata_completeness_score)
          .slice(0, 5);

        catalogSummaries.push({
          searchId: catalog.searchId,
          artistName: catalog.artistName,
          catalogSize: sanitizedSongs.length,
          missingISWC,
          missingPRO,
          incompleteMetadata,
          totalGaps: missingISWC + missingPRO + incompleteMetadata,
          pipelineTotal: pipelineResult.total,
          performance: pipelineResult.breakdown.performance,
          mechanical: pipelineResult.breakdown.mechanical,
          sync: pipelineResult.breakdown.sync,
          topMissingSongs: songsWithIssues,
        });
      }

      // Calculate aggregated totals
      const totals = catalogSummaries.reduce(
        (acc, cat) => ({
          catalogCount: acc.catalogCount + 1,
          totalWorks: acc.totalWorks + cat.catalogSize,
          missingISWC: acc.missingISWC + cat.missingISWC,
          missingPRO: acc.missingPRO + cat.missingPRO,
          incompleteMetadata: acc.incompleteMetadata + cat.incompleteMetadata,
          totalGaps: acc.totalGaps + cat.totalGaps,
          pipelineTotal: acc.pipelineTotal + cat.pipelineTotal,
          performance: acc.performance + cat.performance,
          mechanical: acc.mechanical + cat.mechanical,
          sync: acc.sync + cat.sync,
        }),
        {
          catalogCount: 0,
          totalWorks: 0,
          missingISWC: 0,
          missingPRO: 0,
          incompleteMetadata: 0,
          totalGaps: 0,
          pipelineTotal: 0,
          performance: 0,
          mechanical: 0,
          sync: 0,
        }
      );

      // Collect all missing songs across catalogs
      const allMissingSongs = catalogSummaries
        .flatMap(cat => cat.topMissingSongs)
        .sort((a, b) => b.issues.length - a.issues.length);

      const result: AggregatedAuditData = {
        catalogs: catalogSummaries,
        totals,
        allMissingSongs,
        generatedAt: new Date().toISOString(),
      };

      setAggregatedData(result);

      toast({
        title: 'Report Generated',
        description: `Aggregated data for ${catalogSummaries.length} catalog(s)`,
      });

      return result;
    } catch (err: any) {
      console.error('Error fetching aggregated data:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to generate aggregated report',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedCatalogs, toast]);

  return {
    selectedCatalogs,
    addCatalog,
    removeCatalog,
    clearCatalogs,
    loading,
    error,
    aggregatedData,
    fetchAggregatedData,
  };
}

// Standalone function for direct fetching (bypasses hook state)
export async function fetchAggregatedDataDirect(
  catalogs: { searchId: string; artistName: string; songCount: number }[]
): Promise<AggregatedAuditData | null> {
  if (catalogs.length === 0) return null;

  try {
    const catalogSummaries: CatalogSummary[] = [];

    for (const catalog of catalogs) {
      // Fetch songs for this catalog
      const { data: songs, error: songsError } = await supabase
        .from('song_metadata_cache')
        .select('id, song_title, metadata_completeness_score, verification_status, iswc, publishers, estimated_splits, pro_registrations, source_data')
        .eq('search_id', catalog.searchId);

      if (songsError) throw songsError;

      // Sanitize ISWCs (only show authoritative ones)
      const sanitizedSongs = (songs || []).map(s => ({
        ...s,
        iswc: isAuthoritativeIswc(s) ? s.iswc : null,
      }));

      // Calculate pipeline
      const pipelineMeta: SongMetaForPipeline[] = sanitizedSongs.map(song => ({
        id: song.id,
        song_title: song.song_title,
        metadata_completeness_score: song.metadata_completeness_score ?? undefined,
        verification_status: song.verification_status ?? undefined,
        iswc: song.iswc,
        publishers: song.publishers as Record<string, number> | null | undefined,
        estimated_splits: song.estimated_splits as Record<string, number> | null | undefined,
        pro_registrations: song.pro_registrations as Record<string, unknown> | null | undefined,
      }));

      const pipelineResult = computeCatalogPipeline(pipelineMeta, defaultPipelineConfig);

      // Calculate gaps
      const missingISWC = sanitizedSongs.filter(s => !s.iswc).length;
      const missingPRO = sanitizedSongs.filter(s => {
        const regs = s.pro_registrations as Record<string, unknown> | null;
        if (!regs) return true;
        const hasAnyPRO = regs.ASCAP || regs.BMI || regs.SESAC || regs.MLC;
        return !hasAnyPRO;
      }).length;
      const incompleteMetadata = sanitizedSongs.filter(s => (s.metadata_completeness_score || 0) < 0.7).length;

      // Find top 5 songs with issues
      const songsWithIssues: SongWithIssues[] = sanitizedSongs
        .map(song => {
          const issues: string[] = [];
          if (!song.iswc) issues.push('Missing ISWC');
          const regs = song.pro_registrations as Record<string, unknown> | null;
          const hasAnyPRO = regs && (regs.ASCAP || regs.BMI || regs.SESAC || regs.MLC);
          if (!hasAnyPRO) issues.push('Missing PRO');
          if ((song.metadata_completeness_score || 0) < 0.7) issues.push('Incomplete Metadata');
          
          return {
            id: song.id,
            song_title: song.song_title,
            artistName: catalog.artistName,
            issues,
            metadata_completeness_score: song.metadata_completeness_score || 0,
          };
        })
        .filter(s => s.issues.length > 0)
        .sort((a, b) => b.issues.length - a.issues.length || a.metadata_completeness_score - b.metadata_completeness_score)
        .slice(0, 5);

      catalogSummaries.push({
        searchId: catalog.searchId,
        artistName: catalog.artistName,
        catalogSize: sanitizedSongs.length,
        missingISWC,
        missingPRO,
        incompleteMetadata,
        totalGaps: missingISWC + missingPRO + incompleteMetadata,
        pipelineTotal: pipelineResult.total,
        performance: pipelineResult.breakdown.performance,
        mechanical: pipelineResult.breakdown.mechanical,
        sync: pipelineResult.breakdown.sync,
        topMissingSongs: songsWithIssues,
      });
    }

    // Calculate aggregated totals
    const totals = catalogSummaries.reduce(
      (acc, cat) => ({
        catalogCount: acc.catalogCount + 1,
        totalWorks: acc.totalWorks + cat.catalogSize,
        missingISWC: acc.missingISWC + cat.missingISWC,
        missingPRO: acc.missingPRO + cat.missingPRO,
        incompleteMetadata: acc.incompleteMetadata + cat.incompleteMetadata,
        totalGaps: acc.totalGaps + cat.totalGaps,
        pipelineTotal: acc.pipelineTotal + cat.pipelineTotal,
        performance: acc.performance + cat.performance,
        mechanical: acc.mechanical + cat.mechanical,
        sync: acc.sync + cat.sync,
      }),
      {
        catalogCount: 0,
        totalWorks: 0,
        missingISWC: 0,
        missingPRO: 0,
        incompleteMetadata: 0,
        totalGaps: 0,
        pipelineTotal: 0,
        performance: 0,
        mechanical: 0,
        sync: 0,
      }
    );

    // Collect all missing songs across catalogs
    const allMissingSongs = catalogSummaries
      .flatMap(cat => cat.topMissingSongs)
      .sort((a, b) => b.issues.length - a.issues.length);

    return {
      catalogs: catalogSummaries,
      totals,
      allMissingSongs,
      generatedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('Error fetching aggregated data:', err);
    return null;
  }
}
