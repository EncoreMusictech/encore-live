import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Edit, Trash2, Link2 } from "lucide-react";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { RoyaltyAllocationForm } from "./RoyaltyAllocationForm";
import { AllocationSongMatchDialog } from "./AllocationSongMatchDialog";

export function RoyaltyAllocationList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAllocation, setEditingAllocation] = useState<any>(null);
  const [matchingAllocation, setMatchingAllocation] = useState<any>(null);
  
  const { allocations, loading, deleteAllocation, refreshAllocations } = useRoyaltyAllocations();

  const filteredAllocations = allocations.filter(allocation => {
    return allocation.song_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (allocation.work_id && allocation.work_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (allocation.artist && allocation.artist.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (allocation.isrc && allocation.isrc.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const getControlledStatusColor = (status: string) => {
    return status === 'Controlled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
  };

  const handleDelete = async (id: string) => {
    await deleteAllocation(id);
  };

  const handleSongMatch = async (copyrightId: string, workTitle: string) => {
    await refreshAllocations();
    setMatchingAllocation(null);
  };


  const validateSplits = (allocation: any) => {
    // This would validate that splits total 100%
    // For now, return true
    return true;
  };

  if (loading) {
    return <div className="p-8 text-center">Loading royalties...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by song title, work ID, artist, or ISRC..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Royalty ID</TableHead>
              <TableHead>Statement ID</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Revenue Source</TableHead>
              <TableHead>Quarter</TableHead>
              <TableHead>Work ID</TableHead>
              <TableHead>Work Title</TableHead>
              <TableHead>Work Writers</TableHead>
              <TableHead>Share</TableHead>
              <TableHead>Media Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Gross</TableHead>
              <TableHead>Net</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAllocations.map((allocation) => (
              <TableRow key={allocation.id}>
                <TableCell className="font-medium">
                  <code className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                    {allocation.royalty_id}
                  </code>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {allocation.contract_terms?.statement_id ? (
                    <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                      {allocation.contract_terms.statement_id}
                    </code>
                  ) : (
                    <span className="text-muted-foreground text-xs">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {allocation.contract_terms?.source ? (
                    <Badge variant="outline">{allocation.contract_terms.source}</Badge>
                  ) : 'N/A'}
                </TableCell>
                <TableCell>{allocation.contract_terms?.revenue_source || allocation.contract_terms?.performance_type || 'N/A'}</TableCell>
                <TableCell>{allocation.contract_terms?.quarter || allocation.contract_terms?.period || 'N/A'}</TableCell>
                <TableCell className="font-medium">
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    {allocation.work_id || 'N/A'}
                  </code>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {allocation.song_title}
                    {!allocation.copyright_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMatchingAllocation(allocation)}
                        className="text-orange-600 hover:text-orange-700"
                        title="Song not matched - click to match"
                      >
                        <Link2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>{allocation.artist || allocation.contract_terms?.writers || 'N/A'}</TableCell>
                <TableCell>{allocation.contract_terms?.share || allocation.ownership_splits?.writer_share || 'N/A'}</TableCell>
                <TableCell>{allocation.contract_terms?.media_type || 'N/A'}</TableCell>
                <TableCell>{allocation.contract_terms?.quantity || allocation.contract_terms?.units || 'N/A'}</TableCell>
                <TableCell>{allocation.contract_terms?.territory || allocation.contract_terms?.country || 'N/A'}</TableCell>
                <TableCell className="font-medium">
                  ${allocation.gross_royalty_amount?.toFixed(2) || '0.00'}
                </TableCell>
                <TableCell>
                  ${allocation.contract_terms?.net_amount?.toFixed(2) || allocation.gross_royalty_amount?.toFixed(2) || '0.00'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setEditingAllocation(allocation)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Royalty</DialogTitle>
                        </DialogHeader>
                        <RoyaltyAllocationForm
                          allocation={editingAllocation}
                          onCancel={() => setEditingAllocation(null)}
                        />
                      </DialogContent>
                    </Dialog>
                    
                    {!allocation.copyright_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMatchingAllocation(allocation)}
                        title="Match to copyright"
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the royalty "{allocation.royalty_id}" and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(allocation.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredAllocations.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm
            ? "No royalties found matching your search."
            : "No royalties found. Create your first royalty to get started."}
        </div>
      )}

      {/* Song Matching Dialog */}
      {matchingAllocation && (
        <AllocationSongMatchDialog
          open={!!matchingAllocation}
          onOpenChange={(open) => !open && setMatchingAllocation(null)}
          allocationId={matchingAllocation.id}
          currentSongTitle={matchingAllocation.song_title}
          onMatch={handleSongMatch}
        />
      )}
    </div>
  );
}