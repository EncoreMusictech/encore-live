import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Music, User, FileText, Percent } from "lucide-react";
import { useCopyright } from "@/hooks/useCopyright";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { toast } from "@/hooks/use-toast";

interface SongMatch {
  importedSong: {
    workId: string;
    songTitle: string;
    clientName: string;
    workWriters: string;
    share: number;
    grossAmount: number;
  };
  matchedCopyright?: {
    id: string;
    work_title: string;
    internal_id: string;
    work_id: string;
  };
  confidence: number;
  status: 'pending' | 'matched' | 'unmatched';
}

interface SongMatchingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mappedData: any[];
  batchId: string;
  onMatchingComplete: (results: { matched: number; unmatched: number }) => void;
}

export function SongMatchingDialog({ 
  open, 
  onOpenChange, 
  mappedData, 
  batchId,
  onMatchingComplete 
}: SongMatchingDialogProps) {
  const [matches, setMatches] = useState<SongMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { copyrights } = useCopyright();
  const { createAllocation } = useRoyaltyAllocations();

  // Calculate similarity between two strings
  const calculateSimilarity = (str1: string, str2: string): number => {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 100;
    
    // Simple Levenshtein distance based similarity
    const maxLength = Math.max(s1.length, s2.length);
    if (maxLength === 0) return 100;
    
    const distance = levenshteinDistance(s1, s2);
    return Math.round(((maxLength - distance) / maxLength) * 100);
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + substitutionCost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  const findMatches = async () => {
    setLoading(true);
    
    try {
      // First, process and deduplicate the imported songs
      const processedSongs: { [key: string]: any } = {};
      
      for (const row of mappedData) {
        const importedSong = {
          workId: row['Work ID'] || '',
          songTitle: row['Song Title'] || row['Work Title'] || '',
          clientName: row['Client Name'] || '',
          workWriters: row['Work Writers'] || '',
          share: parseFloat(row['Share'] || '0'),
          grossAmount: parseFloat(row['Gross Amount'] || '0'),
        };

        // Skip if no song title
        if (!importedSong.songTitle) continue;

        // Create a deduplication key based on title, writers, and share
        const normalizeString = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ');
        const dedupeKey = `${normalizeString(importedSong.songTitle)}|${normalizeString(importedSong.workWriters)}|${importedSong.share}`;
        
        // If this combination already exists, combine the gross amounts
        if (processedSongs[dedupeKey]) {
          processedSongs[dedupeKey].grossAmount += importedSong.grossAmount;
        } else {
          processedSongs[dedupeKey] = importedSong;
        }
      }

      const songMatches: SongMatch[] = [];
      
      // Process each unique song
      for (const importedSong of Object.values(processedSongs)) {

        // Find best match from copyrights
        let bestMatch = null;
        let bestConfidence = 0;

        for (const copyright of copyrights) {
          const titleSimilarity = calculateSimilarity(importedSong.songTitle, copyright.work_title);
          
          // Bonus points for exact work ID match
          let confidence = titleSimilarity;
          if (importedSong.workId && copyright.work_id && importedSong.workId === copyright.work_id) {
            confidence = Math.max(confidence, 95);
          }

          if (confidence > bestConfidence && confidence >= 60) { // Minimum 60% similarity
            bestConfidence = confidence;
            bestMatch = copyright;
          }
        }

        songMatches.push({
          importedSong,
          matchedCopyright: bestMatch || undefined,
          confidence: bestConfidence,
          status: bestMatch ? 'matched' : 'pending',
        });
      }

      setMatches(songMatches);
    } catch (error) {
      console.error('Error finding matches:', error);
      toast({
        title: "Error",
        description: "Failed to find song matches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMatch = (index: number) => {
    setMatches(prev => prev.map((match, i) => 
      i === index 
        ? { 
            ...match, 
            status: match.status === 'matched' ? 'unmatched' : 'matched' 
          }
        : match
    ));
  };

  const processMatches = async () => {
    setProcessing(true);
    
    try {
      let matchedCount = 0;
      let unmatchedCount = 0;

      for (const match of matches) {
        if (match.status === 'matched' && match.matchedCopyright) {
          // Create royalty allocation for matched songs
          await createAllocation({
            batch_id: batchId,
            copyright_id: match.matchedCopyright.id,
            song_title: match.importedSong.songTitle,
            artist: match.importedSong.clientName,
            gross_royalty_amount: match.importedSong.grossAmount,
            controlled_status: 'Controlled',
            recoupable_expenses: false,
            contract_terms: {},
            ownership_splits: {
              writers: match.importedSong.workWriters,
              share_percentage: match.importedSong.share,
            },
            comments: `Auto-matched from import (${match.confidence}% confidence)`,
          });
          matchedCount++;
        } else {
          // Create unmatched royalty allocation
          await createAllocation({
            batch_id: batchId,
            song_title: match.importedSong.songTitle,
            artist: match.importedSong.clientName,
            gross_royalty_amount: match.importedSong.grossAmount,
            controlled_status: 'Non-Controlled',
            recoupable_expenses: false,
            contract_terms: {},
            ownership_splits: {
              writers: match.importedSong.workWriters,
              share_percentage: match.importedSong.share,
            },
            comments: 'Unmatched - requires manual review',
          });
          unmatchedCount++;
        }
      }

      onMatchingComplete({ matched: matchedCount, unmatched: unmatchedCount });
      
      toast({
        title: "Song Matching Complete",
        description: `${matchedCount} songs matched, ${unmatchedCount} unmatched`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error processing matches:', error);
      toast({
        title: "Error",
        description: "Failed to process song matches",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (open && mappedData.length > 0) {
      findMatches();
    }
  }, [open, mappedData]);

  const matchedCount = matches.filter(m => m.status === 'matched').length;
  const unmatchedCount = matches.filter(m => m.status === 'unmatched' || m.status === 'pending').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Song Matching
          </DialogTitle>
          <DialogDescription>
            Match imported songs with existing work titles in your copyright catalog
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Finding matches...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Songs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{matches.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">Matched</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{matchedCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-600">Unmatched</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{unmatchedCount}</div>
                </CardContent>
              </Card>
            </div>

            {/* Matches Table */}
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="flex-shrink-0">
                <CardTitle>Song Matches</CardTitle>
                <CardDescription>
                  Review and adjust matches before processing
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Imported Song</TableHead>
                        <TableHead>Matched Copyright</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matches.map((match, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{match.importedSong.songTitle}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <User className="h-3 w-3" />
                                {match.importedSong.clientName}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <Percent className="h-3 w-3" />
                                {match.importedSong.share}% - ${match.importedSong.grossAmount}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {match.matchedCopyright ? (
                              <div className="space-y-1">
                                <div className="font-medium">{match.matchedCopyright.work_title}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                  <FileText className="h-3 w-3" />
                                  {match.matchedCopyright.internal_id || match.matchedCopyright.work_id}
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted-foreground text-sm">No match found</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {match.confidence > 0 && (
                              <div className="flex items-center gap-2">
                                <Progress value={match.confidence} className="w-16" />
                                <span className="text-xs">{match.confidence}%</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              match.status === 'matched' ? 'default' : 
                              match.status === 'unmatched' ? 'destructive' : 'secondary'
                            }>
                              {match.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleMatch(index)}
                              disabled={!match.matchedCopyright}
                            >
                              {match.status === 'matched' ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Unmatch
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Match
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4 flex-shrink-0 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={processMatches}
                disabled={processing || matches.length === 0}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Process Matches
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}