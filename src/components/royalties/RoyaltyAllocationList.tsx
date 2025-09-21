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
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";
import { useContacts } from "@/hooks/useContacts";
import { useRoyaltiesImport } from "@/hooks/useRoyaltiesImport";
import { RoyaltyAllocationForm } from "./RoyaltyAllocationForm";
import { AllocationSongMatchDialog } from "./AllocationSongMatchDialog";
import { ENCORE_STANDARD_FIELDS } from "@/lib/encore-mapper";

export function RoyaltyAllocationList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [writerFilter, setWriterFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [editingAllocation, setEditingAllocation] = useState<any>(null);
  const [matchingAllocation, setMatchingAllocation] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAllocations, setSelectedAllocations] = useState<Set<string>>(new Set());
  const { allocations, loading, deleteAllocation, refreshAllocations } = useRoyaltyAllocations();
  const { batches } = useReconciliationBatches();
  const { contacts } = useContacts();
  const { stagingRecords } = useRoyaltiesImport();

  const filteredAllocations = allocations.filter(allocation => {
    const matchesSearch = allocation.song_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (allocation.work_id && allocation.work_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (allocation.artist && allocation.artist.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (allocation.isrc && allocation.isrc.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         // Search by writer names
                         (allocation.work_writers && allocation.work_writers.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (allocation.mapped_data?.['WORK WRITERS'] && allocation.mapped_data['WORK WRITERS'].toLowerCase().includes(searchTerm.toLowerCase())) ||
                         // Search within ownership_splits for writer names
                         (allocation.ownership_splits && typeof allocation.ownership_splits === 'object' && 
                          Object.keys(allocation.ownership_splits).some(contactId => {
                            if (contactId.startsWith('copyright_writer_')) {
                              const writerData = allocation.ownership_splits[contactId];
                              return writerData.writer_name?.toLowerCase().includes(searchTerm.toLowerCase());
                            }
                            const contact = contacts.find(c => c.id === contactId);
                            return contact?.name?.toLowerCase().includes(searchTerm.toLowerCase());
                          }));
    
    const matchesWriter = !writerFilter || 
                         (allocation.ownership_splits && 
                          JSON.stringify(allocation.ownership_splits).toLowerCase().includes(writerFilter.toLowerCase()));
    
    const allocationDate = new Date(allocation.created_at);
    const matchesDateFrom = !dateFrom || allocationDate >= dateFrom;
    const matchesDateTo = !dateTo || allocationDate <= dateTo;
    
    return matchesSearch && matchesWriter && matchesDateFrom && matchesDateTo;
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

  // Removed contract-related filters

  const clearFilters = () => {
    setSearchTerm("");
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

  // Get all available columns from mapped data across all allocations
  const getAllAvailableColumns = () => {
    if (filteredAllocations.length === 0) return [];
    
    const allFields = new Set<string>();
    
    // First, add the fixed columns we always want to show in the specified order
    allFields.add('Checkbox');
    allFields.add('ROYALTY ID');
    allFields.add('STATEMENT ID');
    allFields.add('BATCH ID');
    allFields.add('SOURCE');
    allFields.add('QUARTER');
    allFields.add('WORK IDENTIFIER');
    allFields.add('WORK TITLE');
    allFields.add('WRITERS');
    allFields.add('WRITERS SHARES (%)');
    allFields.add('MEDIA TYPE');
    allFields.add('QUANTITY');
    allFields.add('TERRITORY');
    allFields.add('GROSS');
    allFields.add('ACTIONS');
    
    // Convert to array in the exact order specified
    const orderedFields = [
      'Checkbox',
      'ROYALTY ID',
      'STATEMENT ID', 
      'BATCH ID',
      'SOURCE',
      'QUARTER',
      'WORK IDENTIFIER',
      'WORK TITLE',
      'WRITERS',
      'WRITERS SHARES (%)',
      'MEDIA TYPE',
      'QUANTITY',
      'TERRITORY',
      'GROSS',
      'ACTIONS'
    ];
    
    return orderedFields;
  };

  const getFieldValue = (allocation: any, fieldName: string) => {
    switch (fieldName) {
      case 'ROYALTY ID':
        return allocation.royalty_id;
      case 'STATEMENT ID':
        return allocation.statement_id;
      case 'BATCH ID':
        // Match the Reconciliation Batches table by getting batch_id from the linked batch
        if (allocation.batch_id) {
          // Find the batch that matches this allocation's batch_id
          const linkedBatch = batches?.find(batch => batch.id === allocation.batch_id);
          return linkedBatch?.batch_id || allocation.batch_id;
        }
        return null;
      case 'SOURCE':
        // Show either the Source from the linked batch or the Statement Source from the import
        // 1) If linked to a batch, show the batch source
        if (allocation.batch_id) {
          const linkedBatch = batches?.find(batch => batch.id === allocation.batch_id);
          if (linkedBatch?.source) {
            return linkedBatch.source;
          }
        }
        // 2) Prefer the Statement Source captured at import time (true origin e.g., 'BMI')
        const statementSource = allocation.mapped_data?.['Statement Source'];
        if (statementSource) return statementSource;
        
        // 3) Fallback to detected_source from staging record if available
        if (allocation.staging_record_id) {
          const stagingRecord = stagingRecords?.find(record => record.id === allocation.staging_record_id);
          if (stagingRecord?.detected_source) {
            return stagingRecord.detected_source;
          }
        }
        
        // 4) Final fallback to any existing source field on the allocation
        return allocation.source || null;
      case 'QUARTER':
        return allocation.mapped_data?.['QUARTER'] || allocation.quarter;
      case 'WORK IDENTIFIER':
        // ALWAYS use the copyright work_id if there's a linked copyright
        if (allocation.copyright_id && allocation.copyrights?.work_id) {
          return allocation.copyrights.work_id;
        }
        // Fallback to imported/mapped data if no linked copyright
        return allocation.work_id || allocation.mapped_data?.['WORK IDENTIFIER'] || allocation.work_identifier;
      case 'WORK TITLE':
        return allocation.mapped_data?.['WORK TITLE'] || allocation.song_title;
      case 'WRITERS':
        // First check if we have work_writers field (used for copyright writers)
        if (allocation.work_writers) {
          return allocation.work_writers;
        }
        // Then check mapped data
        if (allocation.mapped_data?.['WORK WRITERS']) {
          return allocation.mapped_data['WORK WRITERS'];
        }
        // Finally try to extract from ownership_splits for contact-based writers
        if (allocation.ownership_splits && typeof allocation.ownership_splits === 'object') {
          const contactIds = Object.keys(allocation.ownership_splits);
          const writerNames = contactIds.map(contactId => {
            // Check if this is a copyright writer (starts with "copyright_writer_")
            if (contactId.startsWith('copyright_writer_')) {
              const writerData = allocation.ownership_splits[contactId];
              return writerData.writer_name || contactId;
            }
            // Otherwise, try to find the contact
            const contact = contacts.find(c => c.id === contactId);
            return contact ? contact.name : contactId;
          });
          return writerNames.length > 0 ? writerNames.join(', ') : 'N/A';
        }
        return 'N/A';
      case 'WRITERS SHARES (%)':
        if (allocation.ownership_splits && typeof allocation.ownership_splits === 'object') {
          // Get writer shares from the ownership_splits object
          const shares = Object.values(allocation.ownership_splits).map((split: any) => `${split.writer_share || 0}%`);
          return shares.length > 0 ? shares.join(', ') : allocation.mapped_data?.['SHARE'] || allocation.share;
        }
        return allocation.mapped_data?.['SHARE'] || allocation.share;
      case 'MEDIA TYPE':
        return allocation.mapped_data?.['MEDIA TYPE'] || allocation.media_type;
      case 'QUANTITY':
        return allocation.mapped_data?.['QUANTITY'] || allocation.quantity;
      case 'TERRITORY':
        return allocation.mapped_data?.['COUNTRY'] || allocation.country;
      case 'GROSS':
        return allocation.mapped_data?.['GROSS'] || allocation.gross_royalty_amount;
      case 'ACTIONS':
      case 'Checkbox':
        return null; // These are handled specially
      default:
        // Check if it's in mapped_data first, then fall back to direct properties
        if ((allocation as any).mapped_data && (allocation as any).mapped_data[fieldName] !== undefined) {
          return (allocation as any).mapped_data[fieldName];
        }
        // Fallback to direct properties for backward compatibility
        return allocation[fieldName.toLowerCase().replace(/\s+/g, '_')] || 
               allocation[fieldName] || 
               'N/A';
    }
  };

  const allAvailableColumns = getAllAvailableColumns();
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
            placeholder="Search by song title, work ID, artist, writer, or ISRC..."
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
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
              {allAvailableColumns.map((columnName) => (
                <TableHead key={columnName} className={columnName === 'Checkbox' ? 'w-12' : ''}>
                  {columnName === 'Checkbox' ? (
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all royalties"
                      {...(isPartiallySelected && { 'data-state': 'indeterminate' })}
                    />
                  ) : (
                    columnName
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAllocations.map((allocation) => (
              <TableRow key={allocation.id}>
                {allAvailableColumns.map((columnName) => {
                  if (columnName === 'Checkbox') {
                    return (
                      <TableCell key={columnName}>
                        <Checkbox
                          checked={selectedAllocations.has(allocation.id)}
                          onCheckedChange={(checked) => handleSelectOne(allocation.id, checked as boolean)}
                          aria-label={`Select royalty ${allocation.royalty_id}`}
                        />
                      </TableCell>
                    );
                  }

                  if (columnName === 'ACTIONS') {
                    return (
                      <TableCell key={columnName}>
                        <div className="flex items-center gap-1">
                           <Dialog open={!!editingAllocation} onOpenChange={(open) => !open && setEditingAllocation(null)}>
                             <DialogTrigger asChild>
                               <Button variant="ghost" size="sm" onClick={() => setEditingAllocation(allocation)}>
                                 <Edit className="h-4 w-4" />
                               </Button>
                             </DialogTrigger>
                             <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                               <DialogHeader>
                                 <DialogTitle>Edit Royalty</DialogTitle>
                               </DialogHeader>
                               {editingAllocation && (
                                 <RoyaltyAllocationForm
                                   allocation={editingAllocation}
                                   onCancel={() => setEditingAllocation(null)}
                                 />
                               )}
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
                    );
                  }

                  const value = getFieldValue(allocation, columnName);
                  
                  return (
                     <TableCell key={columnName} className={columnName === 'WORK TITLE' ? 'font-medium' : ''}>
                       {columnName === 'ROYALTY ID' ? (
                         <span>{value || 'N/A'}</span>
                       ) : columnName === 'STATEMENT ID' ? (
                         <span>{value || 'N/A'}</span>
                       ) : columnName === 'BATCH ID' ? (
                         <span>{value || 'N/A'}</span>
                      ) : columnName === 'WORK TITLE' ? (
                        <div className="flex items-center gap-2">
                          {value}
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
                      ) : columnName === 'GROSS' || columnName === 'NET' ? (
                        <span className="font-medium">
                          ${typeof value === 'number' ? value.toLocaleString() : parseFloat(value || '0').toLocaleString()}
                        </span>
                      ) : columnName === 'WORK IDENTIFIER' ? (
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {value || 'N/A'}
                        </code>
                      ) : columnName === 'SOURCE' ? (
                        value ? (
                          <Badge variant="outline">{value}</Badge>
                        ) : 'N/A'
                      ) : (
                        String(value || 'N/A')
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredAllocations.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm || writerFilter || dateFrom || dateTo
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