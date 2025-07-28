import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Upload, Download, BarChart3 } from 'lucide-react';
import { RevenueSource, useCatalogRevenueSources } from '@/hooks/useCatalogRevenueSources';
import { useToast } from '@/hooks/use-toast';

interface RevenueSourcesFormProps {
  catalogValuationId?: string;
  onMetricsUpdate?: (metrics: any) => void;
}

export const RevenueSourcesForm: React.FC<RevenueSourcesFormProps> = ({
  catalogValuationId,
  onMetricsUpdate,
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

  const metrics = calculateRevenueMetrics();

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
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(metrics.totalAdditionalRevenue)}
              </div>
              <div className="text-sm text-muted-foreground">Total Additional Revenue</div>
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
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </div>

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