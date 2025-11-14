import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Search, Database } from 'lucide-react';

export function MLCVerification() {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [copyrightData, setCopyrightData] = useState<any>(null);

  const testMLCWithExistingWork = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      // Fetch a random copyright with writers
      console.log('🔍 Fetching random copyright from database...');
      
      // Get total count first
      const { count } = await supabase
        .from('copyrights')
        .select('*', { count: 'exact', head: true });
      
      if (!count || count === 0) {
        throw new Error('No copyrights found in database');
      }
      
      // Get a random offset
      const randomOffset = Math.floor(Math.random() * count);
      
      const { data: copyrights, error: fetchError } = await supabase
        .from('copyrights')
        .select(`
          id,
          work_title,
          iswc
        `)
        .range(randomOffset, randomOffset)
        .single();

      if (fetchError) throw fetchError;
      if (!copyrights) throw new Error('No copyrights found in database');

      setCopyrightData(copyrights);
      console.log('📄 Testing with copyright:', copyrights);

      // Fetch writers for this copyright
      const { data: writers, error: writersError } = await supabase
        .from('copyright_writers')
        .select('writer_name, ownership_percentage')
        .eq('copyright_id', copyrights.id)
        .limit(1);

      if (writersError) throw writersError;

      const writerName = writers && writers.length > 0 ? writers[0].writer_name : '';
      
      console.log('🔎 Calling MLC API with:', {
        workTitle: copyrights.work_title,
        writerName,
        iswc: copyrights.iswc
      });

      // Call MLC API
      const startTime = Date.now();
      const { data: mlcData, error: mlcError } = await supabase.functions.invoke('enhanced-mlc-lookup', {
        body: {
          workTitle: copyrights.work_title,
          writerName,
          iswc: copyrights.iswc || undefined,
          enhanced: true,
          includeRecordings: true
        }
      });

      const executionTime = Date.now() - startTime;

      if (mlcError) {
        throw mlcError;
      }

      console.log('✅ MLC API Response:', mlcData);
      
      setTestResult({
        ...mlcData,
        executionTime,
        testedWith: {
          workTitle: copyrights.work_title,
          iswc: copyrights.iswc,
          writerName
        }
      });

      if (mlcData.found) {
        toast.success(`MLC Data Retrieved! Found ${mlcData.works?.length || 0} works, ${mlcData.writers?.length || 0} writers`);
      } else {
        toast.warning('No MLC data found for this work');
      }

    } catch (error: any) {
      console.error('❌ MLC Test Error:', error);
      setTestResult({
        error: error.message || 'Unknown error',
        found: false
      });
      toast.error(`Test Failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              MLC Integration Verification
            </CardTitle>
            <CardDescription>
              Test MLC API with an existing copyright work from your database
            </CardDescription>
          </div>
          {testResult && (
            <Badge variant={testResult.found ? "default" : "destructive"}>
              {testResult.found ? (
                <><CheckCircle className="w-3 h-3 mr-1" /> Connected</>
              ) : (
                <><XCircle className="w-3 h-3 mr-1" /> {testResult.error ? 'Error' : 'Not Found'}</>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testMLCWithExistingWork}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing MLC API...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Test MLC with Random Copyright
            </>
          )}
        </Button>

        {copyrightData && (
          <div className="space-y-3">
            <Separator />
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Tested Copyright:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Work Title:</span>
                  <p className="font-medium">{copyrightData.work_title}</p>
                </div>
                {copyrightData.iswc && (
                  <div>
                    <span className="text-muted-foreground">ISWC:</span>
                    <p className="font-medium">{copyrightData.iswc}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {testResult && (
          <div className="space-y-3">
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">MLC API Response</h4>
                {testResult.executionTime && (
                  <Badge variant="outline">{testResult.executionTime}ms</Badge>
                )}
              </div>

              {testResult.error ? (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive font-medium text-sm">Error:</p>
                  <p className="text-sm text-destructive/80 mt-1">{testResult.error}</p>
                </div>
              ) : testResult.found ? (
                <div className="space-y-3">
                  {/* Summary */}
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success">{testResult.works?.length || 0}</div>
                        <div className="text-muted-foreground">Works</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success">{testResult.writers?.length || 0}</div>
                        <div className="text-muted-foreground">Writers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success">{testResult.recordings?.length || 0}</div>
                        <div className="text-muted-foreground">Recordings</div>
                      </div>
                    </div>
                  </div>

                  {/* Writers */}
                  {testResult.writers && testResult.writers.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-semibold text-sm">Writers:</h5>
                      <div className="space-y-1">
                        {testResult.writers.slice(0, 5).map((writer: any, idx: number) => (
                          <div key={idx} className="p-2 bg-muted/50 rounded text-sm flex justify-between">
                            <span>{writer.name || `${writer.writerFirstName} ${writer.writerLastName}`}</span>
                            {writer.writerIPI && (
                              <Badge variant="outline" className="text-xs">IPI: {writer.writerIPI}</Badge>
                            )}
                          </div>
                        ))}
                        {testResult.writers.length > 5 && (
                          <p className="text-xs text-muted-foreground">
                            ...and {testResult.writers.length - 5} more writers
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Publishers */}
                  {testResult.publishers && testResult.publishers.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-semibold text-sm">Publishers:</h5>
                      <div className="space-y-1">
                        {testResult.publishers.slice(0, 3).map((publisher: any, idx: number) => (
                          <div key={idx} className="p-2 bg-muted/50 rounded text-sm">
                            <div className="font-medium">{publisher.name || publisher.publisherName}</div>
                            {publisher.mlcPublisherNumber && (
                              <div className="text-xs text-muted-foreground">
                                MLC #: {publisher.mlcPublisherNumber}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  {testResult.metadata && (
                    <div className="space-y-2">
                      <h5 className="font-semibold text-sm">Metadata:</h5>
                      <div className="p-3 bg-muted/50 rounded text-xs space-y-1">
                        {testResult.metadata.iswc && (
                          <div><span className="font-medium">ISWC:</span> {testResult.metadata.iswc}</div>
                        )}
                        {testResult.metadata.mlcSongCode && (
                          <div><span className="font-medium">MLC Song Code:</span> {testResult.metadata.mlcSongCode}</div>
                        )}
                        {testResult.metadata.mlcWorkId && (
                          <div><span className="font-medium">MLC Work ID:</span> {testResult.metadata.mlcWorkId}</div>
                        )}
                        <div><span className="font-medium">Source:</span> {testResult.source || 'Enhanced MLC API'}</div>
                        {testResult.confidence && (
                          <div><span className="font-medium">Confidence:</span> {(testResult.confidence * 100).toFixed(0)}%</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-muted/50 border rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    No MLC data found for this copyright work
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
