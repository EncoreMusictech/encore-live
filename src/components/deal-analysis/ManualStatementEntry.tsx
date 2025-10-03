import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useHistoricalStatements, HistoricalStatement } from '@/hooks/useHistoricalStatements';
import { useToast } from '@/hooks/use-toast';

interface ManualStatementEntryProps {
  artistName: string;
  onSuccess?: () => void;
}

type QuarterFormData = Omit<HistoricalStatement, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export default function ManualStatementEntry({ artistName, onSuccess }: ManualStatementEntryProps) {
  const currentYear = new Date().getFullYear();
  const { addStatement, statements } = useHistoricalStatements(artistName);
  const { toast } = useToast();
  
  const createEmptyQuarter = (year: number, quarter: number): QuarterFormData => ({
    artist_name: artistName,
    year,
    quarter,
    period_label: `Q${quarter} ${year}`,
    statement_type: 'both',
    gross_revenue: 0,
    net_revenue: 0,
    streams: 0,
    mechanical_royalties: 0,
    performance_royalties: 0,
    sync_revenue: 0,
    streaming_revenue: 0,
    other_revenue: 0,
    expenses: 0,
    notes: '',
  });

  const [quarters, setQuarters] = useState<QuarterFormData[]>([
    createEmptyQuarter(currentYear, 1)
  ]);

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Save all quarters
      for (const quarter of quarters) {
        await addStatement(quarter);
      }
      
      toast({
        title: "Success",
        description: `Added ${quarters.length} quarter(s) of data`,
      });

      // Reset to single empty quarter
      setQuarters([createEmptyQuarter(currentYear, 1)]);

      onSuccess?.();
    } catch (error) {
      console.error('Failed to save statements:', error);
      toast({
        title: "Error",
        description: "Failed to save statements",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addQuarter = () => {
    setQuarters([...quarters, createEmptyQuarter(currentYear, 1)]);
  };

  const removeQuarter = (index: number) => {
    if (quarters.length > 1) {
      setQuarters(quarters.filter((_, i) => i !== index));
    }
  };

  const updateQuarter = (index: number, updates: Partial<QuarterFormData>) => {
    const newQuarters = [...quarters];
    newQuarters[index] = { ...newQuarters[index], ...updates };
    
    // Update period label if year or quarter changed
    if (updates.year !== undefined || updates.quarter !== undefined) {
      const year = updates.year ?? newQuarters[index].year;
      const quarter = updates.quarter ?? newQuarters[index].quarter;
      newQuarters[index].period_label = `Q${quarter} ${year}`;
    }
    
    setQuarters(newQuarters);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {quarters.map((quarter, index) => (
        <Card key={index}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Quarter {index + 1}: {quarter.period_label}</CardTitle>
              {quarters.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeQuarter(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Year</Label>
                <Select
                  value={quarter.year.toString()}
                  onValueChange={(v) => updateQuarter(index, { year: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => currentYear - i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quarter</Label>
                <Select
                  value={quarter.quarter.toString()}
                  onValueChange={(v) => updateQuarter(index, { quarter: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Q1 (Jan-Mar)</SelectItem>
                    <SelectItem value="2">Q2 (Apr-Jun)</SelectItem>
                    <SelectItem value="3">Q3 (Jul-Sep)</SelectItem>
                    <SelectItem value="4">Q4 (Oct-Dec)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Statement Type</Label>
                <Select
                  value={quarter.statement_type}
                  onValueChange={(v: 'recording' | 'publishing' | 'both') => 
                    updateQuarter(index, { statement_type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recording">Recording</SelectItem>
                    <SelectItem value="publishing">Publishing</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Gross Revenue ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={quarter.gross_revenue}
                  onChange={(e) => updateQuarter(index, { gross_revenue: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <Label>Net Revenue ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={quarter.net_revenue}
                  onChange={(e) => updateQuarter(index, { net_revenue: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <Label>Streams (optional)</Label>
                <Input
                  type="number"
                  value={quarter.streams || ''}
                  onChange={(e) => updateQuarter(index, { streams: parseInt(e.target.value) || undefined })}
                />
              </div>

              <div>
                <Label>Expenses ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={quarter.expenses || 0}
                  onChange={(e) => updateQuarter(index, { expenses: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Mechanical Royalties ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={quarter.mechanical_royalties || 0}
                  onChange={(e) => updateQuarter(index, { mechanical_royalties: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label>Performance Royalties ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={quarter.performance_royalties || 0}
                  onChange={(e) => updateQuarter(index, { performance_royalties: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label>Sync Revenue ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={quarter.sync_revenue || 0}
                  onChange={(e) => updateQuarter(index, { sync_revenue: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label>Streaming Revenue ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={quarter.streaming_revenue || 0}
                  onChange={(e) => updateQuarter(index, { streaming_revenue: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label>Other Revenue ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={quarter.other_revenue || 0}
                  onChange={(e) => updateQuarter(index, { other_revenue: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={quarter.notes || ''}
                onChange={(e) => updateQuarter(index, { notes: e.target.value })}
                placeholder="Add any notes about this statement..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" onClick={addQuarter}>
          <Plus className="h-4 w-4 mr-2" />
          Add Another Quarter
        </Button>
        
        <div className="flex items-center gap-4">
          {statements.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {statements.length} of 8 quarters saved
            </div>
          )}
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : `Save ${quarters.length} Quarter${quarters.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </form>
  );
}
