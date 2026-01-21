import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Building, ChevronDown, ChevronRight, Users, Link2 } from 'lucide-react';
import { MLCPublisher } from '@/hooks/useMLCLookup';

interface MLCPublishersCardProps {
  publishers: MLCPublisher[];
  showAll?: boolean;
}

export const MLCPublishersCard: React.FC<MLCPublishersCardProps> = ({
  publishers,
  showAll = false
}) => {
  const [expanded, setExpanded] = useState(showAll);
  const [expandedPublishers, setExpandedPublishers] = useState<Set<number>>(new Set());

  if (!publishers || publishers.length === 0) {
    return (
      <Card className="bg-muted/30">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
            <Building className="h-4 w-4" />
            No Publishers Found
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const togglePublisher = (index: number) => {
    const newExpanded = new Set(expandedPublishers);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedPublishers(newExpanded);
  };

  const formatCollectionShare = (shares: number[] | undefined) => {
    if (!shares || shares.length === 0) return null;
    // Collection shares can be an array - sum them or show the first
    const total = shares.reduce((acc, s) => acc + s, 0);
    return `${total.toFixed(2)}%`;
  };

  const displayedPublishers = expanded ? publishers : publishers.slice(0, 3);

  return (
    <Card>
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CardHeader className="py-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building className="h-4 w-4" />
                Publishers ({publishers.length})
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
          <CardContent className="pt-0 space-y-3">
            {displayedPublishers.map((publisher, index) => {
              const hasAdministrators = publisher.administrators && publisher.administrators.length > 0;
              const isExpanded = expandedPublishers.has(index);
              
              return (
                <div key={index} className="border rounded-lg p-3 bg-background">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {publisher.publisherName || publisher.name || 'Unknown Publisher'}
                        </span>
                        {formatCollectionShare(publisher.collectionShare) && (
                          <Badge variant="secondary" className="text-xs">
                            {formatCollectionShare(publisher.collectionShare)}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                        {(publisher.publisherIpiNumber || publisher.ipi) && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">IPI:</span>
                            <code className="font-mono bg-muted px-1 rounded">
                              {publisher.publisherIpiNumber || publisher.ipi}
                            </code>
                          </span>
                        )}
                        {publisher.mlcPublisherNumber && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">MLC#:</span>
                            <code className="font-mono bg-muted px-1 rounded">
                              {publisher.mlcPublisherNumber}
                            </code>
                          </span>
                        )}
                        {publisher.cae && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">CAE:</span>
                            <code className="font-mono bg-muted px-1 rounded">
                              {publisher.cae}
                            </code>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {hasAdministrators && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublisher(index)}
                        className="shrink-0"
                      >
                        <Link2 className="h-3 w-3 mr-1" />
                        {isExpanded ? 'Hide' : 'Show'} Admin ({publisher.administrators!.length})
                      </Button>
                    )}
                  </div>
                  
                  {/* Administrator chain */}
                  {hasAdministrators && isExpanded && (
                    <div className="mt-3 pl-4 border-l-2 border-muted space-y-2">
                      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Administrators
                      </div>
                      {publisher.administrators!.map((admin, adminIndex) => (
                        <div key={adminIndex} className="text-xs bg-muted/50 p-2 rounded">
                          <div className="font-medium">
                            {admin.publisherName || admin.name}
                          </div>
                          {(admin.publisherIpiNumber || admin.ipi) && (
                            <div className="text-muted-foreground mt-1">
                              IPI: {admin.publisherIpiNumber || admin.ipi}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            
            {publishers.length > 3 && !expanded && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setExpanded(true)}
              >
                Show {publishers.length - 3} more publishers
              </Button>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
