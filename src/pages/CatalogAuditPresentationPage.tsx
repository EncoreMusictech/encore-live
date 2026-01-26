import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CatalogAuditPresentation } from '@/components/catalog-audit/CatalogAuditPresentation';
import { AuditPresentationSelector } from '@/components/catalog-audit/AuditPresentationSelector';
import { MultiCatalogSelector } from '@/components/catalog-audit/MultiCatalogSelector';
import { MultiCatalogPresentation } from '@/components/catalog-audit/MultiCatalogPresentation';
import { CatalogDiscoveryProgress } from '@/components/catalog-audit/CatalogDiscoveryProgress';
import { useCatalogAuditPresentation } from '@/hooks/useCatalogAuditPresentation';
import { useCatalogAuditDiscovery } from '@/hooks/useCatalogAuditDiscovery';
import { useMultiCatalogAudit, type AggregatedAuditData } from '@/hooks/useMultiCatalogAudit';
import { generateCatalogAuditPdf } from '@/utils/catalogAuditPdfGenerator';
import { generateMultiCatalogAuditPdf } from '@/utils/multiCatalogAuditPdfGenerator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CatalogAuditPresentationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const searchId = searchParams.get('searchId');
  const artistName = searchParams.get('artist');
  const isMultiMode = searchParams.get('mode') === 'multi';
  const isMultiPresentation = searchParams.get('multi') === 'true';
  const searchIdsParam = searchParams.get('searchIds');
  
  // Check if we have params - if not, show the selector
  const hasParams = Boolean(searchId || artistName || isMultiMode || isMultiPresentation);
  
  // Multi-catalog state
  const multiCatalogHook = useMultiCatalogAudit();
  const [multiData, setMultiData] = useState<AggregatedAuditData | null>(null);
  const [isLoadingMulti, setIsLoadingMulti] = useState(false);
  
  const { 
    loading, 
    error, 
    presentationData,
    topSongs,
    savePresentation 
  } = useCatalogAuditPresentation(
    hasParams && !isMultiMode && !isMultiPresentation ? (searchId || undefined) : undefined, 
    hasParams && !isMultiMode && !isMultiPresentation ? (artistName || undefined) : undefined
  );

  const {
    discoveryState,
    runCatalogDiscovery,
    resetDiscovery,
    isDiscovering,
  } = useCatalogAuditDiscovery();

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [hasTriedDiscovery, setHasTriedDiscovery] = useState(false);

  // Load multi-catalog data when in presentation mode
  useEffect(() => {
    const loadMultiData = async () => {
      if (!isMultiPresentation || !searchIdsParam) return;
      
      setIsLoadingMulti(true);
      try {
        const ids = searchIdsParam.split(',');
        // Add each search ID to the hook
        for (const id of ids) {
          // We need to fetch catalog info for each
          const { data: searchData } = await import('@/integrations/supabase/client').then(m => 
            m.supabase
              .from('song_catalog_searches')
              .select('id, songwriter_name, total_songs_found')
              .eq('id', id)
              .single()
          );
          
          if (searchData) {
            multiCatalogHook.addCatalog({
              searchId: searchData.id,
              artistName: searchData.songwriter_name,
              songCount: searchData.total_songs_found || 0,
            });
          }
        }
        
        // Now fetch aggregated data
        const result = await multiCatalogHook.fetchAggregatedData();
        if (result) {
          setMultiData(result);
        }
      } catch (err) {
        console.error('Error loading multi-catalog data:', err);
      } finally {
        setIsLoadingMulti(false);
      }
    };

    loadMultiData();
  }, [isMultiPresentation, searchIdsParam]);

  // When we get "no search found" error, automatically trigger discovery
  useEffect(() => {
    const isNoSearchError = error?.includes('No catalog search found');
    
    // Auto-discover for any user (authenticated or not)
    if (isNoSearchError && artistName && !hasTriedDiscovery && !isDiscovering) {
      setHasTriedDiscovery(true);
      runCatalogDiscovery(artistName).then((newSearchId) => {
        if (newSearchId) {
          // Update URL to use the new searchId
          setSearchParams({ searchId: newSearchId, artist: artistName });
        }
      });
    }
  }, [error, artistName, hasTriedDiscovery, isDiscovering, runCatalogDiscovery, setSearchParams]);

  // Reset discovery state when URL changes
  useEffect(() => {
    setHasTriedDiscovery(false);
    resetDiscovery();
  }, [searchId, artistName, resetDiscovery]);

  const handleClose = () => {
    navigate(-1);
  };

  const handleTryAnotherSearch = () => {
    // Clear URL params to show the selector again
    setSearchParams({});
    resetDiscovery();
    setHasTriedDiscovery(false);
    setMultiData(null);
    multiCatalogHook.clearCatalogs();
  };

  const handleStartDiscovery = async () => {
    if (!artistName) return;
    setHasTriedDiscovery(true);
    const newSearchId = await runCatalogDiscovery(artistName);
    if (newSearchId) {
      setSearchParams({ searchId: newSearchId, artist: artistName });
    }
  };

  const handleDownloadReport = async () => {
    if (!presentationData) return;
    
    setIsGeneratingPDF(true);
    
    try {
      // Generate and download the PDF
      await generateCatalogAuditPdf({
        presentationData,
        topSongs: topSongs.map(song => ({
          song_title: song.song_title,
          iswc: song.iswc,
          metadata_completeness_score: song.metadata_completeness_score,
          verification_status: song.verification_status,
        })),
      });
      
      // Also save to database
      await savePresentation();
      
      toast({
        title: 'Report Downloaded',
        description: `Catalog audit report for ${presentationData.artistName} has been saved`,
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadMultiReport = async () => {
    if (!multiData) return;
    
    setIsGeneratingPDF(true);
    
    try {
      await generateMultiCatalogAuditPdf(multiData);
      
      toast({
        title: 'Report Downloaded',
        description: `Multi-catalog audit report for ${multiData.catalogs.length} catalogs has been saved`,
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Show selector when no params provided
  if (!hasParams) {
    return <AuditPresentationSelector />;
  }

  // Show multi-catalog selector
  if (isMultiMode && !isMultiPresentation) {
    return <MultiCatalogSelector />;
  }

  // Show multi-catalog presentation
  if (isMultiPresentation) {
    if (isLoadingMulti || multiCatalogHook.loading) {
      return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-6">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading multi-catalog data...</p>
        </div>
      );
    }

    if (multiData) {
      return (
        <MultiCatalogPresentation
          data={multiData}
          onClose={handleClose}
          onDownloadReport={handleDownloadMultiReport}
          isGeneratingPDF={isGeneratingPDF}
        />
      );
    }
  }

  // Show discovery in progress
  if (isDiscovering) {
    return (
      <CatalogDiscoveryProgress
        step={discoveryState.step}
        progress={discoveryState.progress}
        message={discoveryState.message}
        artistName={artistName || ''}
        songsFound={discoveryState.songsFound}
      />
    );
  }

  // Show loading state (for existing search lookup)
  if (loading && !isDiscovering) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 animate-pulse" />
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <p className="text-muted-foreground">Loading presentation data...</p>
      </div>
    );
  }

  // Show error state (only if discovery also failed or completed without results)
  if ((error || !presentationData) && discoveryState.step !== 'completed') {
    const isNoSearchError = error?.includes('No catalog search found');
    const discoveryFailed = discoveryState.step === 'error';
    
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-6 p-8">
        <AlertCircle className="w-16 h-16 text-destructive" />
        <div className="text-center space-y-2 max-w-md">
          <h1 className="text-2xl font-headline text-foreground">
            {discoveryFailed ? 'Discovery Failed' : isNoSearchError ? 'No Catalog Data Found' : 'Unable to Load Presentation'}
          </h1>
          <p className="text-muted-foreground">
            {discoveryFailed 
              ? discoveryState.message
              : isNoSearchError 
                ? `No existing catalog analysis found for "${artistName}".`
                : (error || 'No presentation data available.')
            }
          </p>
        </div>
        <div className="flex gap-3">
          {isNoSearchError && !hasTriedDiscovery && (
            <Button onClick={handleStartDiscovery} className="gap-2">
              <Search className="w-4 h-4" />
              Discover Catalog
            </Button>
          )}
          <Button onClick={handleTryAnotherSearch} variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Try Another Search
          </Button>
        </div>
      </div>
    );
  }

  // After discovery completes, we may need to reload
  if (discoveryState.step === 'completed' && !presentationData) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground">Loading discovered catalog...</p>
      </div>
    );
  }

  if (!presentationData) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-6 p-8">
        <AlertCircle className="w-16 h-16 text-muted-foreground" />
        <div className="text-center space-y-2 max-w-md">
          <h1 className="text-2xl font-headline text-foreground">No Data Available</h1>
          <p className="text-muted-foreground">
            Unable to generate presentation. Please try a different artist.
          </p>
        </div>
        <Button onClick={handleTryAnotherSearch} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Try Another Search
        </Button>
      </div>
    );
  }

  return (
    <CatalogAuditPresentation 
      data={presentationData}
      onClose={handleClose}
      onDownloadReport={handleDownloadReport}
      isGeneratingPDF={isGeneratingPDF}
    />
  );
}
