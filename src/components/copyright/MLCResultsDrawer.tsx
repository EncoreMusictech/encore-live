import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Users, Building, Calendar, AlertTriangle, Eye } from 'lucide-react';
import { CopyrightWriter } from '@/hooks/useCopyright';
import { normalizeMLCDataToWriters } from '@/lib/mlc-utils';

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

  const normalizedWriters = useMemo(() => {
    if (!results) return [];
    return normalizeMLCDataToWriters(results);
  }, [results]);

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
  const hasMultipleRecordings = results.recordings && results.recordings.length > 1;
  const hasEstimatedShares = normalizedWriters.some(w => !w.ownership_percentage);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader className="space-y-3">
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            MLC Lookup Results
          </SheetTitle>
          <SheetDescription className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{searchType}: {searchValue}</Badge>
              <Badge variant="secondary">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(timestamp).toLocaleString()}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{normalizedWriters.length} writer{normalizedWriters.length !== 1 ? 's' : ''} found</span>
              {hasMultipleRecordings && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Multiple recordings found
                </span>
              )}
              {hasEstimatedShares && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Some shares estimated
                </span>
              )}
            </div>
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between py-3">
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
              {normalizedWriters.map((writer) => {
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
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          {conflict}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
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