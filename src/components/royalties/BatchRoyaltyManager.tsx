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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Link, Unlink, DollarSign, Music, Settings } from "lucide-react";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { toast } from "@/hooks/use-toast";

interface BatchRoyaltyManagerProps {
  batchId?: string;
  onLinkComplete?: () => void;
  embedded?: boolean; // Whether this is embedded in another dialog
}

export function BatchRoyaltyManager({ batchId, onLinkComplete, embedded = false }: BatchRoyaltyManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("link");
  const [selectedBatch, setSelectedBatch] = useState<string>(batchId || "");
  const [selectedAllocations, setSelectedAllocations] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  
  const { batches } = useReconciliationBatches();
  const { allocations, updateAllocation } = useRoyaltyAllocations();

  // Filter unlinked allocations for linking
  const unlinkedAllocations = allocations.filter(allocation => !allocation.batch_id);
  
  // Filter linked allocations for the selected batch
  const linkedAllocations = selectedBatch 
    ? allocations.filter(allocation => allocation.batch_id === selectedBatch)
    : [];
  
  // Apply search and filters
  const getFilteredAllocations = (allocationsList: typeof allocations) => {
    return allocationsList.filter(allocation => {
      const matchesSearch = allocation.song_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (allocation.artist && allocation.artist.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSource = sourceFilter === "all" || allocation.source === sourceFilter;
      return matchesSearch && matchesSource;
    });
  };

  const filteredUnlinkedAllocations = getFilteredAllocations(unlinkedAllocations);
  const filteredLinkedAllocations = getFilteredAllocations(linkedAllocations);

  const selectedBatchData = batches.find(b => b.id === selectedBatch);
  const selectedAllocationData = allocations.filter(a => selectedAllocations.includes(a.id));
  const totalSelectedAmount = selectedAllocationData.reduce((sum, a) => sum + a.gross_royalty_amount, 0);

  // Reset search when switching tabs
  useEffect(() => {
    setSearchTerm("");
    setSelectedAllocations([]);
  }, [activeTab]);

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
      const updatePromises = selectedAllocations.map(allocationId =>
        updateAllocation(allocationId, { batch_id: selectedBatch })
      );

      await Promise.all(updatePromises);

      toast({
        title: "Success",
        description: `Linked ${selectedAllocations.length} allocations to batch`,
      });

      setSelectedAllocations([]);
      onLinkComplete?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to link allocations to batch",
        variant: "destructive",
      });
    }
  };

  const handleUnlinkAllocations = async () => {
    if (selectedAllocations.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one allocation to unlink",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatePromises = selectedAllocations.map(allocationId =>
        updateAllocation(allocationId, { batch_id: null })
      );

      await Promise.all(updatePromises);

      toast({
        title: "Success",
        description: `Unlinked ${selectedAllocations.length} allocations from batch`,
      });

      setSelectedAllocations([]);
      onLinkComplete?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unlink allocations from batch",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = (checked: boolean, allocationsList: typeof allocations) => {
    if (checked) {
      setSelectedAllocations(allocationsList.map(a => a.id));
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

  const renderAllocationTable = (allocationsList: typeof allocations, showUnlinkAction = false) => (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedAllocations.length === allocationsList.length && allocationsList.length > 0}
                onCheckedChange={(checked) => handleSelectAll(checked as boolean, allocationsList)}
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
          {allocationsList.map((allocation) => (
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
                <Badge variant={showUnlinkAction ? "default" : "secondary"}>
                  {showUnlinkAction ? "Linked" : "Unlinked"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const currentAllocations = activeTab === "link" ? filteredUnlinkedAllocations : filteredLinkedAllocations;
  const totalAllocations = activeTab === "link" ? unlinkedAllocations : linkedAllocations;

  // Render the main content
  const renderContent = () => (
    <div className="space-y-6">
      {/* Batch Selection - only show if not embedded with a specific batchId */}
      {!embedded && (
        <div className="space-y-2">
          <Label htmlFor="batch-select">Select Reconciliation Batch</Label>
          <Select value={selectedBatch} onValueChange={setSelectedBatch}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a batch to manage allocations" />
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
      )}

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
                <Label className="text-sm text-muted-foreground">Linked Allocations</Label>
                <div className="font-medium">{linkedAllocations.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Summary */}
      {selectedAllocations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {selectedAllocations.length} allocation{selectedAllocations.length !== 1 ? 's' : ''} selected
                </div>
                <div className="text-sm text-muted-foreground">
                  Total: ${totalSelectedAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Link/Unlink */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="link" className="gap-2">
            <Link className="h-4 w-4" />
            Link Royalties ({unlinkedAllocations.length})
          </TabsTrigger>
          <TabsTrigger value="unlink" className="gap-2" disabled={!selectedBatch}>
            <Unlink className="h-4 w-4" />
            Linked Royalties ({linkedAllocations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="link" className="space-y-4">
          <CardDescription>
            Link unlinked royalty allocations to the selected batch. Only allocations not already linked to another batch are shown.
          </CardDescription>
          
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search allocations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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

          {renderAllocationTable(filteredUnlinkedAllocations)}

          {filteredUnlinkedAllocations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {unlinkedAllocations.length === 0 
                ? "All allocations are already linked to batches"
                : "No allocations match your search criteria"
              }
            </div>
          )}
        </TabsContent>

        <TabsContent value="unlink" className="space-y-4">
          <CardDescription>
            View and unlink royalty allocations from the selected batch.
          </CardDescription>
          
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search linked allocations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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

          {renderAllocationTable(filteredLinkedAllocations, true)}

          {filteredLinkedAllocations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {linkedAllocations.length === 0 
                ? "No allocations are linked to this batch"
                : "No linked allocations match your search criteria"
              }
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Actions - only show in embedded mode */}
      {embedded && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          {activeTab === "link" ? (
            <Button 
              onClick={handleLinkAllocations}
              disabled={!selectedBatch || selectedAllocations.length === 0}
            >
              <Link className="h-4 w-4 mr-2" />
              Link {selectedAllocations.length} Allocation{selectedAllocations.length !== 1 ? 's' : ''}
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive"
                  disabled={selectedAllocations.length === 0}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Unlink {selectedAllocations.length} Allocation{selectedAllocations.length !== 1 ? 's' : ''}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unlink Allocations</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to unlink {selectedAllocations.length} allocation{selectedAllocations.length !== 1 ? 's' : ''} from this batch? 
                    This will make them available for linking to other batches.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleUnlinkAllocations}>
                    Unlink
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  );

  // If embedded, just return the content
  if (embedded) {
    return renderContent();
  }

  // If not embedded, wrap in dialog
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Manage Batch Royalties
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Royalty Allocations & Batch Links</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>

        {/* Actions - only show in standalone mode */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          
          {activeTab === "link" ? (
            <Button 
              onClick={handleLinkAllocations}
              disabled={!selectedBatch || selectedAllocations.length === 0}
            >
              <Link className="h-4 w-4 mr-2" />
              Link {selectedAllocations.length} Allocation{selectedAllocations.length !== 1 ? 's' : ''}
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive"
                  disabled={selectedAllocations.length === 0}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Unlink {selectedAllocations.length} Allocation{selectedAllocations.length !== 1 ? 's' : ''}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unlink Allocations</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to unlink {selectedAllocations.length} allocation{selectedAllocations.length !== 1 ? 's' : ''} from this batch? 
                    This will make them available for linking to other batches.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleUnlinkAllocations}>
                    Unlink
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}