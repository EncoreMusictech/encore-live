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
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Edit, Trash2, AlertTriangle, CheckCircle, Link2, ExternalLink, CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRoyaltyAllocations } from "@/hooks/useRoyaltyAllocations";
import { RoyaltyAllocationForm } from "./RoyaltyAllocationForm";
import { AllocationSongMatchDialog } from "./AllocationSongMatchDialog";

export function RoyaltyAllocationList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [territoryFilter, setTerritoryFilter] = useState<string>("all");
  const [writerFilter, setWriterFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [editingAllocation, setEditingAllocation] = useState<any>(null);
  const [matchingAllocation, setMatchingAllocation] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAllocations, setSelectedAllocations] = useState<Set<string>>(new Set());
  const { allocations, loading, deleteAllocation, refreshAllocations } = useRoyaltyAllocations();

  const filteredAllocations = allocations.filter(allocation => {
    const matchesSearch = allocation.song_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (allocation.work_id && allocation.work_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (allocation.artist && allocation.artist.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (allocation.isrc && allocation.isrc.toLowerCase().includes(searchTerm.toLowerCase()));
    
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
    
    return matchesSearch && matchesSource && matchesTerritory && matchesWriter && matchesDateFrom && matchesDateTo;
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
    setSourceFilter("all");
    setTerritoryFilter("all");
    setWriterFilter("");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAllocations(new Set(filteredAllocations.map(a => a.id)));
    } else {
      setSelectedAllocations(new Set());
    }
  };

  const handleSelectOne = (allocationId: string, checked: boolean) => {
    const newSelected = new Set(selectedAllocations);
    if (checked) {
      newSelected.add(allocationId);
    } else {
      newSelected.delete(allocationId);
    }
    setSelectedAllocations(newSelected);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedAllocations) {
      await deleteAllocation(id);
    }
    setSelectedAllocations(new Set());
  };

  const clearSelection = () => {
    setSelectedAllocations(new Set());
  };

  const validateSplits = (allocation: any) => {
    // This would validate that splits total 100%
    // For now, return true
    return true;
  };

  const isAllSelected = filteredAllocations.length > 0 && selectedAllocations.size === filteredAllocations.length;
  const isPartiallySelected = selectedAllocations.size > 0 && selectedAllocations.size < filteredAllocations.length;

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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/30">
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

      {/* Bulk Actions Bar */}
      {selectedAllocations.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <CheckCircle className="h-4 w-4" />
            {selectedAllocations.size} royalties selected
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearSelection}>
              <X className="h-4 w-4 mr-1" />
              Clear Selection
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Selected Royalties</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {selectedAllocations.size} selected royalties and all associated data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete {selectedAllocations.size} Royalties
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all royalties"
                  {...(isPartiallySelected && { 'data-state': 'indeterminate' })}
                />
              </TableHead>
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
                <TableCell>
                  <Checkbox
                    checked={selectedAllocations.has(allocation.id)}
                    onCheckedChange={(checked) => handleSelectOne(allocation.id, checked as boolean)}
                    aria-label={`Select royalty ${allocation.royalty_id}`}
                  />
                </TableCell>
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
          {searchTerm || sourceFilter !== "all" || territoryFilter !== "all" || writerFilter || dateFrom || dateTo
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