import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Edit, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { RoyaltyAllocationForm } from "./RoyaltyAllocationForm";

export function RoyaltyAllocationList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingAllocation, setEditingAllocation] = useState<any>(null);
  const { allocations, loading, deleteAllocation } = useRoyaltyAllocations();

  const filteredAllocations = allocations.filter(allocation => {
    const matchesSearch = allocation.song_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         allocation.work_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (allocation.artist && allocation.artist.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (allocation.isrc && allocation.isrc.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "controlled" && allocation.controlled_status === 'Controlled') ||
                         (statusFilter === "recoupable" && allocation.recoupable_expenses);
    return matchesSearch && matchesStatus;
  });

  const getControlledStatusColor = (status: string) => {
    return status === 'Controlled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
  };

  const handleDelete = async (id: string) => {
    await deleteAllocation(id);
  };

  const validateSplits = (allocation: any) => {
    // This would validate that splits total 100%
    // For now, return true
    return true;
  };

  if (loading) {
    return <div className="p-8 text-center">Loading royalty allocations...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by song title, work ID, artist, or ISRC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Allocations</SelectItem>
            <SelectItem value="controlled">Controlled Only</SelectItem>
            <SelectItem value="recoupable">Recoupable Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Work ID</TableHead>
              <TableHead>Song Title</TableHead>
              <TableHead>Artist</TableHead>
              <TableHead>ISRC</TableHead>
              <TableHead>Gross Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Validation</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAllocations.map((allocation) => (
              <TableRow key={allocation.id}>
                <TableCell className="font-medium">{allocation.work_id}</TableCell>
                <TableCell>{allocation.song_title}</TableCell>
                <TableCell>{allocation.artist || 'N/A'}</TableCell>
                <TableCell>
                  {allocation.isrc ? (
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {allocation.isrc}
                    </code>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>${allocation.gross_royalty_amount.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Badge className={getControlledStatusColor(allocation.controlled_status)}>
                      {allocation.controlled_status}
                    </Badge>
                    {allocation.recoupable_expenses && (
                      <Badge className="bg-orange-100 text-orange-800">
                        Recoupable
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {validateSplits(allocation) ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setEditingAllocation(allocation)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Royalty Allocation</DialogTitle>
                        </DialogHeader>
                        <RoyaltyAllocationForm
                          allocation={editingAllocation}
                          onCancel={() => setEditingAllocation(null)}
                        />
                      </DialogContent>
                    </Dialog>
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
                            This will permanently delete the royalty allocation "{allocation.work_id}" and all associated data.
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
          {searchTerm || statusFilter !== "all"
            ? "No royalty allocations found matching your filters."
            : "No royalty allocations found. Create your first allocation to get started."}
        </div>
      )}
    </div>
  );
}