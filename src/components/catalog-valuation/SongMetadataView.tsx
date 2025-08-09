import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Music, Users, Building, AlertTriangle, CheckCircle, Search, Shield, Loader2, RefreshCw } from 'lucide-react';
import { useSongEstimator } from '@/hooks/useSongEstimator';

interface SongMetadata {
  id: string;
  song_title: string;
  songwriter_name: string;
  co_writers: string[];
  publishers: any;
  pro_registrations: any;
  iswc?: string;
  estimated_splits: any;
  registration_gaps: string[];
  metadata_completeness_score: number;
  verification_status: string;
  source_data: any;
}

interface SongMetadataViewProps {
  searchId: string;
  songMetadata: SongMetadata[];
}

export function SongMetadataView({ searchId, songMetadata }: SongMetadataViewProps) {
  const [selectedSong, setSelectedSong] = useState<SongMetadata | null>(null);
  const [verifyingBMI, setVerifyingBMI] = useState<string | null>(null);
  const [refreshingCache, setRefreshingCache] = useState(false);
  const { verifySongWithBMI, fetchSongMetadata, refreshCacheForSearch } = useSongEstimator();

  const getCompletenessColor = (score: number) => {
    if (score >= 0.8) return 'text-success';
    if (score >= 0.5) return 'text-warning';
    return 'text-destructive';
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'bmi_verified':
        return (
          <Badge className="bg-success text-success-foreground">
            <Shield className="h-3 w-3 mr-1" />
            BMI Verified
          </Badge>
        );
      case 'ai_generated':
        return <Badge className="bg-info text-info-foreground">AI Generated</Badge>;
      case 'bmi_checked':
        return <Badge className="bg-warning text-warning-foreground">BMI Checked</Badge>;
      case 'partial':
        return <Badge className="bg-warning text-warning-foreground">Partial</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Unverified</Badge>;
    }
  };

  const handleBMIVerification = async (song: SongMetadata) => {
    setVerifyingBMI(song.id);
    try {
      const success = await verifySongWithBMI(song.id, song.song_title, song.songwriter_name);
      if (success) {
        // Refresh the metadata to show updated verification status
        await fetchSongMetadata(searchId);
      }
    } finally {
      setVerifyingBMI(null);
    }
  };

  const handleCacheRefresh = async () => {
    setRefreshingCache(true);
    try {
      await refreshCacheForSearch(searchId);
      await fetchSongMetadata(searchId);
    } finally {
      setRefreshingCache(false);
    }
  };

  const formatSplits = (splits: any) => {
    if (!splits || typeof splits !== 'object') return 'N/A';
    
    return Object.entries(splits)
      .map(([party, percentage]) => `${party}: ${percentage}%`)
      .join(', ');
  };

  const averageCompleteness = songMetadata.length > 0 
    ? songMetadata.reduce((sum, song) => sum + song.metadata_completeness_score, 0) / songMetadata.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{songMetadata.length}</div>
                <div className="text-sm text-muted-foreground">Total Songs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <div>
                <div className="text-2xl font-bold">
                  {songMetadata.filter(s => s.metadata_completeness_score >= 0.8).length}
                </div>
                <div className="text-sm text-muted-foreground">High Quality</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <div>
                <div className="text-2xl font-bold">
                  {songMetadata.filter(s => s.registration_gaps?.length > 0).length}
                </div>
                <div className="text-sm text-muted-foreground">Registration Gaps</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-full">
                <div className="text-2xl font-bold">{Math.round(averageCompleteness * 100)}%</div>
                <div className="text-sm text-muted-foreground">Avg Completeness</div>
                <Progress value={averageCompleteness * 100} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Songs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Song Catalog Metadata</CardTitle>
              <CardDescription>
                Detailed metadata for each song in the catalog with completeness scores and registration status
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCacheRefresh}
              disabled={refreshingCache}
            >
              {refreshingCache ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Cache
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {songMetadata.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No song metadata available</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Song Title</TableHead>
                    <TableHead>Co-Writers</TableHead>
                    <TableHead>Publishers</TableHead>
                    <TableHead>ISWC</TableHead>
                    <TableHead>Completeness</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gaps</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {songMetadata.map((song) => (
                    <TableRow key={song.id}>
                      <TableCell className="font-medium">{song.song_title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {song.co_writers?.length || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {Object.keys(song.publishers || {}).length}
                        </div>
                      </TableCell>
                      <TableCell>
                        {song.iswc ? (
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">{song.iswc}</code>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${getCompletenessColor(song.metadata_completeness_score)}`}>
                            {Math.round(song.metadata_completeness_score * 100)}%
                          </span>
                          <Progress 
                            value={song.metadata_completeness_score * 100} 
                            className="w-16" 
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {getVerificationBadge(song.verification_status)}
                      </TableCell>
                      <TableCell>
                        {song.registration_gaps?.length > 0 ? (
                          <Badge variant="outline" className="text-warning">
                            {song.registration_gaps.length} gaps
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-success">
                            Complete
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedSong(song)}
                          >
                            <Search className="h-3 w-3" />
                          </Button>
                          {song.verification_status !== 'bmi_verified' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBMIVerification(song)}
                              disabled={verifyingBMI === song.id}
                            >
                              {verifyingBMI === song.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Shield className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Song View Modal */}
      {selectedSong && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedSong.song_title} - Detailed Metadata</CardTitle>
            <CardDescription>
              Complete metadata breakdown and registration analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-semibold">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Title:</strong> {selectedSong.song_title}</div>
                  <div><strong>Primary Writer:</strong> {selectedSong.songwriter_name}</div>
                  <div><strong>ISWC:</strong> {selectedSong.iswc || 'Not available'}</div>
                  <div><strong>Primary Territory:</strong> {selectedSong.source_data?.primary_territory || 'Worldwide'}</div>
                  <div>
                    <strong>Co-Writers:</strong> {
                      selectedSong.co_writers?.length > 0 
                        ? selectedSong.co_writers.join(', ')
                        : 'None listed'
                    }
                  </div>
                </div>
              </div>

              {/* Splits & Publishers */}
              <div className="space-y-4">
                <h4 className="font-semibold">Rights & Splits</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Estimated Splits:</strong> {formatSplits(selectedSong.estimated_splits)}</div>
                  <div>
                    <strong>Publishers:</strong> {
                      Object.keys(selectedSong.publishers || {}).length > 0
                        ? Object.entries(selectedSong.publishers).map(([name, share]) => 
                            `${name} (${share}%)`
                          ).join(', ')
                        : 'None listed'
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* PRO Registrations */}
            <div className="space-y-4">
              <h4 className="font-semibold">PRO Registration Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['ASCAP', 'BMI', 'SESAC'].map((pro) => (
                  <div key={pro} className="p-3 border rounded-lg">
                    <div className="font-medium">{pro}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedSong.pro_registrations?.[pro] ? (
                        <Badge className="bg-success text-success-foreground">Registered</Badge>
                      ) : (
                        <Badge variant="outline" className="text-warning">Not Found</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Registration Gaps */}
            {selectedSong.registration_gaps?.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-warning">Registration Gaps Identified</h4>
                <div className="space-y-2">
                  {selectedSong.registration_gaps.map((gap, index) => (
                    <div key={index} className="p-3 border border-warning rounded-lg bg-warning/10">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <span className="text-sm">{gap}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <div>
                {selectedSong.verification_status !== 'bmi_verified' && (
                  <Button
                    variant="default"
                    onClick={() => handleBMIVerification(selectedSong)}
                    disabled={verifyingBMI === selectedSong.id}
                  >
                    {verifyingBMI === selectedSong.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying with BMI...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Verify with BMI
                      </>
                    )}
                  </Button>
                )}
              </div>
              <Button variant="outline" onClick={() => setSelectedSong(null)}>
                Close Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}