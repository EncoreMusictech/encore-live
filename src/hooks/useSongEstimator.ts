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
  webhook_status?: string;
  webhook_sent_at?: string;
  webhook_response?: string;
  webhook_error?: string;
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

interface CareerSummary {
  songwriterName: string;
  careerSummary: string;
  generatedAt: string;
}

export function useSongEstimator() {
  const [searches, setSearches] = useState<SongCatalogSearch[]>([]);
  const [currentSearch, setCurrentSearch] = useState<SongCatalogSearch | null>(null);
  const [songMetadata, setSongMetadata] = useState<SongMetadata[]>([]);
  const [pipelineEstimates, setPipelineEstimates] = useState<PipelineEstimate[]>([]);
  const [careerSummary, setCareerSummary] = useState<CareerSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [bmiVerificationLoading, setBmiVerificationLoading] = useState(false);
  const [careerSummaryLoading, setCareerSummaryLoading] = useState(false);
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
          search_parameters: searchParameters,
          webhook_status: 'skipped'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Search created",
        description: `Started research for ${songwriterName}`,
      });

      // n8n webhook flow removed; using direct agents now (no external webhook)

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
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to run research",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      // Update search status to processing
      await supabase
        .from('song_catalog_searches')
        .update({ search_status: 'processing' })
        .eq('id', searchId);

      const { data, error } = await supabase.functions.invoke('deterministic-catalog-discovery', {
        body: {
          searchId,
          writerName: songwriterName,
          userId: user.id, // ensure we always pass a valid user id
          // Large values can time out the Edge Function due to MusicBrainz rate limits.
          maxSongs: 75,
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Discovery Complete",
          description: `${data.discovered} songs discovered and inserted`,
        });

        await fetchSearches();
        return data;
      } else {
        throw new Error(data?.error || 'Discovery failed');
      }
    } catch (err: any) {
      console.error('Error running AI research:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: err?.message || "AI research failed",
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

  // Bulk MLC verification for a search (background processing)
  const runBulkMLCVerification = async (searchId: string) => {
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
          description: "No songs available for MLC verification",
          variant: "destructive"
        });
        return;
      }

      // Create background job for bulk MLC lookup
      const { data: jobData, error: jobError } = await supabase.functions.invoke('song-research-background-processor', {
        body: {
          action: 'create_job',
          user_id: user.id,
          search_id: searchId,
          job_type: 'bulk_mlc_lookup',
          job_data: {
            songs: songs,
            batchSize: 5
          },
          priority: 8
        }
      });

      if (jobError) throw jobError;

      toast({
        title: "MLC Verification Started",
        description: `Background processing initiated for ${songs.length} songs. You'll be notified when complete.`,
      });

      // Start polling for job status
      startJobStatusPolling(jobData.job_id, searchId);

    } catch (err) {
      console.error('Error starting MLC verification:', err);
      toast({
        title: "MLC Verification Error",
        description: err.message || "Failed to start MLC verification",
        variant: "destructive"
      });
    } finally {
      setBmiVerificationLoading(false);
    }
  };

  // Bulk BMI verification for a search (background processing)
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

      // Create background job for bulk BMI verification
      const { data: jobData, error: jobError } = await supabase.functions.invoke('song-research-background-processor', {
        body: {
          action: 'create_job',
          user_id: user.id,
          search_id: searchId,
          job_type: 'bulk_bmi_verification',
          job_data: {
            songs: songs,
            batchSize: 3
          },
          priority: 7
        }
      });

      if (jobError) throw jobError;

      toast({
        title: "BMI Verification Started",
        description: `Background processing initiated for ${songs.length} songs. You'll be notified when complete.`,
      });

      // Start polling for job status
      startJobStatusPolling(jobData.job_id, searchId);

    } catch (err) {
      console.error('Error starting BMI verification:', err);
      toast({
        title: "BMI Verification Error", 
        description: err.message || "Failed to start BMI verification",
        variant: "destructive"
      });
    } finally {
      setBmiVerificationLoading(false);
    }
  };

  // Job status polling
  const [activeJobs, setActiveJobs] = useState<Set<string>>(new Set());
  
  const startJobStatusPolling = (jobId: string, searchId: string) => {
    if (activeJobs.has(jobId)) return;
    
    setActiveJobs(prev => new Set(prev).add(jobId));
    
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('song-research-background-processor', {
          body: {
            action: 'check_status',
            job_id: jobId
          }
        });

        if (error) throw error;

        const job = data.job;
        
        if (job.status === 'completed') {
          clearInterval(pollInterval);
          setActiveJobs(prev => {
            const newSet = new Set(prev);
            newSet.delete(jobId);
            return newSet;
          });

          const results = job.results;
          toast({
            title: "Background Processing Complete",
            description: `${results.successCount}/${results.totalProcessed} songs processed successfully`,
          });

          // Refresh data
          await fetchSongMetadata(searchId);
          await fetchSearches();
          
        } else if (job.status === 'failed') {
          clearInterval(pollInterval);
          setActiveJobs(prev => {
            const newSet = new Set(prev);
            newSet.delete(jobId);
            return newSet;
          });

          toast({
            title: "Background Processing Failed",
            description: job.error_message || "Processing failed",
            variant: "destructive"
          });
        }
        // Continue polling if status is 'pending' or 'processing'
        
      } catch (error) {
        console.error('Job status polling error:', error);
        clearInterval(pollInterval);
        setActiveJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      }
    }, 5000); // Poll every 5 seconds

    // Clean up after 10 minutes max
    setTimeout(() => {
      clearInterval(pollInterval);
      setActiveJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }, 10 * 60 * 1000);
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

  // Fetch career summary for a songwriter
  const fetchCareerSummary = async (songwriterName: string, additionalContext?: string) => {
    setCareerSummaryLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('songwriter-career-summary', {
        body: {
          songwriterName,
          additionalContext
        }
      });

      if (error) throw error;

      setCareerSummary(data);
      
      toast({
        title: "Career Summary Generated",
        description: `Generated career summary for ${songwriterName}`,
      });

      return data;
    } catch (err) {
      console.error('Error fetching career summary:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to generate career summary",
        variant: "destructive"
      });
      return null;
    } finally {
      setCareerSummaryLoading(false);
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
    careerSummary,
    loading,
    bmiVerificationLoading,
    careerSummaryLoading,
    error,
    activeJobs,

    // Actions
    createSearch,
    runAIResearch,
    fetchSongMetadata,
    fetchPipelineEstimates,
    fetchCareerSummary,
    refreshSearch,
    deleteSearch,
    runBulkMLCVerification,
    runBulkBMIVerification,
    verifySongWithBMI,
    refreshCacheForSearch,
    setCurrentSearch,
    refetch: fetchSearches
  };
}