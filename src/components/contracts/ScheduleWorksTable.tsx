import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Plus, Trash2, ExternalLink, Search, X } from "lucide-react";
import { WorkSelectionDialog } from "./WorkSelectionDialog";
import { CopyrightDetailsModal } from "../copyright/CopyrightDetailsModal";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type ScheduleWork = Database['public']['Tables']['contract_schedule_works']['Row'];

interface ScheduleWorksTableProps {
  contractId: string;
}

export function ScheduleWorksTable({ contractId }: ScheduleWorksTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSpotifyFetching, setIsSpotifyFetching] = useState(false);
  const [selectedCopyrightId, setSelectedCopyrightId] = useState<string | null>(null);
  const [isCopyrightModalOpen, setIsCopyrightModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [writersMap, setWritersMap] = useState<Record<string, string[]>>({});
  const [scheduleWorks, setScheduleWorks] = useState<ScheduleWork[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch schedule works directly by contractId instead of relying on useContracts
  const fetchScheduleWorks = useCallback(async () => {
    if (!contractId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contract_schedule_works')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching schedule works:', error);
        return;
      }
      setScheduleWorks(data || []);
    } catch (err) {
      console.error('Error in fetchScheduleWorks:', err);
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    fetchScheduleWorks();
  }, [fetchScheduleWorks]);

  // Fetch writers for works that have a copyright_id
  useEffect(() => {
    const copyrightIds = scheduleWorks
      .map(w => w.copyright_id)
      .filter((id): id is string => !!id);
    if (copyrightIds.length === 0) { setWritersMap({}); return; }

    const fetchWriters = async () => {
      const { data } = await supabase
        .from('copyright_writers')
        .select('copyright_id, writer_name')
        .in('copyright_id', copyrightIds);
      if (data) {
        const map: Record<string, string[]> = {};
        data.forEach(w => {
          if (!map[w.copyright_id]) map[w.copyright_id] = [];
          map[w.copyright_id].push(w.writer_name);
        });
        setWritersMap(map);
      }
    };
    fetchWriters();
  }, [scheduleWorks]);

  const filteredWorks = useMemo(() => {
    if (!searchTerm) return scheduleWorks;
    const term = searchTerm.toLowerCase();
    return scheduleWorks.filter(work =>
      work.song_title?.toLowerCase().includes(term) ||
      work.artist_name?.toLowerCase().includes(term) ||
      work.album_title?.toLowerCase().includes(term) ||
      work.work_id?.toLowerCase().includes(term) ||
      work.isrc?.toLowerCase().includes(term) ||
      work.iswc?.toLowerCase().includes(term) ||
      (work.copyright_id && writersMap[work.copyright_id]?.some(name => name.toLowerCase().includes(term)))
    );
  }, [scheduleWorks, searchTerm, writersMap]);

  const handleRemoveWork = async (workId: string) => {
    try {
      const { error } = await supabase
        .from('contract_schedule_works')
        .delete()
        .eq('id', workId);

      if (error) {
        console.error('Error removing work:', error);
        return;
      }
      // Refresh the list
      fetchScheduleWorks();
    } catch (error) {
      console.error('Error removing work:', error);
    }
  };

  const handleWorkAdded = () => {
    setIsAddDialogOpen(false);
    fetchScheduleWorks();
  };

  const handleViewCopyright = (copyrightId: string) => {
    setSelectedCopyrightId(copyrightId);
    setIsCopyrightModalOpen(true);
  };

  const handleDialogClose = () => {
    if (!isSpotifyFetching) {
      setIsAddDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Works linked to this contract inherit royalty and party metadata
        </p>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          if (open) {
            setIsAddDialogOpen(true);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Work
            </Button>
          </DialogTrigger>
          <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content 
              className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-7xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-card text-card-foreground p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-h-[90vh] overflow-y-auto"
              onPointerDownOutside={(e) => e.preventDefault()} 
              onInteractOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => {
                if (!isSpotifyFetching) {
                  setIsAddDialogOpen(false);
                } else {
                  e.preventDefault();
                }
              }}
            >
              <button
                onClick={() => { if (!isSpotifyFetching) setIsAddDialogOpen(false); }}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
              <DialogHeader>
                <DialogTitle>Add Work to Schedule</DialogTitle>
                <DialogDescription>
                  Select existing works from your copyright catalog or create new works to add to this contract
                </DialogDescription>
              </DialogHeader>
              
              <WorkSelectionDialog 
                contractId={contractId}
                onSuccess={handleWorkAdded}
                onCancel={handleDialogClose}
                onSpotifyFetchChange={setIsSpotifyFetching}
              />
            </DialogPrimitive.Content>
          </DialogPortal>
        </Dialog>
      </div>

      {scheduleWorks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {loading ? "Loading works..." : "No works in schedule yet. Click \"Add Work\" to link works to this contract."}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, artist, songwriter, work ID, ISRC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {filteredWorks.length} of {scheduleWorks.length} works
            </span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Song Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Album</TableHead>
                <TableHead>Work ID</TableHead>
                <TableHead>ISRC</TableHead>
                <TableHead>Inheritance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No works match "{searchTerm}"
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorks.map((work) => (
                  <TableRow key={work.id}>
                    <TableCell>
                      <div className="font-medium">{work.song_title}</div>
                      {work.iswc && (
                        <div className="text-sm text-muted-foreground">ISWC: {work.iswc}</div>
                      )}
                    </TableCell>
                    <TableCell>{work.artist_name || '-'}</TableCell>
                    <TableCell>{work.album_title || '-'}</TableCell>
                    <TableCell>{work.work_id || '-'}</TableCell>
                    <TableCell>{work.isrc || '-'}</TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {work.inherits_royalty_splits && <div>✓ Royalty Splits</div>}
                        {work.inherits_recoupment_status && <div>✓ Recoupment</div>}
                        {work.inherits_controlled_status && <div>✓ Controlled Status</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {work.copyright_id && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="View in Copyright Module"
                            onClick={() => handleViewCopyright(work.copyright_id!)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveWork(work.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <CopyrightDetailsModal
        isOpen={isCopyrightModalOpen}
        onOpenChange={setIsCopyrightModalOpen}
        copyrightId={selectedCopyrightId}
      />
    </div>
  );
}
