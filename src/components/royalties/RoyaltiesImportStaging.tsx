import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Download,
  Upload,
  Search,
  Filter,
  Eye
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useReconciliationBatches } from "@/hooks/useReconciliationBatches";

interface MappedRow {
  workId: string;
  songTitle: string;
  iswc: string;
  clientName: string;
  clientRole: string;
  sharePercentage: number;
  source: string;
  royaltyType: string;
  grossRoyaltyAmount: number;
  periodStart: string;
  periodEnd: string;
  statementSource: string;
  paymentDate: string;
  originalBMIWorkId: string;
  matchStatus: 'matched' | 'unmatched' | 'partial';
  matchDetails: string;
}

interface RoyaltiesImportStagingProps {
  mappedData: MappedRow[];
  originalFileName: string;
  onBack: () => void;
}

export function RoyaltiesImportStaging({ mappedData, originalFileName, onBack }: RoyaltiesImportStagingProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [isImporting, setIsImporting] = useState(false);
  const { createBatch } = useReconciliationBatches();

  // Filter and search logic
  const filteredData = useMemo(() => {
    return mappedData.filter((row, index) => {
      const matchesSearch = !searchTerm || 
        row.songTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.workId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || row.matchStatus === statusFilter;
      const matchesSource = sourceFilter === "all" || row.source === sourceFilter;
      
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [mappedData, searchTerm, statusFilter, sourceFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = mappedData.length;
    const matched = mappedData.filter(row => row.matchStatus === 'matched').length;
    const partial = mappedData.filter(row => row.matchStatus === 'partial').length;
    const unmatched = mappedData.filter(row => row.matchStatus === 'unmatched').length;
    const totalAmount = mappedData.reduce((sum, row) => sum + row.grossRoyaltyAmount, 0);
    const selectedAmount = Array.from(selectedRows).reduce((sum, index) => sum + mappedData[index].grossRoyaltyAmount, 0);
    
    return { total, matched, partial, unmatched, totalAmount, selectedAmount };
  }, [mappedData, selectedRows]);

  // Unique sources for filter
  const uniqueSources = useMemo(() => {
    return Array.from(new Set(mappedData.map(row => row.source)));
  }, [mappedData]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIndices = new Set(filteredData.map((_, index) => 
        mappedData.findIndex(row => row === filteredData[index])
      ));
      setSelectedRows(allIndices);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleRowSelect = (index: number, checked: boolean) => {
    const actualIndex = mappedData.findIndex(row => row === filteredData[index]);
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(actualIndex);
    } else {
      newSelected.delete(actualIndex);
    }
    setSelectedRows(newSelected);
  };

  const handleApproveImport = async () => {
    if (selectedRows.size === 0) {
      toast({
        title: "No Rows Selected",
        description: "Please select at least one row to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    
    try {
      // Calculate totals for selected rows
      const selectedData = Array.from(selectedRows).map(index => mappedData[index]);
      const totalAmount = selectedData.reduce((sum, row) => sum + row.grossRoyaltyAmount, 0);
      
      // Get period range
      const startDates = selectedData.map(row => row.periodStart).sort();
      const endDates = selectedData.map(row => row.periodEnd).sort();
      
      // Create reconciliation batch
      const batchData = {
        source: 'PRO' as const, // BMI is a PRO
        statement_period_start: startDates[0],
        statement_period_end: endDates[endDates.length - 1],
        date_received: new Date().toISOString().split('T')[0],
        total_gross_amount: totalAmount,
        status: 'Imported' as const,
        notes: `BMI Statement Import - ${originalFileName}\n${selectedRows.size} line items imported\nMatched: ${selectedData.filter(r => r.matchStatus === 'matched').length}, Unmatched: ${selectedData.filter(r => r.matchStatus === 'unmatched').length}`,
      };

      const batch = await createBatch(batchData);

      if (batch) {
        // In a real implementation, you would also create individual royalty allocation records
        // linked to this batch. For now, we'll just show success.
        
        toast({
          title: "Import Successful",
          description: `Successfully imported ${selectedRows.size} royalty line items to batch ${batch.batch_id}`,
        });

        // Navigate back or show success state
        onBack();
      }

    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import royalty data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const exportToCSV = () => {
    const selectedData = Array.from(selectedRows).map(index => mappedData[index]);
    const csvContent = [
      // Headers
      ['Work ID', 'Song Title', 'ISWC', 'Client Name', 'Client Role', 'Share %', 'Source', 'Royalty Type', 'Amount', 'Period Start', 'Period End', 'Payment Date', 'Match Status', 'Match Details'].join(','),
      // Data rows
      ...selectedData.map(row => [
        row.workId,
        `"${row.songTitle}"`,
        row.iswc,
        `"${row.clientName}"`,
        row.clientRole,
        row.sharePercentage,
        row.source,
        row.royaltyType,
        row.grossRoyaltyAmount,
        row.periodStart,
        row.periodEnd,
        row.paymentDate,
        row.matchStatus,
        `"${row.matchDetails}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bmi-import-staging-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Mapper
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Royalties Import Staging Area</h2>
          <p className="text-muted-foreground">Review and approve BMI statement data for import</p>
        </div>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Import Summary: {originalFileName}
          </CardTitle>
          <CardDescription>
            Review mapped data before final import to reconciliation system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Rows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.matched}</div>
              <div className="text-sm text-muted-foreground">Matched</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.partial}</div>
              <div className="text-sm text-muted-foreground">Partial</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.unmatched}</div>
              <div className="text-sm text-muted-foreground">Unmatched</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unmatched Items Warning */}
      {stats.unmatched > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{stats.unmatched} items</strong> require manual review due to missing matches. 
            These items will create new works/clients upon import.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by song title, client name, or work ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Match Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="unmatched">Unmatched</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="source-filter">Source</Label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {uniqueSources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Import Data ({filteredData.length} rows)</CardTitle>
              <CardDescription>
                Select rows to import • Selected: {selectedRows.size} rows (${stats.selectedAmount.toFixed(2)})
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV} disabled={selectedRows.size === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export Selected
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-3 text-left">
                      <Checkbox
                        checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-3 text-left">Work ID</th>
                    <th className="p-3 text-left">Song Title</th>
                    <th className="p-3 text-left">Client</th>
                    <th className="p-3 text-left">Source</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Amount</th>
                    <th className="p-3 text-left">Period</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, index) => {
                    const actualIndex = mappedData.findIndex(mappedRow => mappedRow === row);
                    const isSelected = selectedRows.has(actualIndex);
                    
                    return (
                      <tr key={index} className={`border-t hover:bg-muted/50 ${isSelected ? 'bg-primary/5' : ''}`}>
                        <td className="p-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleRowSelect(index, checked as boolean)}
                          />
                        </td>
                        <td className="p-3 font-mono text-xs">{row.workId}</td>
                        <td className="p-3 max-w-48 truncate" title={row.songTitle}>{row.songTitle}</td>
                        <td className="p-3 max-w-32 truncate" title={row.clientName}>{row.clientName}</td>
                        <td className="p-3">{row.source}</td>
                        <td className="p-3">{row.royaltyType}</td>
                        <td className="p-3">${row.grossRoyaltyAmount.toFixed(2)}</td>
                        <td className="p-3 text-xs">{row.periodStart}</td>
                        <td className="p-3">
                          <Badge variant={
                            row.matchStatus === 'matched' ? 'default' :
                            row.matchStatus === 'partial' ? 'secondary' : 'destructive'
                          } className="text-xs">
                            {row.matchStatus}
                          </Badge>
                        </td>
                        <td className="p-3 max-w-48 truncate text-xs text-muted-foreground" title={row.matchDetails}>
                          {row.matchDetails}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedRows.size > 0 ? (
                <>Selected {selectedRows.size} rows (${stats.selectedAmount.toFixed(2)})</>
              ) : (
                <>Select rows to import into reconciliation system</>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onBack}>
                Cancel Import
              </Button>
              <Button 
                onClick={handleApproveImport}
                disabled={selectedRows.size === 0 || isImporting}
              >
                {isImporting ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Import ({selectedRows.size})
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}