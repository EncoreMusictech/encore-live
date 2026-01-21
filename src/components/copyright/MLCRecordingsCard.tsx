import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Disc, ChevronDown, ChevronRight, Music, Building2, Hash } from 'lucide-react';
import { MLCRecording } from '@/hooks/useMLCLookup';

interface MLCRecordingsCardProps {
  recordings: MLCRecording[];
  showAll?: boolean;
  selectable?: boolean;
  selectedIsrc?: string;
  onSelectRecording?: (recording: MLCRecording) => void;
}

export const MLCRecordingsCard: React.FC<MLCRecordingsCardProps> = ({
  recordings,
  showAll = false,
  selectable = false,
  selectedIsrc,
  onSelectRecording
}) => {
  const [expanded, setExpanded] = useState(showAll);

  if (!recordings || recordings.length === 0) {
    return (
      <Card className="bg-muted/30">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
            <Disc className="h-4 w-4" />
            No Recordings Found
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const displayedRecordings = expanded ? recordings : recordings.slice(0, 3);

  return (
    <Card>
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CardHeader className="py-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <CardTitle className="text-sm flex items-center gap-2">
                <Disc className="h-4 w-4" />
                Recordings ({recordings.length})
              </CardTitle>
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-2">
            {displayedRecordings.map((recording, index) => {
              const isSelected = selectedIsrc === recording.isrc;
              
              return (
                <div 
                  key={index} 
                  className={`border rounded-lg p-3 bg-background transition-colors ${
                    isSelected ? 'ring-2 ring-primary border-primary' : ''
                  } ${selectable ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                  onClick={() => selectable && onSelectRecording?.(recording)}
                >
                  <div className="flex items-start gap-3">
                    {selectable && (
                      <Checkbox 
                        checked={isSelected}
                        className="mt-0.5"
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Music className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm truncate">
                          {recording.title || 'Untitled'}
                        </span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mb-2">
                        {recording.artist || 'Unknown Artist'}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {recording.isrc && (
                          <Badge variant="outline" className="text-xs font-mono">
                            <Hash className="h-3 w-3 mr-1" />
                            {recording.isrc}
                          </Badge>
                        )}
                        
                        {recording.labels && (
                          <Badge variant="secondary" className="text-xs">
                            <Building2 className="h-3 w-3 mr-1" />
                            {recording.labels}
                          </Badge>
                        )}
                        
                        {recording.mlcsongCode && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                            MLC: {recording.mlcsongCode}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {recordings.length > 3 && !expanded && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setExpanded(true)}
              >
                Show {recordings.length - 3} more recordings
              </Button>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
