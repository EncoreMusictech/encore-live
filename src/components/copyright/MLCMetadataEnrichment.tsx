import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Database, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MLCResult {
  found: boolean;
  writers: Array<{
    name: string;
    ipi?: string;
    share?: number;
    role?: string;
    cae?: string;
  }>;
  publishers: Array<{
    name: string;
    ipi?: string;
    share?: number;
    cae?: string;
  }>;
  metadata: {
    workTitle?: string;
    iswc?: string;
    mlcWorkId?: string;
    registrationDate?: string;
    status?: string;
    workType?: string;
    territory?: string;
    rightsType?: string;
  };
  confidence?: number;
  totalMatches?: number;
  verification_notes?: string;
}

interface MLCMetadataEnrichmentProps {
  workTitle?: string;
  writerName?: string;
  publisherName?: string;
  iswc?: string;
  onDataEnriched?: (result: MLCResult) => void;
  className?: string;
}

export const MLCMetadataEnrichment: React.FC<MLCMetadataEnrichmentProps> = ({
  workTitle = '',
  writerName = '',
  publisherName = '',
  iswc = '',
  onDataEnriched,
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MLCResult | null>(null);
  const [searchParams, setSearchParams] = useState({
    workTitle,
    writerName,
    publisherName,
    iswc
  });
  const { toast } = useToast();

  const searchMLC = async () => {
    if (!searchParams.workTitle && !searchParams.writerName && !searchParams.iswc) {
      toast({
        title: "Search Required",
        description: "Please enter at least a work title, writer name, or ISWC to search MLC.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mlc-repertoire-lookup', {
        body: searchParams
      });

      if (error) {
        throw error;
      }

      setResult(data);
      
      if (data.found) {
        toast({
          title: "MLC Data Found",
          description: `Found ${data.writers?.length || 0} writers and ${data.publishers?.length || 0} publishers`,
        });
        
        if (onDataEnriched) {
          onDataEnriched(data);
        }
      } else {
        toast({
          title: "No MLC Data Found",
          description: data.message || "No matching works found in MLC database",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('MLC search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search MLC database. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResult(null);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          MLC Metadata Enrichment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="mlc-work-title">Work Title</Label>
            <Input
              id="mlc-work-title"
              value={searchParams.workTitle}
              onChange={(e) => setSearchParams(prev => ({ ...prev, workTitle: e.target.value }))}
              placeholder="Enter work title..."
            />
          </div>
          <div>
            <Label htmlFor="mlc-writer-name">Writer Name</Label>
            <Input
              id="mlc-writer-name"
              value={searchParams.writerName}
              onChange={(e) => setSearchParams(prev => ({ ...prev, writerName: e.target.value }))}
              placeholder="Enter writer name..."
            />
          </div>
          <div>
            <Label htmlFor="mlc-publisher-name">Publisher Name</Label>
            <Input
              id="mlc-publisher-name"
              value={searchParams.publisherName}
              onChange={(e) => setSearchParams(prev => ({ ...prev, publisherName: e.target.value }))}
              placeholder="Enter publisher name..."
            />
          </div>
          <div>
            <Label htmlFor="mlc-iswc">ISWC</Label>
            <Input
              id="mlc-iswc"
              value={searchParams.iswc}
              onChange={(e) => setSearchParams(prev => ({ ...prev, iswc: e.target.value }))}
              placeholder="T-123456789-0"
            />
          </div>
        </div>

        {/* Search Actions */}
        <div className="flex gap-2">
          <Button onClick={searchMLC} disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching MLC...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Search MLC Database
              </>
            )}
          </Button>
          {result && (
            <Button variant="outline" onClick={clearResults}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2">
                {result.found ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    MLC Data Found
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    No Data Found
                  </>
                )}
              </h4>
              {result.confidence && (
                <Badge variant={result.confidence > 0.7 ? "default" : "secondary"}>
                  {Math.round(result.confidence * 100)}% Confidence
                </Badge>
              )}
            </div>

            {result.found && (
              <>
                {/* Metadata */}
                {result.metadata && Object.keys(result.metadata).length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2">Work Information</h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {result.metadata.workTitle && (
                        <div><span className="font-medium">Title:</span> {result.metadata.workTitle}</div>
                      )}
                      {result.metadata.iswc && (
                        <div><span className="font-medium">ISWC:</span> {result.metadata.iswc}</div>
                      )}
                      {result.metadata.mlcWorkId && (
                        <div><span className="font-medium">MLC Work ID:</span> {result.metadata.mlcWorkId}</div>
                      )}
                      {result.metadata.status && (
                        <div><span className="font-medium">Status:</span> {result.metadata.status}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Writers */}
                {result.writers && result.writers.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2">Writers ({result.writers.length})</h5>
                    <div className="space-y-2">
                      {result.writers.map((writer, index) => (
                        <div key={index} className="bg-muted/30 p-2 rounded text-sm">
                          <div className="font-medium">{writer.name}</div>
                          <div className="text-muted-foreground">
                            {writer.ipi && <span>IPI: {writer.ipi}</span>}
                            {writer.share && <span className="ml-2">Share: {writer.share}%</span>}
                            {writer.role && <span className="ml-2">Role: {writer.role}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Publishers */}
                {result.publishers && result.publishers.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2">Publishers ({result.publishers.length})</h5>
                    <div className="space-y-2">
                      {result.publishers.map((publisher, index) => (
                        <div key={index} className="bg-muted/30 p-2 rounded text-sm">
                          <div className="font-medium">{publisher.name}</div>
                          <div className="text-muted-foreground">
                            {publisher.ipi && <span>IPI: {publisher.ipi}</span>}
                            {publisher.share && <span className="ml-2">Share: {publisher.share}%</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.verification_notes && (
                  <div className="text-sm text-muted-foreground bg-muted/20 p-2 rounded">
                    {result.verification_notes}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};