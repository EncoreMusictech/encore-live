import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Link2, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AllocationSongMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allocationId: string;
  currentSongTitle: string;
  onMatch: (copyrightId: string, workTitle: string) => void;
}

interface Copyright {
  id: string;
  work_title: string;
  work_id: string;
  iswc: string;
  created_at: string;
}

export function AllocationSongMatchDialog({ 
  open, 
  onOpenChange, 
  allocationId, 
  currentSongTitle,
  onMatch 
}: AllocationSongMatchDialogProps) {
  const [searchTerm, setSearchTerm] = useState(currentSongTitle);
  const [copyrights, setCopyrights] = useState<Copyright[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCopyright, setSelectedCopyright] = useState<string>("");

  const searchCopyrights = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('copyrights')
        .select('id, work_title, work_id, iswc, created_at')
        .ilike('work_title', `%${searchTerm}%`)
        .order('work_title')
        .limit(20);

      if (error) throw error;
      setCopyrights(data || []);
    } catch (error) {
      console.error('Error searching copyrights:', error);
      toast({
        title: "Error",
        description: "Failed to search for songs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async () => {
    if (!selectedCopyright) {
      toast({
        title: "Warning",
        description: "Please select a song to match",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedWork = copyrights.find(c => c.id === selectedCopyright);
      if (!selectedWork) return;

      const { error } = await supabase
        .from('royalty_allocations')
        .update({
          copyright_id: selectedCopyright,
          song_title: selectedWork.work_title,
          updated_at: new Date().toISOString()
        })
        .eq('id', allocationId);

      if (error) throw error;

      onMatch(selectedCopyright, selectedWork.work_title);
      onOpenChange(false);
      
      toast({
        title: "Success",
        description: `Successfully matched to "${selectedWork.work_title}"`,
      });
    } catch (error) {
      console.error('Error matching song:', error);
      toast({
        title: "Error",
        description: "Failed to match song",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (open && searchTerm) {
      searchCopyrights();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Match Song to Copyright
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="current-title">Current Title</Label>
              <Input
                id="current-title"
                value={currentSongTitle}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="search-term">Search for Match</Label>
              <div className="flex gap-2">
                <Input
                  id="search-term"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchCopyrights()}
                  placeholder="Enter song title to search..."
                />
                <Button onClick={searchCopyrights} disabled={loading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {copyrights.length > 0 && (
            <div className="space-y-4">
              <Label>Select a Copyright to Match</Label>
              <div className="border rounded-md max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Work Title</TableHead>
                      <TableHead>Work ID</TableHead>
                      <TableHead>ISWC</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {copyrights.map((copyright) => (
                      <TableRow 
                        key={copyright.id}
                        className={selectedCopyright === copyright.id ? "bg-accent" : ""}
                      >
                        <TableCell>
                          <input
                            type="radio"
                            name="copyright-match"
                            value={copyright.id}
                            checked={selectedCopyright === copyright.id}
                            onChange={(e) => setSelectedCopyright(e.target.value)}
                            className="w-4 h-4"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Music className="h-4 w-4" />
                            {copyright.work_title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {copyright.work_id}
                          </code>
                        </TableCell>
                        <TableCell>
                          {copyright.iswc && (
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {copyright.iswc}
                            </code>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(copyright.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleMatch} 
              disabled={!selectedCopyright}
              className="gap-2"
            >
              <Link2 className="h-4 w-4" />
              Match Selected Song
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}