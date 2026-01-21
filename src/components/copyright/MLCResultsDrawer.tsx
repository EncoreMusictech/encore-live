import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Users, Building, Calendar, AlertTriangle, Eye, Disc, Info } from 'lucide-react';
import { CopyrightWriter } from '@/hooks/useCopyright';
import { normalizeMLCDataToWriters } from '@/lib/mlc-utils';
import { MLCConfidenceIndicator } from './MLCConfidenceIndicator';
import { MLCPublishersCard } from './MLCPublishersCard';
import { MLCRecordingsCard } from './MLCRecordingsCard';

interface MLCResultsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: any;
  onAddSelected: (writers: CopyrightWriter[]) => void;
  existingWriters: CopyrightWriter[];
}

export const MLCResultsDrawer: React.FC<MLCResultsDrawerProps> = ({
  open,
  onOpenChange,
  results,
  onAddSelected,
  existingWriters
}) => {
  const [selectedWriterIds, setSelectedWriterIds] = useState<Set<string>>(new Set());
  const [showRawJson, setShowRawJson] = useState(false);
  const [activeTab, setActiveTab] = useState('writers');

  const normalizedWriters = useMemo(() => {
    if (!results) return [];
    return normalizeMLCDataToWriters(results);
  }, [results]);

  // Extract publishers and recordings from results
  const publishers = useMemo(() => {
    if (!results) return [];
    // Check multiple possible locations for publisher data
    if (results.publishers && results.publishers.length > 0) {
      return results.publishers;
    }
    if (results.works && results.works.length > 0) {
      // Aggregate publishers from all works
      const allPublishers: any[] = [];
      results.works.forEach((work: any) => {
        if (work.publishers) {
          allPublishers.push(...work.publishers);
        }
      });
      return allPublishers;
    }
    return [];
  }, [results]);

  const recordings = useMemo(() => {
    if (!results) return [];
    if (results.recordings && results.recordings.length > 0) {
      return results.recordings;
    }
    if (results.works && results.works.length > 0) {
      // Aggregate recordings from all works
      const allRecordings: any[] = [];
      results.works.forEach((work: any) => {
        if (work.recordings) {
          allRecordings.push(...work.recordings);
        }
      });
      return allRecordings;
    }
    return [];
  }, [results]);

  // Calculate confidence factors
  const confidenceFactors = useMemo(() => {
    if (!results) return undefined;
    return {
      hasIswc: !!(results.metadata?.iswc || results.works?.[0]?.iswc),
      hasWriters: normalizedWriters.length > 0,
      hasPublishers: publishers.length > 0,
      hasRecordings: recordings.length > 0,
      titleMatch: !!(results.metadata?.workTitle || results.works?.[0]?.primaryTitle)
    };
  }, [results, normalizedWriters, publishers, recordings]);

  const confidence = useMemo(() => {
    if (results?.confidence) return results.confidence;
    // Calculate confidence based on available data
    let score = 0;
    if (confidenceFactors?.hasIswc) score += 30;
    if (confidenceFactors?.hasWriters) score += 25;
    if (confidenceFactors?.hasPublishers) score += 20;
    if (confidenceFactors?.hasRecordings) score += 15;
    if (confidenceFactors?.titleMatch) score += 10;
    return score;
  }, [results, confidenceFactors]);

  const handleWriterToggle = (writerId: string) => {
    const newSelected = new Set(selectedWriterIds);
    if (newSelected.has(writerId)) {
      newSelected.delete(writerId);
    } else {
      newSelected.add(writerId);
    }
    setSelectedWriterIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedWriterIds.size === normalizedWriters.length) {
      setSelectedWriterIds(new Set());
    } else {
      setSelectedWriterIds(new Set(normalizedWriters.map(w => w.id)));
    }
  };

  const handleAddSelected = () => {
    const selectedWriters = normalizedWriters.filter(w => selectedWriterIds.has(w.id));
    onAddSelected(selectedWriters);
    setSelectedWriterIds(new Set());
    onOpenChange(false);
  };

  const handleAddAll = () => {
    onAddSelected(normalizedWriters);
    setSelectedWriterIds(new Set());
    onOpenChange(false);
  };

  const getConflictWarning = (writer: CopyrightWriter) => {
    const existing = existingWriters.find(ew => 
      ew.ipi_number === writer.ipi_number || 
      ew.writer_name.toLowerCase() === writer.writer_name.toLowerCase()
    );
    return existing ? `Conflicts with existing writer: ${existing.writer_name}` : null;
  };

  if (!results) return null;

  const { searchType, searchValue, timestamp } = results;
  const hasMultipleRecordings = recordings.length > 1;
  const hasEstimatedShares = normalizedWriters.some(w => !w.ownership_percentage);
  const workTitle = results.metadata?.workTitle || results.works?.[0]?.primaryTitle || 'Unknown Work';
  const iswc = results.metadata?.iswc || results.works?.[0]?.iswc;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader className="space-y-3">
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            MLC Lookup Results
          </SheetTitle>
          <SheetDescription className="space-y-3">
            {/* Work title and ISWC */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium text-foreground">{workTitle}</div>
              {iswc && (
                <div className="text-xs font-mono mt-1">ISWC: {iswc}</div>
              )}
            </div>
            
            {/* Search info and confidence */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{searchType}: {searchValue}</Badge>
                <Badge variant="secondary">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(timestamp).toLocaleString()}
                </Badge>
              </div>
              <div className="w-32">
                <MLCConfidenceIndicator 
                  confidence={confidence} 
                  size="sm"
                  factors={confidenceFactors}
                />
              </div>
            </div>
            
            {/* Summary stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {normalizedWriters.length} writer{normalizedWriters.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                {publishers.length} publisher{publishers.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <Disc className="h-3 w-3" />
                {recordings.length} recording{recordings.length !== 1 ? 's' : ''}
              </span>
              {hasEstimatedShares && (
                <span className="flex items-center gap-1 text-warning">
                  <AlertTriangle className="h-3 w-3" />
                  Some shares estimated
                </span>
              )}
            </div>
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="writers" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Writers ({normalizedWriters.length})
              </TabsTrigger>
              <TabsTrigger value="publishers" className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                Publishers ({publishers.length})
              </TabsTrigger>
              <TabsTrigger value="recordings" className="flex items-center gap-1">
                <Disc className="h-3 w-3" />
                Recordings ({recordings.length})
              </TabsTrigger>
            </TabsList>

            {/* Writers Tab */}
            <TabsContent value="writers" className="flex-1 overflow-hidden flex flex-col mt-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedWriterIds.size === normalizedWriters.length && normalizedWriters.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    Select All ({selectedWriterIds.size}/{normalizedWriters.length})
                  </span>
                </div>
                
                <Dialog open={showRawJson} onOpenChange={setShowRawJson}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View Raw JSON
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Raw MLC API Response</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh]">
                      <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                        {JSON.stringify(results, null, 2)}
                      </pre>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-3 pr-4">
                  {normalizedWriters.length === 0 ? (
                    <Card className="bg-muted/30">
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No writers found in MLC data</p>
                      </CardContent>
                    </Card>
                  ) : (
                    normalizedWriters.map((writer) => {
                      const conflict = getConflictWarning(writer);
                      const isSelected = selectedWriterIds.has(writer.id);

                      return (
                        <Card key={writer.id} className={`transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleWriterToggle(writer.id)}
                                />
                                <div>
                                  <CardTitle className="text-base">{writer.writer_name}</CardTitle>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {writer.writer_role}
                                    </Badge>
                                    {writer.pro_affiliation && (
                                      <Badge variant="secondary" className="text-xs">
                                        {writer.pro_affiliation}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-right text-sm">
                                {writer.ownership_percentage ? (
                                  <span className="font-medium">{writer.ownership_percentage}%</span>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Estimated
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pt-0">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">IPI:</span>
                                <span className="ml-2 font-mono">{writer.ipi_number || 'Not available'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Status:</span>
                                <span className="ml-2">
                                  <Badge variant={writer.controlled_status === 'Controlled' ? 'default' : 'secondary'}>
                                    {writer.controlled_status}
                                  </Badge>
                                </span>
                              </div>
                            </div>
                            
                            {conflict && (
                              <div className="mt-3 p-2 bg-warning/10 border border-warning/30 rounded text-xs text-warning-foreground">
                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                {conflict}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Publishers Tab */}
            <TabsContent value="publishers" className="flex-1 overflow-hidden mt-3">
              <ScrollArea className="h-full">
                <div className="pr-4 space-y-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground flex items-start gap-2">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Publisher Collection Shares</p>
                      <p className="text-xs mt-1">
                        The MLC provides collection share percentages for publishers, which represent
                        the portion of mechanical royalties collected on behalf of each publisher.
                      </p>
                    </div>
                  </div>
                  <MLCPublishersCard publishers={publishers} showAll />
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Recordings Tab */}
            <TabsContent value="recordings" className="flex-1 overflow-hidden mt-3">
              <ScrollArea className="h-full">
                <div className="pr-4 space-y-4">
                  {hasMultipleRecordings && (
                    <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
                      <div>
                        <p className="font-medium text-warning">Multiple Recordings Found</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This work has multiple associated recordings. Review each recording's ISRC
                          to identify the correct version for your catalog.
                        </p>
                      </div>
                    </div>
                  )}
                  <MLCRecordingsCard recordings={recordings} showAll />
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <Separator />

        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleAddAll}
            disabled={normalizedWriters.length === 0}
          >
            <Users className="h-4 w-4 mr-1" />
            Add All ({normalizedWriters.length})
          </Button>
          <Button
            onClick={handleAddSelected}
            disabled={selectedWriterIds.size === 0}
          >
            <Users className="h-4 w-4 mr-1" />
            Add Selected ({selectedWriterIds.size})
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
