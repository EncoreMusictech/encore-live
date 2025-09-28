import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Upload, Download, BarChart3, FileText, AlertTriangle, CheckCircle, Info, HelpCircle } from 'lucide-react';
import { RevenueSource, useCatalogRevenueSources } from '@/hooks/useCatalogRevenueSources';
import { useToast } from '@/hooks/use-toast';
import { RevenueTypeGuide } from '@/components/catalog-valuation/RevenueTypeGuide';
import { 
  generateCsvTemplateData, 
  validateRevenueSourceRow,
  calculateAdditionalRevenueValuation,
  REVENUE_TYPE_MULTIPLIERS 
} from '@/utils/revenueCalculations';

interface RevenueSourcesFormProps {
  catalogValuationId?: string;
  onMetricsUpdate?: (metrics: any) => void;
  onValuationUpdate?: () => void; // New prop to trigger valuation refresh
}

export const RevenueSourcesForm: React.FC<RevenueSourcesFormProps> = ({
  catalogValuationId,
  onMetricsUpdate,
  onValuationUpdate,
}) => {
  const { toast } = useToast();
  const {
    revenueSources,
    loading,
    addRevenueSource,
    updateRevenueSource,
    deleteRevenueSource,
    importRevenueSources,
    calculateRevenueMetrics,
  } = useCatalogRevenueSources(catalogValuationId);

  const [newSource, setNewSource] = useState<RevenueSource>({
    revenue_type: 'streaming',
    revenue_source: '',
    annual_revenue: 0,
    currency: 'USD',
    growth_rate: 0,
    confidence_level: 'medium',
    is_recurring: true,
    notes: '',
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<RevenueSource[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const revenueTypeOptions = [
    { value: 'streaming', label: 'Streaming Revenue' },
    { value: 'sync', label: 'Sync/Licensing' },
    { value: 'performance', label: 'Live Performance' },
    { value: 'mechanical', label: 'Mechanical Royalties' },
    { value: 'merchandise', label: 'Merchandise' },
    { value: 'touring', label: 'Touring Revenue' },
    { value: 'publishing', label: 'Publishing Revenue' },
    { value: 'master_licensing', label: 'Master Licensing' },
    { value: 'other', label: 'Other Revenue' },
  ];

  const confidenceLevels = [
    { value: 'low', label: 'Low Confidence', color: 'bg-red-500' },
    { value: 'medium', label: 'Medium Confidence', color: 'bg-yellow-500' },
    { value: 'high', label: 'High Confidence', color: 'bg-green-500' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSource.revenue_source || newSource.annual_revenue <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a revenue source name and valid annual revenue amount',
        variant: 'destructive',
      });
      return;
    }

    // If no catalogValuationId, we need to inform the user
    if (!catalogValuationId) {
      toast({
        title: 'Valuation Required',
        description: 'Please complete a catalog valuation first before adding revenue sources',
        variant: 'destructive',
      });
      return;
    }

    const success = editingId
      ? await updateRevenueSource(editingId, newSource)
      : await addRevenueSource(newSource);

    if (success) {
      setNewSource({
        revenue_type: 'streaming',
        revenue_source: '',
        annual_revenue: 0,
        currency: 'USD',
        growth_rate: 0,
        confidence_level: 'medium',
        is_recurring: true,
        notes: '',
      });
      setEditingId(null);
      setShowForm(false);
      
      // Update parent component with new metrics
      if (onMetricsUpdate) {
        setTimeout(() => {
          const metrics = calculateRevenueMetrics();
          onMetricsUpdate(metrics);
        }, 100);
      }
      
      // Trigger enhanced valuation recalculation
      if (onValuationUpdate) {
        setTimeout(() => {
          console.log('Triggering valuation update after revenue source change');
          onValuationUpdate();
        }, 200);
      }
    }
  };

  const handleEdit = (source: RevenueSource) => {
    setNewSource(source);
    setEditingId(source.id || null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this revenue source?')) {
      const success = await deleteRevenueSource(id);
      if (success && onMetricsUpdate) {
        setTimeout(() => {
          const metrics = calculateRevenueMetrics();
          onMetricsUpdate(metrics);
        }, 100);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Generate CSV template using utility function
  const generateCsvTemplate = () => {
    const { csvContent } = generateCsvTemplateData();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'revenue_sources_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Template Downloaded',
      description: 'Revenue sources template with sample data has been downloaded',
    });
  };

  // Parse CSV file with enhanced validation
  const parseCsvFile = (file: File): Promise<RevenueSource[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('CSV file must contain at least a header row and one data row'));
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const { headers: expectedHeaders } = generateCsvTemplateData();

          // Validate headers
          const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
          if (missingHeaders.length > 0) {
            reject(new Error(`Missing required headers: ${missingHeaders.join(', ')}`));
            return;
          }

          const data: RevenueSource[] = [];
          const allErrors: string[] = [];

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row: any = {};
            
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });

            // Use enhanced validation
            const validation = validateRevenueSourceRow(row, i + 1);
            
            if (!validation.isValid) {
              allErrors.push(...validation.errors);
            } else {
              // Transform data
              const revenueSource: RevenueSource = {
                revenue_type: row.revenue_type as RevenueSource['revenue_type'],
                revenue_source: row.revenue_source,
                annual_revenue: parseFloat(row.annual_revenue) || 0,
                currency: row.currency || 'USD',
                growth_rate: parseFloat(row.growth_rate) || 0,
                confidence_level: row.confidence_level as RevenueSource['confidence_level'],
                start_date: row.start_date || undefined,
                end_date: row.end_date || undefined,
                is_recurring: row.is_recurring?.toLowerCase() === 'true',
                notes: row.notes || undefined,
              };

              data.push(revenueSource);
            }
          }

          if (allErrors.length > 0) {
            setImportErrors(allErrors);
          }

          resolve(data);
        } catch (err) {
          reject(new Error('Failed to parse CSV file: ' + (err instanceof Error ? err.message : 'Unknown error')));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a CSV file',
        variant: 'destructive',
      });
      return;
    }

    setImportFile(file);
    setImportErrors([]);
    
    try {
      setImportProgress(25);
      const data = await parseCsvFile(file);
      setImportProgress(50);
      setImportData(data);
      setImportProgress(100);
      
      if (data.length === 0) {
        toast({
          title: 'No Valid Data',
          description: 'No valid revenue sources found in the CSV file',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'File Processed',
          description: `Found ${data.length} valid revenue source${data.length === 1 ? '' : 's'}`,
        });
      }
    } catch (err) {
      toast({
        title: 'Import Error',
        description: err instanceof Error ? err.message : 'Failed to process CSV file',
        variant: 'destructive',
      });
      setImportErrors([err instanceof Error ? err.message : 'Unknown error']);
    }
  };

  // Execute import
  const handleImport = async () => {
    if (!importData.length) return;

    setIsImporting(true);
    const success = await importRevenueSources(importData);
    
    if (success) {
      setShowImportDialog(false);
      setImportFile(null);
      setImportData([]);
      setImportErrors([]);
      setImportProgress(0);
      
      // Update metrics
      if (onMetricsUpdate) {
        setTimeout(() => {
          const metrics = calculateRevenueMetrics();
          onMetricsUpdate(metrics);
        }, 100);
      }
      
      // Trigger valuation update
      if (onValuationUpdate) {
        setTimeout(() => {
          onValuationUpdate();
        }, 200);
      }
    }
    setIsImporting(false);
  };

  // Export current data to CSV
  const exportToCsv = () => {
    if (revenueSources.length === 0) {
      toast({
        title: 'No Data',
        description: 'No revenue sources to export',
        variant: 'destructive',
      });
      return;
    }

    const headers = [
      'revenue_type', 'revenue_source', 'annual_revenue', 'currency',
      'growth_rate', 'confidence_level', 'start_date', 'end_date',
      'is_recurring', 'notes'
    ];

    const csvData = [
      headers,
      ...revenueSources.map(source => [
        source.revenue_type,
        source.revenue_source,
        source.annual_revenue.toString(),
        source.currency,
        source.growth_rate.toString(),
        source.confidence_level,
        source.start_date || '',
        source.end_date || '',
        source.is_recurring.toString(),
        source.notes || ''
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `revenue_sources_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Revenue sources exported successfully',
    });
  };

  const metrics = calculateRevenueMetrics();
  
  // Calculate enhanced valuation metrics
  const enhancedMetrics = calculateAdditionalRevenueValuation(
    revenueSources.map(source => ({
      revenue_type: source.revenue_type,
      annual_revenue: source.annual_revenue,
      confidence_level: source.confidence_level,
      is_recurring: source.is_recurring
    }))
  );

  return (
    <div className="space-y-6">
      {/* Revenue Sources Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Additional Revenue Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(metrics.totalAdditionalRevenue)}
              </div>
              <div className="text-sm text-muted-foreground">Total Additional Revenue</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(enhancedMetrics.totalValuation)}
              </div>
              <div className="text-sm text-muted-foreground">Enhanced Valuation</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {revenueSources.length}
              </div>
              <div className="text-sm text-muted-foreground">Revenue Sources</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {Math.round(metrics.revenueDiversificationScore * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Diversification Score</div>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Revenue Source
            </Button>

            <Button 
              variant="outline" 
              onClick={() => setShowGuide(true)} 
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Revenue Guide
            </Button>
            
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Import Revenue Sources
                  </DialogTitle>
                  <DialogDescription>
                    Import additional revenue sources from a CSV file to enhance your catalog valuation
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">

                  {/* Template Download */}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Need a Template?</AlertTitle>
                    <AlertDescription className="mt-2">
                      Download our CSV template with sample data to get started quickly.
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateCsvTemplate}
                        className="ml-2"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download Template
                      </Button>
                    </AlertDescription>
                  </Alert>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="csv-file">Select CSV File</Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      ref={fileInputRef}
                    />
                    {importFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {importProgress > 0 && importProgress < 100 && (
                    <div className="space-y-2">
                      <Label>Processing...</Label>
                      <Progress value={importProgress} />
                    </div>
                  )}

                  {/* Import Errors */}
                  {importErrors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Import Errors</AlertTitle>
                      <AlertDescription>
                        <div className="mt-2 space-y-1">
                          {importErrors.slice(0, 5).map((error, index) => (
                            <div key={index} className="text-sm">• {error}</div>
                          ))}
                          {importErrors.length > 5 && (
                            <div className="text-sm text-muted-foreground">
                              ... and {importErrors.length - 5} more errors
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Preview Data */}
                  {importData.length > 0 && (
                    <div className="space-y-2">
                      <Label>Preview ({importData.length} revenue sources)</Label>
                      <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
                        {importData.slice(0, 3).map((source, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div>
                              <span className="font-medium">{source.revenue_source}</span>
                              <Badge variant="outline" className="ml-2">
                                {revenueTypeOptions.find(opt => opt.value === source.revenue_type)?.label}
                              </Badge>
                            </div>
                            <span className="text-sm font-medium">
                              {formatCurrency(source.annual_revenue)}
                            </span>
                          </div>
                        ))}
                        {importData.length > 3 && (
                          <div className="text-sm text-muted-foreground text-center">
                            ... and {importData.length - 3} more sources
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowImportDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={importData.length === 0 || isImporting || importErrors.length > 0}
                    >
                      {isImporting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Import {importData.length} Sources
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={exportToCsv} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </div>

          {/* Revenue Type Guide Dialog */}
          <Dialog open={showGuide} onOpenChange={setShowGuide}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Revenue Types & Valuation Guide</DialogTitle>
                <DialogDescription>
                  Understand how different revenue types impact your catalog valuation
                </DialogDescription>
              </DialogHeader>
              <RevenueTypeGuide currentRevenueSources={revenueSources} />
            </DialogContent>
          </Dialog>

          {/* Add/Edit Form */}
          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{editingId ? 'Edit' : 'Add'} Revenue Source</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="revenue_type">Revenue Type</Label>
                      <Select
                        value={newSource.revenue_type}
                        onValueChange={(value) => 
                          setNewSource(prev => ({ ...prev, revenue_type: value as RevenueSource['revenue_type'] }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {revenueTypeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="revenue_source">Revenue Source Name</Label>
                      <Input
                        id="revenue_source"
                        value={newSource.revenue_source}
                        onChange={(e) => setNewSource(prev => ({ ...prev, revenue_source: e.target.value }))}
                        placeholder="e.g., Netflix Sync Deal, Apple Music Streaming"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="annual_revenue">Annual Revenue ($)</Label>
                      <Input
                        id="annual_revenue"
                        type="number"
                        value={newSource.annual_revenue}
                        onChange={(e) => setNewSource(prev => ({ ...prev, annual_revenue: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="growth_rate">Growth Rate (%)</Label>
                      <Input
                        id="growth_rate"
                        type="number"
                        value={newSource.growth_rate}
                        onChange={(e) => setNewSource(prev => ({ ...prev, growth_rate: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.0"
                        min="-100"
                        max="1000"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confidence_level">Confidence Level</Label>
                      <Select
                        value={newSource.confidence_level}
                        onValueChange={(value) => 
                          setNewSource(prev => ({ ...prev, confidence_level: value as RevenueSource['confidence_level'] }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {confidenceLevels.map(level => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Start Date (Optional)</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={newSource.start_date || ''}
                        onChange={(e) => setNewSource(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">End Date (Optional)</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={newSource.end_date || ''}
                        onChange={(e) => setNewSource(prev => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_recurring"
                      checked={newSource.is_recurring}
                      onCheckedChange={(checked) => setNewSource(prev => ({ ...prev, is_recurring: checked }))}
                    />
                    <Label htmlFor="is_recurring">Recurring Revenue</Label>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={newSource.notes || ''}
                      onChange={(e) => setNewSource(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional details about this revenue source..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>
                      {editingId ? 'Update' : 'Add'} Revenue Source
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                        setNewSource({
                          revenue_type: 'streaming',
                          revenue_source: '',
                          annual_revenue: 0,
                          currency: 'USD',
                          growth_rate: 0,
                          confidence_level: 'medium',
                          is_recurring: true,
                          notes: '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Revenue Sources List */}
          <div className="space-y-3">
            {revenueSources.map((source) => (
              <div key={source.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">
                      {revenueTypeOptions.find(opt => opt.value === source.revenue_type)?.label}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`${confidenceLevels.find(level => level.value === source.confidence_level)?.color} text-white`}
                    >
                      {confidenceLevels.find(level => level.value === source.confidence_level)?.label}
                    </Badge>
                    {!source.is_recurring && <Badge variant="outline">One-time</Badge>}
                  </div>
                  <h4 className="font-semibold">{source.revenue_source}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatCurrency(source.annual_revenue)}/year</span>
                    {source.growth_rate !== 0 && (
                      <span className={source.growth_rate > 0 ? 'text-green-600' : 'text-red-600'}>
                        {source.growth_rate > 0 ? '+' : ''}{source.growth_rate}% growth
                      </span>
                    )}
                    {source.start_date && source.end_date && (
                      <span>
                        {new Date(source.start_date).toLocaleDateString()} - {new Date(source.end_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {source.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{source.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(source)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(source.id!)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {revenueSources.length === 0 && !showForm && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No additional revenue sources added yet.</p>
                <p className="text-sm">Add revenue sources to get a more comprehensive valuation.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};