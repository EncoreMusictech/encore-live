import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingUp, 
  Search,
  Filter,
  Download,
  RefreshCw,
  PlayCircle,
  Loader2,
  Zap
} from 'lucide-react';
import { useCopyright } from '@/hooks/useCopyright';
import { useMLCLookup } from '@/hooks/useMLCLookup';
import { useToast } from '@/hooks/use-toast';
import { formatDistance } from 'date-fns';

interface EnrichmentStats {
  total: number;
  enriched: number;
  needsEnrichment: number;
  enrichmentRate: number;
  withWriters: number;
  withRecordings: number;
  withISWC: number;
  avgConfidence: number;
}

interface CopyrightEnrichmentStatus {
  id: string;
  work_title: string;
  artist_name?: string;
  isrc?: string;
  mediaType?: string;
  isEnriched: boolean;
  hasMLCWorkId: boolean;
  hasISWC: boolean;
  hasWriters: boolean;
  hasRecordings: boolean;
  writerCount: number;
  recordingCount: number;
  confidence?: number;
  lastEnriched?: string;
  enrichmentSource?: string;
}

export const MLCEnrichmentDashboard: React.FC = () => {
  const { copyrights, getWritersForCopyright, getRecordingsForCopyright, updateCopyright, loading } = useCopyright();
  const { lookupWork } = useMLCLookup();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enriched' | 'needs_enrichment'>('all');
  const [enrichmentStatuses, setEnrichmentStatuses] = useState<CopyrightEnrichmentStatus[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCopyrights, setSelectedCopyrights] = useState<Set<string>>(new Set());
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentProgress, setEnrichmentProgress] = useState({ current: 0, total: 0, found: 0 });

  // Calculate enrichment statuses
  const analyzeEnrichmentStatus = async () => {
    setIsAnalyzing(true);
    try {
      const statuses: CopyrightEnrichmentStatus[] = [];

      // Process in chunks of 5 to avoid overwhelming the connection
      const CHUNK_SIZE = 5;
      const allWritersResults: any[] = [];
      const allRecordingsResults: any[] = [];
      
      for (let i = 0; i < copyrights.length; i += CHUNK_SIZE) {
        const chunk = copyrights.slice(i, i + CHUNK_SIZE);
        
        const writersChunk = await Promise.all(
          chunk.map(c => getWritersForCopyright(c.id).catch(e => {
            console.error(`Error fetching writers for ${c.id}:`, e);
            return [];
          }))
        );
        
        const recordingsChunk = await Promise.all(
          chunk.map(c => getRecordingsForCopyright(c.id).catch(e => {
            console.error(`Error fetching recordings for ${c.id}:`, e);
            return [];
          }))
        );
        
        allWritersResults.push(...writersChunk);
        allRecordingsResults.push(...recordingsChunk);
        
        // Small delay between chunks
        if (i + CHUNK_SIZE < copyrights.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      for (let i = 0; i < copyrights.length; i++) {
        const copyright = copyrights[i];
        const writers = allWritersResults[i];
        const recordings = allRecordingsResults[i];
        
        const hasMLCWorkId = !!(copyright as any).mlc_work_id;
        const hasISWC = !!copyright.iswc;
        const hasWriters = writers.length > 0;
        const hasRecordings = recordings.length > 0;
        
        const isEnriched = hasMLCWorkId || (hasISWC && hasWriters);

        // Get artist, ISRC, and media type from first recording
        const firstRecording = recordings[0];
        const artist_name = firstRecording?.artist_name;
        const isrc = firstRecording?.isrc;
        const mediaType = firstRecording?.recording_title ? 'Audio' : 'Video';

        statuses.push({
          id: copyright.id,
          work_title: copyright.work_title || 'Untitled',
          artist_name,
          isrc,
          mediaType: hasRecordings ? mediaType : undefined,
          isEnriched,
          hasMLCWorkId,
          hasISWC,
          hasWriters,
          hasRecordings,
          writerCount: writers.length,
          recordingCount: recordings.length,
          confidence: (copyright as any).mlc_confidence,
          lastEnriched: (copyright as any).mlc_enriched_at,
          enrichmentSource: (copyright as any).mlc_source
        });
      }

      setEnrichmentStatuses(statuses);
      toast({
        title: "Analysis Complete",
        description: `Analyzed ${statuses.length} copyrights`
      });
    } catch (error: any) {
      console.error('Error analyzing enrichment status:', error);
      
      let errorMessage = "Failed to analyze enrichment status";
      let errorDescription = error.message;
      
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = "Network Connection Error";
        errorDescription = "Cannot connect to database. Check your connection and try disabling browser extensions.";
      }
      
      toast({
        title: errorMessage,
        description: errorDescription,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate statistics
  const stats: EnrichmentStats = useMemo(() => {
    const total = enrichmentStatuses.length;
    const enriched = enrichmentStatuses.filter(s => s.isEnriched).length;
    const needsEnrichment = total - enriched;
    const enrichmentRate = total > 0 ? (enriched / total) * 100 : 0;
    const withWriters = enrichmentStatuses.filter(s => s.hasWriters).length;
    const withRecordings = enrichmentStatuses.filter(s => s.hasRecordings).length;
    const withISWC = enrichmentStatuses.filter(s => s.hasISWC).length;
    const confidenceScores = enrichmentStatuses
      .filter(s => s.confidence)
      .map(s => s.confidence!);
    const avgConfidence = confidenceScores.length > 0
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      : 0;

    return {
      total,
      enriched,
      needsEnrichment,
      enrichmentRate,
      withWriters,
      withRecordings,
      withISWC,
      avgConfidence
    };
  }, [enrichmentStatuses]);

  // Filter copyrights
  const filteredStatuses = useMemo(() => {
    let filtered = enrichmentStatuses;

    if (filterStatus === 'enriched') {
      filtered = filtered.filter(s => s.isEnriched);
    } else if (filterStatus === 'needs_enrichment') {
      filtered = filtered.filter(s => !s.isEnriched);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.work_title.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [enrichmentStatuses, filterStatus, searchTerm]);

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedCopyrights);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedCopyrights(newSelection);
  };

  const selectAll = () => {
    if (selectedCopyrights.size === filteredStatuses.length) {
      setSelectedCopyrights(new Set());
    } else {
      setSelectedCopyrights(new Set(filteredStatuses.map(s => s.id)));
    }
  };

  const startBatchEnrichment = async (copyrightIds?: string[]) => {
    const idsToEnrich = copyrightIds || Array.from(selectedCopyrights);
    
    if (idsToEnrich.length === 0) {
      toast({
        title: "No Copyrights Selected",
        description: "Please select copyrights to enrich",
        variant: "destructive"
      });
      return;
    }

    setIsEnriching(true);
    setEnrichmentProgress({ current: 0, total: idsToEnrich.length, found: 0 });

    let foundCount = 0;
    
    for (let i = 0; i < idsToEnrich.length; i++) {
      const copyrightId = idsToEnrich[i];
      const copyright = copyrights.find(c => c.id === copyrightId);
      
      if (!copyright) continue;

      try {
        // Get recordings for this copyright
        const recordings = await getRecordingsForCopyright(copyrightId);
        
        // Build search parameters
        const searchParams: any = {};
        
        // Use recording data if available
        if (recordings.length > 0) {
          const recording = recordings[0];
          if (recording.isrc) searchParams.isrc = recording.isrc;
          if (recording.artist_name) searchParams.artistName = recording.artist_name;
        }
        
        // Always include work title and ISWC if available
        if (copyright.work_title) searchParams.workTitle = copyright.work_title;
        if (copyright.iswc) searchParams.iswc = copyright.iswc;

        // Skip if no search parameters at all
        if (Object.keys(searchParams).length === 0) {
          console.log(`No search parameters for ${copyright.work_title}`);
          setEnrichmentProgress(prev => ({ ...prev, current: i + 1 }));
          continue;
        }

        console.log(`Enriching "${copyright.work_title}" with:`, searchParams);

        const result = await lookupWork(searchParams);

        if (result?.found && result.works && result.works.length > 0) {
          const mlcWork = result.works[0];
          
          // Update copyright with MLC data
          const updateData: any = {};
          
          if (mlcWork.iswc && !copyright.iswc) {
            updateData.iswc = mlcWork.iswc;
          }
          
          // Store MLC metadata
          updateData.mlc_work_id = result.metadata.mlcWorkId || mlcWork.iswc;
          updateData.mlc_confidence = result.confidence || 0;
          updateData.mlc_source = 'MLC API';
          updateData.mlc_enriched_at = new Date().toISOString();

          await updateCopyright(copyrightId, updateData);
          foundCount++;
          
          console.log(`✓ Enriched "${copyright.work_title}" with MLC data`);
        } else {
          console.log(`✗ No MLC data found for "${copyright.work_title}"`);
        }
      } catch (error: any) {
        console.error(`Error enriching ${copyright.work_title}:`, error);
      }

      setEnrichmentProgress(prev => ({ ...prev, current: i + 1, found: foundCount }));
      
      // Small delay between requests
      if (i < idsToEnrich.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsEnriching(false);
    
    toast({
      title: "Batch Enrichment Complete",
      description: `Enriched ${foundCount} of ${idsToEnrich.length} copyrights with MLC data`
    });

    // Refresh the analysis
    await analyzeEnrichmentStatus();
    setSelectedCopyrights(new Set());
  };

  const enrichAll = async () => {
    const unenrichedIds = enrichmentStatuses
      .filter(s => !s.isEnriched && s.hasRecordings)
      .map(s => s.id);
    
    if (unenrichedIds.length === 0) {
      toast({
        title: "No Copyrights Need Enrichment",
        description: "All copyrights with recordings are already enriched",
      });
      return;
    }

    await startBatchEnrichment(unenrichedIds);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                MLC Enrichment Status Dashboard
              </CardTitle>
              <CardDescription>
                Track MLC data enrichment progress across your catalog
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={analyzeEnrichmentStatus} 
                disabled={isAnalyzing || loading || isEnriching}
                variant="outline"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Analyze Status
                  </>
                )}
              </Button>
              
              {enrichmentStatuses.length > 0 && stats.needsEnrichment > 0 && (
                <Button 
                  onClick={enrichAll} 
                  disabled={isEnriching || isAnalyzing}
                >
                  {isEnriching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enriching... ({enrichmentProgress.current}/{enrichmentProgress.total})
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Auto-Enrich All ({stats.needsEnrichment})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress Alert */}
      {isEnriching && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Batch enrichment in progress...</span>
                <span className="text-sm text-muted-foreground">
                  {enrichmentProgress.current} / {enrichmentProgress.total}
                </span>
              </div>
              <Progress 
                value={(enrichmentProgress.current / enrichmentProgress.total) * 100} 
                className="h-2"
              />
              <div className="text-sm text-muted-foreground">
                Found MLC data for {enrichmentProgress.found} copyrights so far
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {enrichmentStatuses.length === 0 && !isAnalyzing && !isEnriching && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Click "Analyze Status" to generate the enrichment dashboard
          </AlertDescription>
        </Alert>
      )}

      {enrichmentStatuses.length > 0 && (
        <>
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Copyrights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Enrichment Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.enrichmentRate.toFixed(1)}%
                </div>
                <Progress value={stats.enrichmentRate} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.enriched} of {stats.total} enriched
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Needs Enrichment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.needsEnrichment}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((stats.needsEnrichment / stats.total) * 100).toFixed(1)}% remaining
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Confidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.avgConfidence.toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on enriched works
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Data Quality Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Data Quality Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    With Writers
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={(stats.withWriters / stats.total) * 100} className="flex-1" />
                    <span className="text-sm font-medium">
                      {stats.withWriters} ({((stats.withWriters / stats.total) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    With Recordings
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={(stats.withRecordings / stats.total) * 100} className="flex-1" />
                    <span className="text-sm font-medium">
                      {stats.withRecordings} ({((stats.withRecordings / stats.total) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    With ISWC
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={(stats.withISWC / stats.total) * 100} className="flex-1" />
                    <span className="text-sm font-medium">
                      {stats.withISWC} ({((stats.withISWC / stats.total) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Copyright List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <CardTitle>Copyright Enrichment Status</CardTitle>
                  <CardDescription>
                    {filteredStatuses.length} of {stats.total} copyrights shown
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedCopyrights.size > 0 && (
                    <Button 
                      onClick={() => startBatchEnrichment()} 
                      size="sm"
                      disabled={isEnriching}
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Enrich Selected ({selectedCopyrights.size})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search copyrights..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="all">
                      All ({stats.total})
                    </TabsTrigger>
                    <TabsTrigger value="enriched">
                      Enriched ({stats.enriched})
                    </TabsTrigger>
                    <TabsTrigger value="needs_enrichment">
                      Needs Enrichment ({stats.needsEnrichment})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedCopyrights.size === filteredStatuses.length && filteredStatuses.length > 0}
                          onChange={selectAll}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead>Work Title</TableHead>
                      <TableHead>Artist</TableHead>
                      <TableHead>ISRC</TableHead>
                      <TableHead>Media Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Writers</TableHead>
                      <TableHead>Recordings</TableHead>
                      <TableHead>ISWC</TableHead>
                      <TableHead>MLC ID</TableHead>
                      <TableHead>Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStatuses.map((status) => (
                      <TableRow key={status.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedCopyrights.has(status.id)}
                            onChange={() => toggleSelection(status.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {status.work_title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {status.artist_name || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {status.isrc || '-'}
                        </TableCell>
                        <TableCell>
                          {status.mediaType ? (
                            <Badge variant="outline">{status.mediaType}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {status.isEnriched ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Enriched
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Needs Enrichment
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {status.hasWriters ? (
                            <span className="text-green-600">{status.writerCount}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {status.hasRecordings ? (
                            <span className="text-green-600">{status.recordingCount}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {status.hasISWC ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          {status.hasMLCWorkId ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          {status.confidence ? (
                            <span className="text-sm">{status.confidence}%</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredStatuses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No copyrights match your filters
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
