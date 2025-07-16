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
  onMatchingComplete,
}: SongMatchingDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [songMatches, setSongMatches] = useState<SongMatch[]>([]);
  const [availableCopyrights, setAvailableCopyrights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();

  // Initialize song matches from mapped data
  useEffect(() => {
    if (open && mappedData.length > 0) {
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

      setSongMatches(Array.from(uniqueSongs.values()));
      loadAvailableCopyrights();
    }
  }, [open, mappedData]);

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

  const handleAutoMatch = () => {
    const updatedMatches = songMatches.map((match) => {
      if (match.isMatched) return match;

      // Try to find matching copyright by title
      const matchedCopyright = availableCopyrights.find((copyright) => {
        const workTitle = copyright.work_title.toLowerCase();
        const songTitle = match.songTitle.toLowerCase();
        
        // Exact match
        if (workTitle === songTitle) return true;
        
        // Check if AKAs include the song title
        if (copyright.akas && Array.isArray(copyright.akas)) {
          return copyright.akas.some((aka: string) => 
            aka.toLowerCase() === songTitle
          );
        }
        
        // Partial match (contains)
        return workTitle.includes(songTitle) || songTitle.includes(workTitle);
      });

      if (matchedCopyright) {
        return {
          ...match,
          matchedCopyright,
          isMatched: true,
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

    const updatedMatches = [...songMatches];
    updatedMatches[songIndex] = {
      ...updatedMatches[songIndex],
      matchedCopyright: copyright,
      isMatched: true,
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

    if (!batchId) {
      toast({
        title: "Error", 
        description: "No batch ID provided",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const allocationsToCreate = [];

      for (const match of songMatches) {
        const baseAllocation = {
          user_id: user.id,
          batch_id: batchId,
          song_title: match.songTitle,
          artist: match.artist,
          gross_royalty_amount: match.grossAmount,
        };

        // Create allocations for matched songs
        if (match.isMatched && match.matchedCopyright) {
          allocationsToCreate.push({
            ...baseAllocation,
            copyright_id: match.matchedCopyright.id,
            controlled_status: 'Controlled' as const,
          });
        } else {
          // Create allocations for unmatched songs (new works)
          allocationsToCreate.push({
            ...baseAllocation,
            controlled_status: 'Non-Controlled' as const,
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

      const matchedCount = songMatches.filter(m => m.isMatched).length;
      const unmatchedCount = songMatches.length - matchedCount;

      onMatchingComplete({ matched: matchedCount, unmatched: unmatchedCount });
      onOpenChange(false);

      toast({
        title: "Success",
        description: `Created ${allocationsToCreate.length} royalty allocations`,
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
              {processing ? "Creating..." : "Create Allocations"}
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
                            ${match.grossAmount.toFixed(2)}
                          </div>
                          {match.isMatched && match.matchedCopyright && (
                            <div className="mt-2 flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                              <span className="text-sm text-emerald-700 font-medium">
                                Matched: {match.matchedCopyright.work_title}
                              </span>
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