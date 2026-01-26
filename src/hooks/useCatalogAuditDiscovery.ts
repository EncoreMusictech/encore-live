import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type DiscoveryStep = 'idle' | 'creating' | 'musicbrainz' | 'pro_lookup' | 'enriching' | 'completed' | 'error';

interface DiscoveryState {
  step: DiscoveryStep;
  progress: number;
  message: string;
  searchId: string | null;
  songsFound: number;
}

export function useCatalogAuditDiscovery() {
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState>({
    step: 'idle',
    progress: 0,
    message: '',
    searchId: null,
    songsFound: 0,
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  const updateState = (updates: Partial<DiscoveryState>) => {
    setDiscoveryState(prev => ({ ...prev, ...updates }));
  };

  const runCatalogDiscovery = useCallback(async (artistName: string): Promise<string | null> => {

    try {
      // Step 1: Create search record
      updateState({ step: 'creating', progress: 10, message: 'Initializing catalog search...' });
      
      const { data: searchRecord, error: createError } = await supabase
        .from('song_catalog_searches')
        .insert({
          user_id: user?.id || null,
          songwriter_name: artistName,
          search_status: 'processing',
          search_parameters: { source: 'catalog-audit' },
          webhook_status: 'skipped',
        })
        .select()
        .single();

      if (createError) throw createError;
      
      const searchId = searchRecord.id;
      updateState({ searchId, step: 'musicbrainz', progress: 20, message: 'Searching MusicBrainz database...' });

      // Step 2: Call the deterministic-catalog-discovery edge function
      updateState({ step: 'musicbrainz', progress: 30, message: 'Discovering catalog from MusicBrainz & PRO databases...' });
      
      const { data: discoveryResult, error: discoveryError } = await supabase.functions.invoke(
        'deterministic-catalog-discovery',
        {
          body: {
            searchId,
            writerName: artistName,
            maxSongs: 75,
            // Only include userId if user is authenticated
            ...(user?.id && { userId: user.id }),
          },
        }
      );

      if (discoveryError) {
        console.error('Discovery error:', discoveryError);
        // Don't throw - the function may have still saved some results
      }

      updateState({ step: 'pro_lookup', progress: 60, message: 'Cross-referencing PRO registrations...' });

      // Step 3: Poll for completion (the edge function runs async)
      let attempts = 0;
      const maxAttempts = 30; // 30 * 2s = 60 seconds max wait
      let searchStatus = 'processing';
      let songsFound = 0;

      while (attempts < maxAttempts && searchStatus === 'processing') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: statusCheck, error: statusError } = await supabase
          .from('song_catalog_searches')
          .select('search_status, total_songs_found')
          .eq('id', searchId)
          .single();

        if (statusError) {
          console.error('Status check error:', statusError);
          break;
        }

        searchStatus = statusCheck?.search_status || 'processing';
        songsFound = statusCheck?.total_songs_found || 0;
        
        // Update progress based on status
        const progressValue = Math.min(60 + (attempts * 2), 90);
        updateState({ 
          progress: progressValue, 
          songsFound,
          message: songsFound > 0 
            ? `Found ${songsFound} songs, analyzing metadata...` 
            : 'Searching PRO databases...'
        });

        attempts++;
      }

      updateState({ step: 'enriching', progress: 95, message: 'Finalizing catalog analysis...' });

      // Step 4: Check final status
      const { data: finalSearch, error: finalError } = await supabase
        .from('song_catalog_searches')
        .select('search_status, total_songs_found')
        .eq('id', searchId)
        .single();

      if (finalError) throw finalError;

      if (finalSearch?.search_status === 'error') {
        throw new Error('Discovery failed');
      }

      updateState({ 
        step: 'completed', 
        progress: 100, 
        message: `Discovery complete! Found ${finalSearch?.total_songs_found || 0} songs.`,
        songsFound: finalSearch?.total_songs_found || 0,
      });

      toast({
        title: 'Catalog Discovery Complete',
        description: `Found ${finalSearch?.total_songs_found || 0} songs for ${artistName}`,
      });

      return searchId;

    } catch (err: any) {
      console.error('Catalog discovery error:', err);
      updateState({ 
        step: 'error', 
        progress: 0, 
        message: err.message || 'Discovery failed' 
      });
      toast({
        title: 'Discovery Failed',
        description: err.message || 'Failed to discover catalog',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  const resetDiscovery = useCallback(() => {
    setDiscoveryState({
      step: 'idle',
      progress: 0,
      message: '',
      searchId: null,
      songsFound: 0,
    });
  }, []);

  return {
    discoveryState,
    runCatalogDiscovery,
    resetDiscovery,
    isDiscovering: discoveryState.step !== 'idle' && discoveryState.step !== 'completed' && discoveryState.step !== 'error',
  };
}
