import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Database, Music, Users, Building } from 'lucide-react';
import { useMLCLookup } from '@/hooks/useMLCLookup';

export function MLCTestButton() {
  const [workTitle, setWorkTitle] = useState('');
  const [writerName, setWriterName] = useState('');
  const [isrc, setIsrc] = useState('');
  const [iswc, setIswc] = useState('');
  const { loading, result, lookupWork } = useMLCLookup();

  const handleTest = async () => {
    await lookupWork({
      workTitle: workTitle || undefined,
      writerName: writerName || undefined,
      isrc: isrc || undefined,
      iswc: iswc || undefined
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Enhanced MLC Integration Test
          </CardTitle>
          <CardDescription>
            Test the enhanced MLC API integration with comprehensive Work and Recording data extraction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workTitle">Work Title</Label>
              <Input
                id="workTitle"
                value={workTitle}
                onChange={(e) => setWorkTitle(e.target.value)}
                placeholder="e.g., Shake It Off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="writerName">Writer Name</Label>
              <Input
                id="writerName"
                value={writerName}
                onChange={(e) => setWriterName(e.target.value)}
                placeholder="e.g., Taylor Swift"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isrc">ISRC</Label>
              <Input
                id="isrc"
                value={isrc}
                onChange={(e) => setIsrc(e.target.value)}
                placeholder="e.g., USRC17607839"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iswc">ISWC</Label>
              <Input
                id="iswc"
                value={iswc}
                onChange={(e) => setIswc(e.target.value)}
                placeholder="e.g., T-345246800-1"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleTest}
            disabled={loading || (!workTitle && !writerName && !isrc && !iswc)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Searching Enhanced MLC Database...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Test Enhanced MLC Lookup
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              Enhanced MLC Lookup Results
              <Badge variant={result.found ? "default" : "destructive"}>
                {result.found ? "Found" : "Not Found"}
              </Badge>
            </CardTitle>
            {result.processingTime && (
              <CardDescription>
                Processing time: {result.processingTime}ms | Source: {result.source}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {result.error ? (
              <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
                <p className="text-destructive font-medium">Error:</p>
                <p className="text-sm text-muted-foreground">{result.error}</p>
              </div>
            ) : result.found ? (
              <div className="space-y-6">
                {/* Enhanced Work Data */}
                {result.works && result.works.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      Works Found ({result.works.length})
                    </h4>
                    {result.works.map((work, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p><strong>Title:</strong> {work.primaryTitle}</p>
                            <p><strong>ISWC:</strong> {work.iswc || 'N/A'}</p>
                            <p><strong>Artists:</strong> {work.artists || 'N/A'}</p>
                          </div>
                        </div>
                        
                        {/* Enhanced Writers */}
                        {work.writers && work.writers.length > 0 && (
                          <div>
                            <h5 className="font-medium mb-2 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Writers ({work.writers.length})
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {work.writers.map((writer, writerIndex) => (
                                <div key={writerIndex} className="text-sm border rounded p-2">
                                  <p><strong>Name:</strong> {writer.writerFirstName} {writer.writerLastName}</p>
                                  {writer.writerIPI && <p><strong>IPI:</strong> {writer.writerIPI}</p>}
                                  {writer.role && <p><strong>Role:</strong> {writer.role}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Enhanced Publishers */}
                        {work.publishers && work.publishers.length > 0 && (
                          <div>
                            <h5 className="font-medium mb-2 flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              Publishers ({work.publishers.length})
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {work.publishers.map((publisher, pubIndex) => (
                                <div key={pubIndex} className="text-sm border rounded p-2">
                                  <p><strong>Name:</strong> {publisher.publisherName}</p>
                                  {publisher.publisherIpiNumber && <p><strong>IPI:</strong> {publisher.publisherIpiNumber}</p>}
                                  {publisher.mlcPublisherNumber && <p><strong>MLC #:</strong> {publisher.mlcPublisherNumber}</p>}
                                  {publisher.collectionShare && publisher.collectionShare.length > 0 && (
                                    <p><strong>Collection Share:</strong> {publisher.collectionShare.join(', ')}%</p>
                                  )}
                                  {publisher.administrators && publisher.administrators.length > 0 && (
                                    <div className="mt-1">
                                      <p><strong>Administrators:</strong></p>
                                      <ul className="ml-2">
                                        {publisher.administrators.slice(0, 3).map((admin, adminIndex) => (
                                          <li key={adminIndex} className="text-xs">• {admin.publisherName}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Enhanced Recording Data */}
                {result.recordings && result.recordings.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Recordings Found ({result.recordings.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.recordings.map((recording, index) => (
                        <div key={index} className="border rounded-lg p-3 space-y-2">
                          <p><strong>Title:</strong> {recording.title}</p>
                          <p><strong>Artist:</strong> {recording.artist}</p>
                          <p><strong>ISRC:</strong> {recording.isrc}</p>
                          <p><strong>Labels:</strong> {recording.labels}</p>
                          <p><strong>MLC Song Code:</strong> {recording.mlcsongCode}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legacy Format Support */}
                {(!result.works || result.works.length === 0) && (result.writers?.length > 0 || result.publishers?.length > 0) && (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Legacy Format Data</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.writers?.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2">Writers</h5>
                          {result.writers.map((writer, index) => (
                            <div key={index} className="text-sm border rounded p-2 mb-2">
                              <p><strong>Name:</strong> {writer.name}</p>
                              {writer.writerIPI && <p><strong>IPI:</strong> {writer.writerIPI}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {result.publishers?.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2">Publishers</h5>
                          {result.publishers.map((publisher, index) => (
                            <div key={index} className="text-sm border rounded p-2 mb-2">
                              <p><strong>Name:</strong> {publisher.name}</p>
                              {publisher.publisherIpiNumber && <p><strong>IPI:</strong> {publisher.publisherIpiNumber}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Metadata</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Confidence:</strong> {Math.round((result.confidence || 0) * 100)}%</p>
                    <p><strong>Total Matches:</strong> {result.totalMatches}</p>
                    {result.verification_notes && (
                      <p><strong>Notes:</strong> {result.verification_notes}</p>
                    )}
                    {(result as any).cached && (
                      <Badge variant="outline" className="text-xs">Cached Result</Badge>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No data found in MLC database</p>
                {result.verification_notes && (
                  <p className="text-sm mt-1">{result.verification_notes}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}