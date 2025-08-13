import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Play, Pause, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useMLCLookup } from '@/hooks/useMLCLookup';
import { useCopyright } from '@/hooks/useCopyright';
import { useToast } from '@/hooks/use-toast';

interface BulkEnrichmentProgress {
  total: number;
  processed: number;
  found: number;
  errors: number;
  isRunning: boolean;
}

interface EnrichmentResult {
  copyrightId: string;
  workTitle: string;
  status: 'pending' | 'found' | 'not_found' | 'error';
  writersFound: number;
  publishersFound: number;
  mlcWorkId?: string;
  iswc?: string;
  error?: string;
}

export const MLCBulkEnrichment: React.FC = () => {
  const [progress, setProgress] = useState<BulkEnrichmentProgress>({
    total: 0,
    processed: 0,
    found: 0,
    errors: 0,
    isRunning: false
  });
  const [results, setResults] = useState<EnrichmentResult[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  
  const { copyrights, updateCopyright } = useCopyright();
  const { lookupWork } = useMLCLookup();
  const { toast } = useToast();

  const startBulkEnrichment = async () => {
    if (copyrights.length === 0) {
      toast({
        title: "No Copyrights Found",
        description: "Please register some copyrights before running bulk enrichment.",
        variant: "destructive"
      });
      return;
    }

    setProgress({
      total: copyrights.length,
      processed: 0,
      found: 0,
      errors: 0,
      isRunning: true
    });
    setResults([]);
    setIsPaused(false);

    // Initialize results
    const initialResults: EnrichmentResult[] = copyrights.map(copyright => ({
      copyrightId: copyright.id,
      workTitle: copyright.work_title || 'Untitled',
      status: 'pending',
      writersFound: 0,
      publishersFound: 0
    }));
    setResults(initialResults);

    // Process each copyright
    for (let i = 0; i < copyrights.length; i++) {
      if (isPaused) break;

      const copyright = copyrights[i];
      
      try {
        // Skip if already has MLC work ID
        if ((copyright as any).mlc_work_id) {
          setResults(prev => prev.map(r => 
            r.copyrightId === copyright.id 
              ? { ...r, status: 'found', mlcWorkId: (copyright as any).mlc_work_id }
              : r
          ));
          setProgress(prev => ({ 
            ...prev, 
            processed: prev.processed + 1,
            found: prev.found + 1
          }));
          continue;
        }

        // Perform MLC lookup
        const result = await lookupWork({
          workTitle: copyright.work_title,
          iswc: copyright.iswc
        });

        if (result?.found) {
          // Update copyright with MLC data
          const updateData: any = {};
          
          if (result.metadata.mlcWorkId) {
            updateData.mlc_work_id = result.metadata.mlcWorkId;
          }
          
          if (result.metadata.iswc && !copyright.iswc) {
            updateData.iswc = result.metadata.iswc;
          }

          if (Object.keys(updateData).length > 0) {
            await updateCopyright(copyright.id, updateData);
          }

          setResults(prev => prev.map(r => 
            r.copyrightId === copyright.id 
              ? { 
                  ...r, 
                  status: 'found',
                  writersFound: result.writers.length,
                  publishersFound: result.publishers.length,
                  mlcWorkId: result.metadata.mlcWorkId,
                  iswc: result.metadata.iswc
                }
              : r
          ));
          
          setProgress(prev => ({ 
            ...prev, 
            processed: prev.processed + 1,
            found: prev.found + 1
          }));
        } else {
          setResults(prev => prev.map(r => 
            r.copyrightId === copyright.id 
              ? { ...r, status: 'not_found', error: result?.error }
              : r
          ));
          
          setProgress(prev => ({ 
            ...prev, 
            processed: prev.processed + 1
          }));
        }
      } catch (error) {
        console.error(`Error enriching ${copyright.work_title}:`, error);
        
        setResults(prev => prev.map(r => 
          r.copyrightId === copyright.id 
            ? { ...r, status: 'error', error: error.message }
            : r
        ));
        
        setProgress(prev => ({ 
          ...prev, 
          processed: prev.processed + 1,
          errors: prev.errors + 1
        }));
      }

      // Small delay to prevent API rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setProgress(prev => ({ ...prev, isRunning: false }));
    
    toast({
      title: "Bulk Enrichment Complete",
      description: `Processed ${progress.processed} works, found ${progress.found} matches`,
    });
  };

  const pauseEnrichment = () => {
    setIsPaused(true);
    setProgress(prev => ({ ...prev, isRunning: false }));
  };

  const getStatusBadge = (status: EnrichmentResult['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Pending</Badge>;
      case 'found':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Found</Badge>;
      case 'not_found':
        return <Badge variant="outline">Not Found</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          MLC Bulk Metadata Enrichment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={startBulkEnrichment} 
            disabled={progress.isRunning}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Start Bulk Enrichment
          </Button>
          
          {progress.isRunning && (
            <Button 
              variant="outline" 
              onClick={pauseEnrichment}
              className="flex items-center gap-2"
            >
              <Pause className="w-4 h-4" />
              Pause
            </Button>
          )}
          
          <div className="text-sm text-muted-foreground">
            {copyrights.length} copyrights available for enrichment
          </div>
        </div>

        {/* Progress */}
        {progress.total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress: {progress.processed} / {progress.total}</span>
              <span>Found: {progress.found} | Errors: {progress.errors}</span>
            </div>
            <Progress value={(progress.processed / progress.total) * 100} className="h-2" />
          </div>
        )}

        {/* Results Table */}
        {results.length > 0 && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Writers</TableHead>
                  <TableHead>Publishers</TableHead>
                  <TableHead>MLC Work ID</TableHead>
                  <TableHead>ISWC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.copyrightId}>
                    <TableCell className="font-medium">{result.workTitle}</TableCell>
                    <TableCell>{getStatusBadge(result.status)}</TableCell>
                    <TableCell>{result.writersFound}</TableCell>
                    <TableCell>{result.publishersFound}</TableCell>
                    <TableCell className="font-mono text-sm">{result.mlcWorkId || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">{result.iswc || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};