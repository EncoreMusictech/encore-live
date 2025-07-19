
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Link, Unlink, DollarSign, Music } from "lucide-react";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { toast } from "@/hooks/use-toast";

interface BatchAllocationLinkerProps {
  batchId?: string;
  onLinkComplete?: () => void;
}

export function BatchAllocationLinker({ batchId, onLinkComplete }: BatchAllocationLinkerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string>(batchId || "");
  const [selectedAllocations, setSelectedAllocations] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  
  const { batches } = useReconciliationBatches();
  const { allocations, updateAllocation } = useRoyaltyAllocations();

  // Filter unlinked allocations
  const unlinkedAllocations = allocations.filter(allocation => !allocation.batch_id);
  
  // Filter allocations based on search and source
  const filteredAllocations = unlinkedAllocations.filter(allocation => {
    const matchesSearch = allocation.song_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (allocation.artist && allocation.artist.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSource = sourceFilter === "all" || allocation.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const selectedBatchData = batches.find(b => b.id === selectedBatch);
  const selectedAllocationData = allocations.filter(a => selectedAllocations.includes(a.id));
  const totalSelectedAmount = selectedAllocationData.reduce((sum, a) => sum + a.gross_royalty_amount, 0);

  const handleLinkAllocations = async () => {
    if (!selectedBatch || selectedAllocations.length === 0) {
      toast({
        title: "Error",
        description: "Please select a batch and at least one allocation",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update each selected allocation to link it to the batch
      const updatePromises = selectedAllocations.map(allocationId =>
        updateAllocation(allocationId, { batch_id: selectedBatch })
      );

      await Promise.all(updatePromises);

      toast({
        title: "Success",
        description: `Linked ${selectedAllocations.length} allocations to batch`,
      });

      setSelectedAllocations([]);
      setIsOpen(false);
      onLinkComplete?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to link allocations to batch",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAllocations(filteredAllocations.map(a => a.id));
    } else {
      setSelectedAllocations([]);
    }
  };

  const handleSelectAllocation = (allocationId: string, checked: boolean) => {
    if (checked) {
      setSelectedAllocations(prev => [...prev, allocationId]);
    } else {
      setSelectedAllocations(prev => prev.filter(id => id !== allocationId));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Link className="h-4 w-4" />
          Link Allocations to Batch
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Link Royalty Allocations to Reconciliation Batch</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Batch Selection */}
          <div className="space-y-2">
            <Label htmlFor="batch-select">Select Reconciliation Batch</Label>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a batch to link allocations to" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.batch_id} - {batch.source} (${batch.total_gross_amount.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Batch Info */}
          {selectedBatchData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Batch Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Batch ID</Label>
                    <div className="font-medium">{selectedBatchData.batch_id}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Source</Label>
                    <Badge variant="outline">{selectedBatchData.source}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Total Amount</Label>
                    <div className="font-medium">${selectedBatchData.total_gross_amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Date Received</Label>
                    <div className="font-medium">{new Date(selectedBatchData.date_received).toLocaleDateString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selection Summary */}
          {selectedAllocations.length > 0 && (
            <Card className="bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{selectedAllocations.length} allocations selected</div>
                    <div className="text-sm text-muted-foreground">
                      Total: ${totalSelectedAmount.toLocaleString()}
                    </div>
                  </div>
                  {selectedBatchData && (
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Batch Coverage</div>
                      <div className="font-medium">
                        {((totalSelectedAmount / selectedBatchData.total_gross_amount) * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by song or artist..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="DSP">DSP</SelectItem>
                <SelectItem value="PRO">PRO</SelectItem>
                <SelectItem value="YouTube">YouTube</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Allocations Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedAllocations.length === filteredAllocations.length && filteredAllocations.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Song</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAllocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedAllocations.includes(allocation.id)}
                        onCheckedChange={(checked) => handleSelectAllocation(allocation.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-muted-foreground" />
                        {allocation.song_title}
                      </div>
                    </TableCell>
                    <TableCell>{allocation.artist || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{allocation.source || 'Unknown'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {allocation.gross_royalty_amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Unlinked</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredAllocations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {unlinkedAllocations.length === 0 
                ? "All allocations are already linked to batches"
                : "No allocations match your search criteria"
              }
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleLinkAllocations}
            disabled={!selectedBatch || selectedAllocations.length === 0}
          >
            Link {selectedAllocations.length} Allocation{selectedAllocations.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
