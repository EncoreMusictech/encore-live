import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CatalogAuditPresentation } from '@/components/catalog-audit/CatalogAuditPresentation';
import { AuditPresentationSelector } from '@/components/catalog-audit/AuditPresentationSelector';
import { useCatalogAuditPresentation } from '@/hooks/useCatalogAuditPresentation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CatalogAuditPresentationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const searchId = searchParams.get('searchId');
  const artistName = searchParams.get('artist');
  
  // Check if we have params - if not, show the selector
  const hasParams = Boolean(searchId || artistName);
  
  const { 
    loading, 
    error, 
    presentationData, 
    savePresentation 
  } = useCatalogAuditPresentation(
    hasParams ? (searchId || undefined) : undefined, 
    hasParams ? (artistName || undefined) : undefined
  );

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleClose = () => {
    navigate(-1);
  };

  const handleTryAnotherSearch = () => {
    // Clear URL params to show the selector again
    setSearchParams({});
  };

  const handleDownloadReport = async () => {
    if (!presentationData) return;
    
    setIsGeneratingPDF(true);
    
    try {
      // Save presentation to database
      await savePresentation();
      
      // For now, show a success message - PDF generation can be enhanced later
      toast({
        title: 'Report Generated',
        description: `Audit report for ${presentationData.artistName} is ready`,
      });
    } catch (err) {
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

  // Show loading state
  if (loading) {
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

  // Show error state
  if (error || !presentationData) {
    const isNoSearchError = error?.includes('No catalog search found');
    
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-6 p-8">
        <AlertCircle className="w-16 h-16 text-destructive" />
        <div className="text-center space-y-2 max-w-md">
          <h1 className="text-2xl font-headline text-foreground">
            {isNoSearchError ? 'No Catalog Data Found' : 'Unable to Load Presentation'}
          </h1>
          <p className="text-muted-foreground">
            {isNoSearchError 
              ? `No existing catalog analysis found for "${artistName}". Try searching for a different artist or select from your recent searches.`
              : (error || 'No presentation data available.')
            }
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
