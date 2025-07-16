import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Edit, Trash2, AlertTriangle, CheckCircle, Link2, ExternalLink, CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { RoyaltyAllocationForm } from "./RoyaltyAllocationForm";
import { AllocationSongMatchDialog } from "./AllocationSongMatchDialog";

export function RoyaltyAllocationList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [territoryFilter, setTerritoryFilter] = useState<string>("all");
  const [writerFilter, setWriterFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [editingAllocation, setEditingAllocation] = useState<any>(null);
  const [matchingAllocation, setMatchingAllocation] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { allocations, loading, deleteAllocation, refreshAllocations } = useRoyaltyAllocations();

  const filteredAllocations = allocations.filter(allocation => {
    const matchesSearch = allocation.song_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         allocation.work_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (allocation.artist && allocation.artist.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (allocation.isrc && allocation.isrc.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "controlled" && allocation.controlled_status === 'Controlled') ||
                         (statusFilter === "recoupable" && allocation.recoupable_expenses);
    
    const matchesSource = sourceFilter === "all" || 
                         (allocation.contract_terms?.source && allocation.contract_terms.source === sourceFilter);
    
    const matchesTerritory = territoryFilter === "all" || 
                            (allocation.contract_terms?.territory && allocation.contract_terms.territory === territoryFilter);
    
    const matchesWriter = !writerFilter || 
                         (allocation.ownership_splits && 
                          JSON.stringify(allocation.ownership_splits).toLowerCase().includes(writerFilter.toLowerCase()));
    
    const allocationDate = new Date(allocation.created_at);
    const matchesDateFrom = !dateFrom || allocationDate >= dateFrom;
    const matchesDateTo = !dateTo || allocationDate <= dateTo;
    
    return matchesSearch && matchesStatus && matchesSource && matchesTerritory && matchesWriter && matchesDateFrom && matchesDateTo;
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

  // Get unique values for filter dropdowns
  const uniqueSources = [...new Set(allocations.map(a => a.contract_terms?.source).filter(Boolean))];
  const uniqueTerritories = [...new Set(allocations.map(a => a.contract_terms?.territory).filter(Boolean))];

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSourceFilter("all");
    setTerritoryFilter("all");
    setWriterFilter("");
    setDateFrom(undefined);
    setDateTo(undefined);
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
      {/* Search and Filter Toggle */}
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
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 border rounded-lg bg-muted/30">
          <div>
            <Label htmlFor="status-filter" className="text-sm font-medium">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Royalties</SelectItem>
                <SelectItem value="controlled">Controlled Only</SelectItem>
                <SelectItem value="recoupable">Recoupable Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="source-filter" className="text-sm font-medium">Source</Label>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {uniqueSources.map(source => (
                  <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="territory-filter" className="text-sm font-medium">Territory</Label>
            <Select value={territoryFilter} onValueChange={setTerritoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Territories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Territories</SelectItem>
                {uniqueTerritories.map(territory => (
                  <SelectItem key={territory} value={territory}>{territory}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="writer-filter" className="text-sm font-medium">Writer</Label>
            <Input
              id="writer-filter"
              placeholder="Search writers..."
              value={writerFilter}
              onChange={(e) => setWriterFilter(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Date Range</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="col-span-full flex justify-end">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Work ID</TableHead>
              <TableHead>Song Title</TableHead>
              <TableHead>Artist</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Territory</TableHead>
              <TableHead>Gross Amount</TableHead>
              <TableHead>Batch/Statement</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAllocations.map((allocation) => (
              <TableRow key={allocation.id}>
                <TableCell className="font-medium">
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    {allocation.work_id}
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
                <TableCell>{allocation.artist || 'N/A'}</TableCell>
                <TableCell>
                  {allocation.contract_terms?.source && (
                    <Badge variant="outline">{allocation.contract_terms.source}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {allocation.contract_terms?.territory || 'N/A'}
                </TableCell>
                <TableCell>${allocation.gross_royalty_amount.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {allocation.batch_id && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs justify-start"
                        onClick={() => window.location.href = `/royalties?tab=statements&batch=${allocation.batch_id}`}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Batch: {allocation.batch_id.slice(-8)}
                      </Button>
                    )}
                    {allocation.contract_terms?.statement_id && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs justify-start"
                        onClick={() => window.location.href = `/royalties?tab=statements&statement=${allocation.contract_terms.statement_id}`}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Statement: {allocation.contract_terms.statement_id.slice(-8)}
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    <Badge className={getControlledStatusColor(allocation.controlled_status)}>
                      {allocation.controlled_status}
                    </Badge>
                    {allocation.recoupable_expenses && (
                      <Badge className="bg-orange-100 text-orange-800">
                        Recoupable
                      </Badge>
                    )}
                    {allocation.copyright_id && (
                      <Badge className="bg-green-100 text-green-800">
                        Matched
                      </Badge>
                    )}
                  </div>
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
                            This will permanently delete the royalty "{allocation.work_id}" and all associated data.
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
          {searchTerm || statusFilter !== "all" || sourceFilter !== "all" || territoryFilter !== "all" || writerFilter || dateFrom || dateTo
            ? "No royalties found matching your filters."
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