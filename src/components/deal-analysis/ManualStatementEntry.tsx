import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Save } from 'lucide-react';
import { useHistoricalStatements, HistoricalStatement } from '@/hooks/useHistoricalStatements';

interface ManualStatementEntryProps {
  artistName: string;
  onSuccess?: () => void;
}

export default function ManualStatementEntry({ artistName, onSuccess }: ManualStatementEntryProps) {
  const currentYear = new Date().getFullYear();
  const { addStatement, statements } = useHistoricalStatements(artistName);
  
  const [formData, setFormData] = useState<Omit<HistoricalStatement, 'id' | 'user_id' | 'created_at' | 'updated_at'>>({
    artist_name: artistName,
    year: currentYear,
    quarter: 1,
    period_label: `Q1 ${currentYear}`,
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

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await addStatement(formData);
      
      // Reset form
      setFormData({
        ...formData,
        notes: '',
      });

      onSuccess?.();
    } catch (error) {
      console.error('Failed to save statement:', error);
    } finally {
      setSaving(false);
    }
  };

  const updatePeriodLabel = (year: number, quarter: number) => {
    return `Q${quarter} ${year}`;
  };

  const handleYearChange = (year: number) => {
    setFormData({
      ...formData,
      year,
      period_label: updatePeriodLabel(year, formData.quarter),
    });
  };

  const handleQuarterChange = (quarter: number) => {
    setFormData({
      ...formData,
      quarter,
      period_label: updatePeriodLabel(formData.year, quarter),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="year">Year</Label>
              <Select
                value={formData.year.toString()}
                onValueChange={(v) => handleYearChange(parseInt(v))}
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
              <Label htmlFor="quarter">Quarter</Label>
              <Select
                value={formData.quarter.toString()}
                onValueChange={(v) => handleQuarterChange(parseInt(v))}
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
              <Label htmlFor="statement_type">Statement Type</Label>
              <Select
                value={formData.statement_type}
                onValueChange={(v: 'recording' | 'publishing' | 'both') => 
                  setFormData({ ...formData, statement_type: v })
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
              <Label htmlFor="gross_revenue">Gross Revenue ($)</Label>
              <Input
                id="gross_revenue"
                type="number"
                step="0.01"
                value={formData.gross_revenue}
                onChange={(e) => setFormData({ ...formData, gross_revenue: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <Label htmlFor="net_revenue">Net Revenue ($)</Label>
              <Input
                id="net_revenue"
                type="number"
                step="0.01"
                value={formData.net_revenue}
                onChange={(e) => setFormData({ ...formData, net_revenue: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <Label htmlFor="streams">Streams (optional)</Label>
              <Input
                id="streams"
                type="number"
                value={formData.streams || ''}
                onChange={(e) => setFormData({ ...formData, streams: parseInt(e.target.value) || undefined })}
              />
            </div>

            <div>
              <Label htmlFor="expenses">Expenses ($)</Label>
              <Input
                id="expenses"
                type="number"
                step="0.01"
                value={formData.expenses || 0}
                onChange={(e) => setFormData({ ...formData, expenses: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mechanical_royalties">Mechanical Royalties ($)</Label>
              <Input
                id="mechanical_royalties"
                type="number"
                step="0.01"
                value={formData.mechanical_royalties || 0}
                onChange={(e) => setFormData({ ...formData, mechanical_royalties: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="performance_royalties">Performance Royalties ($)</Label>
              <Input
                id="performance_royalties"
                type="number"
                step="0.01"
                value={formData.performance_royalties || 0}
                onChange={(e) => setFormData({ ...formData, performance_royalties: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="sync_revenue">Sync Revenue ($)</Label>
              <Input
                id="sync_revenue"
                type="number"
                step="0.01"
                value={formData.sync_revenue || 0}
                onChange={(e) => setFormData({ ...formData, sync_revenue: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="streaming_revenue">Streaming Revenue ($)</Label>
              <Input
                id="streaming_revenue"
                type="number"
                step="0.01"
                value={formData.streaming_revenue || 0}
                onChange={(e) => setFormData({ ...formData, streaming_revenue: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="other_revenue">Other Revenue ($)</Label>
              <Input
                id="other_revenue"
                type="number"
                step="0.01"
                value={formData.other_revenue || 0}
                onChange={(e) => setFormData({ ...formData, other_revenue: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this statement..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Statement'}
        </Button>
      </div>

      {statements.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {statements.length} of 8 quarters added
        </div>
      )}
    </form>
  );
}
