import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import { WorkSelectionDialog } from "./WorkSelectionDialog";
import { CopyrightDetailsModal } from "../copyright/CopyrightDetailsModal";

interface ScheduleWorksTableProps {
  contractId: string;
}

export function ScheduleWorksTable({ contractId }: ScheduleWorksTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCopyrightId, setSelectedCopyrightId] = useState<string | null>(null);
  const [isCopyrightModalOpen, setIsCopyrightModalOpen] = useState(false);
  const { contracts, removeScheduleWork, refetch } = useContracts();

  // Debug logging
  console.log('ScheduleWorksTable - Contract ID:', contractId);
  console.log('ScheduleWorksTable - Contracts:', contracts.length);

  const contract = contracts.find(c => c.id === contractId);
  const scheduleWorks = contract?.contract_schedule_works || [];
  
  console.log('ScheduleWorksTable - Contract found:', !!contract);
  console.log('ScheduleWorksTable - Schedule works count:', scheduleWorks.length);

  const handleRemoveWork = async (workId: string) => {
    try {
      await removeScheduleWork(workId);
    } catch (error) {
      console.error('Error removing work:', error);
    }
  };

  const handleWorkAdded = () => {
    setIsAddDialogOpen(false);
    refetch(); // Refresh the contracts data
  };

  const handleViewCopyright = (copyrightId: string) => {
    setSelectedCopyrightId(copyrightId);
    setIsCopyrightModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Works linked to this contract inherit royalty and party metadata
        </p>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Work
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Work to Schedule</DialogTitle>
              <DialogDescription>
                Select existing works from your copyright catalog or create new works to add to this contract
              </DialogDescription>
            </DialogHeader>
            
            <WorkSelectionDialog 
              contractId={contractId}
              onSuccess={handleWorkAdded}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {scheduleWorks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No works in schedule yet. Click "Add Work" to link works to this contract.
        </div>
      ) : (
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
            {scheduleWorks.map((work) => (
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
                        onClick={() => handleViewCopyright(work.copyright_id)}
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
            ))}
          </TableBody>
        </Table>
      )}

      {/* Copyright Details Modal */}
      <CopyrightDetailsModal
        isOpen={isCopyrightModalOpen}
        onOpenChange={setIsCopyrightModalOpen}
        copyrightId={selectedCopyrightId}
      />
    </div>
  );
}