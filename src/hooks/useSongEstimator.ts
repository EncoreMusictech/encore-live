import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface SongCatalogSearch {
  id: string;
  songwriter_name: string;
  search_status: string;
  total_songs_found: number;
  metadata_complete_count: number;
  pipeline_estimate_total: number;
  last_refreshed_at?: string;
  created_at: string;
  search_parameters: any;
  ai_research_summary: any;
}

interface SongMetadata {
  id: string;
  song_title: string;
  songwriter_name: string;
  co_writers: string[];
  publishers: any;
  pro_registrations: any;
  iswc?: string;
  estimated_splits: any;
  registration_gaps: string[];
  metadata_completeness_score: number;
  verification_status: string;
  source_data: any;
}

interface PipelineEstimate {
  id: string;
  estimate_type: string;
  annual_estimate: number;
  confidence_level: string;
  calculation_method?: string;
  factors_considered: any;
  missing_registrations_impact: number;
  potential_upside: number;
}

export function useSongEstimator() {
  const [searches, setSearches] = useState<SongCatalogSearch[]>([]);
  const [currentSearch, setCurrentSearch] = useState<SongCatalogSearch | null>(null);
  const [songMetadata, setSongMetadata] = useState<SongMetadata[]>([]);
  const [pipelineEstimates, setPipelineEstimates] = useState<PipelineEstimate[]>([]);
  const [loading, setLoading] = useState(false);
  const [bmiVerificationLoading, setBmiVerificationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch user's catalog searches
  const fetchSearches = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('song_catalog_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSearches(data || []);
    } catch (err) {
      console.error('Error fetching searches:', err);
      setError(err.message);
    }
  };

  // Create new search
  const createSearch = async (songwriterName: string, searchParameters = {}) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create searches",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('song_catalog_searches')
        .insert({
          user_id: user.id,
          songwriter_name: songwriterName,
          search_status: 'pending',
          search_parameters: searchParameters
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Search created",
        description: `Started research for ${songwriterName}`,
      });

      await fetchSearches();
      return data;
    } catch (err) {
      console.error('Error creating search:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to create search",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Run AI research
  const runAIResearch = async (
    searchId: string, 
    songwriterName: string, 
    sessionType: 'initial_search' | 'metadata_enhancement' | 'pipeline_analysis',
    additionalContext = {}
  ) => {
    setLoading(true);
    try {
      // Update search status to processing
      await supabase
        .from('song_catalog_searches')
        .update({ search_status: 'processing' })
        .eq('id', searchId);

      const { data, error } = await supabase.functions.invoke('song-estimator-ai', {
        body: {
          songwriterName,
          sessionType,
          searchId,
          additionalContext
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "AI Research Complete",
          description: data.summary,
        });

        // Results are now processed directly by the edge function

        await fetchSearches();
        return data;
      } else {
        throw new Error(data.error || 'AI research failed');
      }
    } catch (err) {
      console.error('Error running AI research:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "AI research failed",
        variant: "destructive"
      });

      // Update search status to error
      await supabase
        .from('song_catalog_searches')
        .update({ search_status: 'error' })
        .eq('id', searchId);

      return null;
    } finally {
      setLoading(false);
    }
  };

  // Process initial search results
  const processInitialSearchResults = async (searchId: string, aiResponse: any) => {
    try {
      const songs = aiResponse.catalog_analysis?.songs || [];
      const totalSongs = songs.length;

      // Insert song metadata
      if (songs.length > 0) {
        const songMetadata = songs.map((song: any) => ({
          search_id: searchId,
          user_id: user.id,
          song_title: song.title,
          songwriter_name: song.songwriter || aiResponse.songwriter_name,
          co_writers: song.co_writers || [],
          publishers: song.publishers || {},
          pro_registrations: song.pro_registrations || {},
          iswc: song.iswc,
          estimated_splits: song.splits || {},
          registration_gaps: song.registration_gaps || [],
          metadata_completeness_score: song.completeness_score || 0.5,
          verification_status: 'ai_generated',
          source_data: { ai_session: true, confidence: aiResponse.confidence_score }
        }));

        const { error: metadataError } = await supabase
          .from('song_metadata_cache')
          .insert(songMetadata);

        if (metadataError) {
          console.error('Error inserting metadata:', metadataError);
        }
      }

      // Update search with summary
      const { error: updateError } = await supabase
        .from('song_catalog_searches')
        .update({
          search_status: 'completed',
          total_songs_found: totalSongs,
          metadata_complete_count: songs.filter((s: any) => s.completeness_score > 0.7).length,
          pipeline_estimate_total: aiResponse.royalty_pipeline?.total_estimate || 0,
          last_refreshed_at: new Date().toISOString(),
          ai_research_summary: aiResponse
        })
        .eq('id', searchId);

      if (updateError) {
        console.error('Error updating search:', updateError);
      }

    } catch (err) {
      console.error('Error processing search results:', err);
    }
  };

  // Fetch song metadata for a search - prioritize most recent verified data
  const fetchSongMetadata = async (searchId: string) => {
    try {
      const { data, error } = await supabase
        .from('song_metadata_cache')
        .select('*')
        .eq('search_id', searchId)
        .order('last_verified_at', { ascending: false })
        .order('metadata_completeness_score', { ascending: false });

      if (error) throw error;
      
      // Filter to get only the most recent entry per song
      const uniqueSongs = new Map();
      for (const song of data || []) {
        const key = `${song.song_title.toLowerCase()}_${song.songwriter_name.toLowerCase()}`;
        if (!uniqueSongs.has(key) || 
            (song.verification_status === 'bmi_verified' && uniqueSongs.get(key).verification_status !== 'bmi_verified')) {
          uniqueSongs.set(key, song);
        }
      }
      
      const uniqueData = Array.from(uniqueSongs.values());
      setSongMetadata(uniqueData);
      return uniqueData;
    } catch (err) {
      console.error('Error fetching song metadata:', err);
      setError(err.message);
      return [];
    }
  };

  // Fetch pipeline estimates for a song
  const fetchPipelineEstimates = async (songMetadataId: string) => {
    try {
      const { data, error } = await supabase
        .from('royalty_pipeline_estimates')
        .select('*')
        .eq('song_metadata_id', songMetadataId)
        .order('estimate_type');

      if (error) throw error;
      setPipelineEstimates(data || []);
      return data;
    } catch (err) {
      console.error('Error fetching pipeline estimates:', err);
      setError(err.message);
      return [];
    }
  };

  // Refresh search data
  const refreshSearch = async (searchId: string, songwriterName: string) => {
    await runAIResearch(searchId, songwriterName, 'initial_search');
  };

  // Delete search
  const deleteSearch = async (searchId: string) => {
    try {
      const { error } = await supabase
        .from('song_catalog_searches')
        .delete()
        .eq('id', searchId);

      if (error) throw error;

      toast({
        title: "Search deleted",
        description: "Search and all related data removed",
      });

      await fetchSearches();
    } catch (err) {
      console.error('Error deleting search:', err);
      toast({
        title: "Error",
        description: "Failed to delete search",
        variant: "destructive"
      });
    }
  };

  // Bulk BMI verification for a search
  const runBulkBMIVerification = async (searchId: string) => {
    setBmiVerificationLoading(true);
    try {
      // Get all songs for this search
      const { data: songs, error: fetchError } = await supabase
        .from('song_metadata_cache')
        .select('*')
        .eq('search_id', searchId);

      if (fetchError) throw fetchError;

      if (!songs || songs.length === 0) {
        toast({
          title: "No songs found",
          description: "No songs available for BMI verification",
          variant: "destructive"
        });
        return;
      }

      // Prepare songs for bulk lookup
      const songsForLookup = songs.map(song => ({
        id: song.id,
        songTitle: song.song_title,
        writerName: song.songwriter_name
      }));

      const { data, error } = await supabase.functions.invoke('bulk-bmi-lookup', {
        body: {
          songs: songsForLookup,
          batchSize: 5,
          delayMs: 1000
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "BMI Verification Complete",
          description: `${data.bmi_matches_found}/${data.total_processed} songs verified with BMI (${data.summary.verification_rate}% success rate)`,
        });

        // Refresh the song metadata
        await fetchSongMetadata(searchId);
        
        // Update search metadata complete count
        const verifiedCount = data.bmi_matches_found;
        await supabase
          .from('song_catalog_searches')
          .update({ 
            metadata_complete_count: verifiedCount,
            last_refreshed_at: new Date().toISOString()
          })
          .eq('id', searchId);

        await fetchSearches();
      } else {
        throw new Error(data.error || 'BMI verification failed');
      }
    } catch (err) {
      console.error('Error running BMI verification:', err);
      toast({
        title: "BMI Verification Error",
        description: err.message || "Failed to verify songs with BMI",
        variant: "destructive"
      });
    } finally {
      setBmiVerificationLoading(false);
    }
  };

  // Single song BMI verification
  const verifySongWithBMI = async (songId: string, songTitle: string, writerName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-bmi-agent', {
        body: { 
          workTitle: songTitle, 
          writerName: writerName 
        }
      });

      if (error) throw error;

      if (data?.found) {
        // Update song metadata with BMI data
        const updateData: any = {
          verification_status: 'bmi_verified',
          metadata_completeness_score: 0.95,
          pro_registrations: {
            bmi: {
              verified: true,
              publishers: data.publishers || [],
              writers: data.writers || [],
              iswc: data.iswc,
              lookup_date: new Date().toISOString()
            }
          },
          last_verified_at: new Date().toISOString()
        };

        if (data.publishers?.length > 0) {
          updateData.publishers = data.publishers.reduce((acc: any, pub: any) => {
            acc[pub.name] = pub.share || 0;
            return acc;
          }, {});
        }

        if (data.writers?.length > 0) {
          updateData.co_writers = data.writers.map((w: any) => w.name);
          updateData.estimated_splits = data.writers.reduce((acc: any, writer: any) => {
            acc[writer.name] = writer.share || 0;
            return acc;
          }, {});
        }

        if (data.iswc) {
          updateData.iswc = data.iswc;
        }

        const { error: updateError } = await supabase
          .from('song_metadata_cache')
          .update(updateData)
          .eq('id', songId);

        if (updateError) throw updateError;

        toast({
          title: "BMI Verification Success",
          description: `${songTitle} verified with BMI data`,
        });

        return true;
      } else {
        toast({
          title: "No BMI Data Found",
          description: `No BMI registration found for ${songTitle}`,
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      console.error('Error verifying song with BMI:', err);
      toast({
        title: "BMI Verification Error",
        description: `Failed to verify ${songTitle} with BMI`,
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchSearches();
    }
  }, [user]);

  // Refresh cache for a search - clean up old entries and prioritize verified data
  const refreshCacheForSearch = async (searchId: string) => {
    try {
      // Get all cache entries for this search
      const { data: allEntries, error: fetchError } = await supabase
        .from('song_metadata_cache')
        .select('*')
        .eq('search_id', searchId);

      if (fetchError) throw fetchError;

      // Group by song title and songwriter
      const songGroups = new Map();
      for (const entry of allEntries || []) {
        const key = `${entry.song_title.toLowerCase()}_${entry.songwriter_name.toLowerCase()}`;
        if (!songGroups.has(key)) {
          songGroups.set(key, []);
        }
        songGroups.get(key).push(entry);
      }

      // For each song, keep only the most recent verified entry and delete duplicates
      for (const [songKey, entries] of songGroups) {
        if (entries.length <= 1) continue;

        // Sort by verification status and date
        entries.sort((a, b) => {
          if (a.verification_status === 'bmi_verified' && b.verification_status !== 'bmi_verified') return -1;
          if (b.verification_status === 'bmi_verified' && a.verification_status !== 'bmi_verified') return 1;
          return new Date(b.last_verified_at || b.created_at).getTime() - new Date(a.last_verified_at || a.created_at).getTime();
        });

        // Keep the best entry, delete the rest
        const entriesToDelete = entries.slice(1);
        const idsToDelete = entriesToDelete.map(e => e.id);

        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('song_metadata_cache')
            .delete()
            .in('id', idsToDelete);

          if (deleteError) {
            console.error('Error cleaning up duplicate entries:', deleteError);
          }
        }
      }

      toast({
        title: "Cache Refreshed",
        description: "Cleaned up duplicate entries and prioritized verified data",
      });

    } catch (err) {
      console.error('Error refreshing cache:', err);
      toast({
        title: "Cache Refresh Error",
        description: "Failed to refresh cache",
        variant: "destructive"
      });
    }
  };

  return {
    // State
    searches,
    currentSearch,
    songMetadata,
    pipelineEstimates,
    loading,
    bmiVerificationLoading,
    error,

    // Actions
    createSearch,
    runAIResearch,
    fetchSongMetadata,
    fetchPipelineEstimates,
    refreshSearch,
    deleteSearch,
    runBulkBMIVerification,
    verifySongWithBMI,
    refreshCacheForSearch,
    setCurrentSearch,
    refetch: fetchSearches
  };
}