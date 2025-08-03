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

        // If this was initial search, process the results
        if (sessionType === 'initial_search' && data.aiResponse) {
          await processInitialSearchResults(searchId, data.aiResponse);
        }

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

  // Fetch song metadata for a search
  const fetchSongMetadata = async (searchId: string) => {
    try {
      const { data, error } = await supabase
        .from('song_metadata_cache')
        .select('*')
        .eq('search_id', searchId)
        .order('metadata_completeness_score', { ascending: false });

      if (error) throw error;
      setSongMetadata(data || []);
      return data;
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

  useEffect(() => {
    if (user) {
      fetchSearches();
    }
  }, [user]);

  return {
    // State
    searches,
    currentSearch,
    songMetadata,
    pipelineEstimates,
    loading,
    error,

    // Actions
    createSearch,
    runAIResearch,
    fetchSongMetadata,
    fetchPipelineEstimates,
    refreshSearch,
    deleteSearch,
    setCurrentSearch,
    refetch: fetchSearches
  };
}