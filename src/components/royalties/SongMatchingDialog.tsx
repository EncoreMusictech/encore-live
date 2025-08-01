import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Music, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSongMatchHistory } from "@/hooks/useSongMatchHistory";

interface SongMatch {
  songTitle: string;
  artist: string;
  grossAmount: number;
  share?: string;
  matchedCopyright?: {
    id: string;
    work_title: string;
    internal_id: string;
  };
  isMatched: boolean;
  matchConfidence?: number; // Confidence score 0-1
}

interface SongMatchingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mappedData: any[];
  batchId?: string; // Made optional since allocations can be created without batches
  statementId?: string; // Add statement ID prop
  detectedSource?: string; // Add detected source for match history
  onMatchingComplete: (results: { matched: number; unmatched: number }) => void;
}

export function SongMatchingDialog({
  open,
  onOpenChange,
  mappedData,
  batchId,
  statementId,
  detectedSource,
  onMatchingComplete,
}: SongMatchingDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [songMatches, setSongMatches] = useState<SongMatch[]>([]);
  const [availableCopyrights, setAvailableCopyrights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();
  const { getSavedMatches, saveMultipleMatches } = useSongMatchHistory();

  // Initialize song matches from mapped data and load saved matches
  useEffect(() => {
    if (open && mappedData.length > 0) {
      initializeSongMatches();
    }
  }, [open, mappedData]);

  const initializeSongMatches = async () => {
    const uniqueSongs = new Map<string, SongMatch>();
    
    mappedData.forEach((row) => {
      const songTitle = row['WORK TITLE'] || row['Song Title'] || '';
      const artist = row['WORK WRITERS'] || row['Artist'] || '';
      const grossAmount = parseFloat(row['GROSS'] || row['Gross Amount'] || '0');
      const share = row['SHARE'] || '';
      
      if (songTitle.trim()) {
        const key = `${songTitle}-${artist}`.toLowerCase();
        if (!uniqueSongs.has(key)) {
          uniqueSongs.set(key, {
            songTitle,
            artist,
            grossAmount,
            share,
            isMatched: false,
          });
        } else {
          // Add to existing amount if duplicate
          const existing = uniqueSongs.get(key)!;
          existing.grossAmount += grossAmount;
        }
      }
    });

    // First load the available copyrights
    await loadAvailableCopyrights();

    // Then load saved matches if we have a detected source
    if (detectedSource && uniqueSongs.size > 0 && user) {
      try {
        const savedMatches = await getSavedMatches(detectedSource);
        
        // Apply saved matches to the song list
        savedMatches.forEach((savedMatch) => {
          const key = `${savedMatch.song_title}-${savedMatch.artist_name || ''}`.toLowerCase();
          const song = uniqueSongs.get(key);
          
          if (song && savedMatch.copyright_id) {
            // We need to fetch the copyright details since availableCopyrights might not be ready yet
            // This will be handled after availableCopyrights is loaded
            song.isMatched = true;
            song.matchedCopyright = {
              id: savedMatch.copyright_id,
              work_title: 'Loading...',
              internal_id: 'Loading...'
            };
          }
        });
        
        // Update the matches with actual copyright details
        const songsArray = Array.from(uniqueSongs.values());
        setSongMatches(songsArray);
        
        // Now populate the actual copyright details
        const updatedMatches = songsArray.map((match) => {
          if (match.isMatched && match.matchedCopyright) {
            const fullCopyright = availableCopyrights.find(c => c.id === match.matchedCopyright!.id);
            if (fullCopyright) {
              return {
                ...match,
                matchedCopyright: fullCopyright
              };
            }
          }
          return match;
        });
        
        setSongMatches(updatedMatches);
      } catch (error) {
        console.error('Error loading saved matches:', error);
        setSongMatches(Array.from(uniqueSongs.values()));
      }
    } else {
      setSongMatches(Array.from(uniqueSongs.values()));
    }
  };

  const loadAvailableCopyrights = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('copyrights')
        .select(`
          id, 
          work_title, 
          internal_id, 
          akas,
          copyright_writers (
            writer_name,
            ownership_percentage,
            writer_role
          )
        `)
        .eq('user_id', user.id)
        .order('work_title');

      if (error) throw error;
      setAvailableCopyrights(data || []);
    } catch (error) {
      console.error('Error loading copyrights:', error);
      toast({
        title: "Error",
        description: "Failed to load available copyrights",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMatchConfidence = (songTitle: string, workTitle: string, akas?: string[]): number => {
    const song = songTitle.toLowerCase().trim();
    const work = workTitle.toLowerCase().trim();
    
    // Exact match = 100% confidence
    if (song === work) return 1.0;
    
    // Check AKAs for exact match
    if (akas && Array.isArray(akas)) {
      const exactAkaMatch = akas.some((aka: string) => aka.toLowerCase().trim() === song);
      if (exactAkaMatch) return 0.95;
    }
    
    // Partial matches with different confidence levels
    if (work.includes(song) || song.includes(work)) {
      const longer = song.length > work.length ? song : work;
      const shorter = song.length <= work.length ? song : work;
      const ratio = shorter.length / longer.length;
      
      // Higher confidence for better length ratios
      if (ratio > 0.8) return 0.85;
      if (ratio > 0.6) return 0.75;
      if (ratio > 0.4) return 0.65;
      return 0.55;
    }
    
    return 0;
  };

  const handleAutoMatch = () => {
    const updatedMatches = songMatches.map((match) => {
      if (match.isMatched) return match;

      let bestMatch: any = null;
      let bestConfidence = 0;

      // Find the best matching copyright with confidence score
      availableCopyrights.forEach((copyright) => {
        const confidence = calculateMatchConfidence(
          match.songTitle, 
          copyright.work_title, 
          copyright.akas
        );
        
        if (confidence > bestConfidence && confidence >= 0.55) { // Minimum 55% confidence
          bestMatch = copyright;
          bestConfidence = confidence;
        }
      });

      if (bestMatch) {
        return {
          ...match,
          matchedCopyright: bestMatch,
          isMatched: true,
          matchConfidence: bestConfidence,
        };
      }

      return match;
    });

    setSongMatches(updatedMatches);
    
    const matchedCount = updatedMatches.filter(m => m.isMatched).length;
    toast({
      title: "Auto-match Complete",
      description: `${matchedCount} songs automatically matched`,
    });
  };

  const handleManualMatch = (songIndex: number, copyrightId: string) => {
    const copyright = availableCopyrights.find(c => c.id === copyrightId);
    if (!copyright) return;

    const currentMatch = songMatches[songIndex];
    const confidence = calculateMatchConfidence(
      currentMatch.songTitle,
      copyright.work_title,
      copyright.akas
    );

    const updatedMatches = [...songMatches];
    updatedMatches[songIndex] = {
      ...updatedMatches[songIndex],
      matchedCopyright: copyright,
      isMatched: true,
      matchConfidence: Math.max(confidence, 0.9), // Manual matches get at least 90% confidence
    };
    setSongMatches(updatedMatches);
  };

  const handleUnmatch = (songIndex: number) => {
    const updatedMatches = [...songMatches];
    updatedMatches[songIndex] = {
      ...updatedMatches[songIndex],
      matchedCopyright: undefined,
      isMatched: false,
    };
    setSongMatches(updatedMatches);
  };

  const handleCreateRoyaltyAllocations = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    // Note: batchId is optional for royalty allocations

    setProcessing(true);
    try {
      const allocationsToCreate = [];

      // Create individual allocations for each royalty line in the mapped data
      for (const row of mappedData) {
        const songTitle = row['WORK TITLE'] || row['Song Title'] || '';
        const artist = row['WORK WRITERS'] || row['Artist'] || '';
        const grossAmount = parseFloat(row['GROSS'] || row['Gross Amount'] || '0');
        
        if (!songTitle.trim()) continue; // Skip empty song titles

        // Find the matching song match to determine if it's matched and get copyright info
        const matchKey = `${songTitle}-${artist}`.toLowerCase();
        const correspondingMatch = songMatches.find(match => 
          `${match.songTitle}-${match.artist}`.toLowerCase() === matchKey
        );

        const baseAllocation = {
          user_id: user.id,
          batch_id: batchId || null, // Allow null batch_id for standalone allocations
          song_title: songTitle,
          artist: artist,
          gross_royalty_amount: grossAmount,
          work_id: null, // Explicitly set to null so trigger can generate it
          statement_id: statementId || null, // Add statement ID
          // ENCORE Standard Fields from mapped data
          quarter: row['QUARTER'] || null,
          source: row['SOURCE'] || null,
          revenue_source: row['REVENUE SOURCE'] || null,
          work_identifier: row['WORK IDENTIFIER'] || null,
          work_writers: row['WORK WRITERS'] || null,
          share: row['SHARE'] || null,
          media_type: row['MEDIA TYPE'] || null,
          media_sub_type: row['MEDIA SUB-TYPE'] || null,
          country: row['COUNTRY'] || null,
          quantity: row['QUANTITY'] || null,
          gross_amount: parseFloat(row['GROSS'] || '0'),
          net_amount: parseFloat(row['NET'] || '0'),
          iswc: row['ISWC'] || null,
          // Store ALL mapped data fields for complete replication
          mapped_data: {
            ...row,
            // Add Statement ID to the mapped data so it appears in the table
            'Statement ID': statementId,
            // Ensure batch ID is available in mapped data
            'Batch ID': batchId,
            // Add original detected source
            'Statement Source': row['Statement Source'] || 'Unknown'
          }
        };

        // Create allocations based on whether the song was matched
        if (correspondingMatch?.isMatched && correspondingMatch.matchedCopyright) {
          allocationsToCreate.push({
            ...baseAllocation,
            copyright_id: correspondingMatch.matchedCopyright.id,
            controlled_status: 'Controlled' as const,
          });
        } else {
          // Create allocations for unmatched songs (new works) and add to discrepancies
          allocationsToCreate.push({
            ...baseAllocation,
            controlled_status: 'Non-Controlled' as const,
            comments: 'Unmatched - No corresponding copyright found during song matching',
          });
        }
      }

      console.log('Creating allocations:', allocationsToCreate);

      const { data, error } = await supabase
        .from('royalty_allocations')
        .insert(allocationsToCreate)
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Successfully created allocations:', data);

      // Save the match history for future use
      if (detectedSource) {
        try {
          const matchesToSave = songMatches
            .filter(match => match.isMatched && match.matchedCopyright)
            .map(match => ({
              song_title: match.songTitle,
              artist_name: match.artist,
              copyright_id: match.matchedCopyright!.id,
              match_confidence: 1.0,
              match_type: 'manual'
            }));

          if (matchesToSave.length > 0) {
            await saveMultipleMatches(detectedSource, matchesToSave);
          }
        } catch (error) {
          console.error('Error saving match history:', error);
          // Don't show this error to the user as the main operation succeeded
        }
      }

      const matchedCount = songMatches.filter(m => m.isMatched).length;
      const unmatchedCount = songMatches.length - matchedCount;

      onMatchingComplete({ matched: matchedCount, unmatched: unmatchedCount });
      onOpenChange(false);

      toast({
        title: "Allocations Created",
        description: `Successfully created ${data.length} royalty allocations (${matchedCount} matched, ${unmatchedCount} unmatched)${batchId ? ` for batch ${batchId}` : ' as standalone allocations'}`,
      });
    } catch (error) {
      console.error('Error creating allocations:', error);
      
      // More detailed error handling
      let errorMessage = "Failed to create royalty allocations";
      
      if (error instanceof Error) {
        if (error.message.includes('violates row-level security')) {
          errorMessage = "Permission denied: Cannot create royalty allocations";
        } else if (error.message.includes('violates foreign key')) {
          errorMessage = "Invalid batch ID or copyright ID";
        } else if (error.message.includes('violates check constraint')) {
          errorMessage = "Invalid data format for royalty allocation";
        } else {
          errorMessage = `Database error: ${error.message}`;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredCopyrights = availableCopyrights.filter((copyright) =>
    copyright.work_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    copyright.internal_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const matchedCount = songMatches.filter(m => m.isMatched).length;
  const unmatchedCount = songMatches.length - matchedCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Song Matching
          </DialogTitle>
          <DialogDescription>
            Match imported songs with existing copyrights in your catalog
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <Card className="flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Matching Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{matchedCount}</div>
                  <div className="text-xs text-muted-foreground">Matched</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{unmatchedCount}</div>
                  <div className="text-xs text-muted-foreground">Unmatched</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{songMatches.length}</div>
                  <div className="text-xs text-muted-foreground">Total Songs</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button onClick={handleAutoMatch} variant="outline" disabled={loading}>
              Auto-Match Songs
            </Button>
            <Button 
              onClick={handleCreateRoyaltyAllocations} 
              disabled={processing || songMatches.length === 0}
            >
              {processing ? "Creating..." : "Create Royalties"}
            </Button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          {/* Songs to Match */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Songs from Import</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pt-0 min-h-0">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {songMatches.map((match, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border transition-colors ${
                        match.isMatched 
                          ? 'bg-emerald-50 border-emerald-300 shadow-sm' 
                          : 'bg-slate-50 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className={`font-semibold text-sm ${
                            match.isMatched ? 'text-emerald-900' : 'text-slate-900'
                          }`}>
                            {match.songTitle}
                          </div>
                          <div className={`text-sm ${
                            match.isMatched ? 'text-emerald-700' : 'text-slate-600'
                          }`}>
                            Writers: {match.artist}
                          </div>
                          {match.share && (
                            <div className={`text-sm ${
                              match.isMatched ? 'text-emerald-700' : 'text-slate-600'
                            }`}>
                              Share: {match.share}%
                            </div>
                          )}
                          <div className={`text-sm font-medium ${
                            match.isMatched ? 'text-emerald-800' : 'text-slate-800'
                          }`}>
                            ${match.grossAmount.toLocaleString()}
                          </div>
                          {match.isMatched && match.matchedCopyright && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                                <span className="text-sm text-emerald-700 font-medium">
                                  Matched: {match.matchedCopyright.work_title}
                                </span>
                              </div>
                              {match.matchConfidence && (
                                <div className="flex items-center gap-1">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs px-2 py-0.5 ${
                                      match.matchConfidence >= 0.9 
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                                        : match.matchConfidence >= 0.75 
                                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                                        : 'bg-yellow-50 border-yellow-300 text-yellow-700'
                                    }`}
                                  >
                                    {Math.round(match.matchConfidence * 100)}% confidence
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          {match.isMatched ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnmatch(index)}
                              className="h-7 px-3 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                            >
                              Unmatch
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Unmatched
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Available Copyrights */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Your Copyrights</CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search copyrights..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-0 min-h-0">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {loading ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Loading copyrights...
                    </div>
                  ) : filteredCopyrights.length > 0 ? (
                    filteredCopyrights.map((copyright) => (
                      <div
                        key={copyright.id}
                        className="p-3 rounded border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          // Find first unmatched song and match it
                          const unmatchedIndex = songMatches.findIndex(m => !m.isMatched);
                          if (unmatchedIndex >= 0) {
                            handleManualMatch(unmatchedIndex, copyright.id);
                          }
                        }}
                      >
                        <div className="font-medium text-base leading-tight">{copyright.work_title}</div>
                        <div className="text-sm text-muted-foreground mt-1">{copyright.internal_id}</div>
                        {copyright.copyright_writers && copyright.copyright_writers.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="text-sm font-medium text-slate-700">Writers:</div>
                            {copyright.copyright_writers.slice(0, 3).map((writer: any, idx: number) => (
                              <div key={idx} className="text-sm text-slate-600">
                                {writer.writer_name} ({writer.ownership_percentage}%)
                                {writer.writer_role && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    - {writer.writer_role}
                                  </span>
                                )}
                              </div>
                            ))}
                            {copyright.copyright_writers.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{copyright.copyright_writers.length - 3} more writers
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No copyrights found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}