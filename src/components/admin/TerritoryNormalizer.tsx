import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function TerritoryNormalizer() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ updated: number; skipped: number; total: number } | null>(null);

  const normalizeAllTerritories = async () => {
    setIsProcessing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('normalize-royalty-territories');

      if (error) throw error;

      setResult(data);
      toast({
        title: 'Territory Normalization Complete',
        description: `Updated ${data.updated} royalties, skipped ${data.skipped} (already normalized)`,
      });
    } catch (error: any) {
      console.error('Territory normalization error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to normalize territories',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Territory Normalization</CardTitle>
        <CardDescription>
          Normalize all territory codes in the royalties table to standard 2-letter codes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={normalizeAllTerritories}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isProcessing ? 'Processing...' : 'Normalize All Territories'}
        </Button>

        {result && (
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Processed:</span>
              <span className="font-medium">{result.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updated:</span>
              <span className="font-medium text-primary">{result.updated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Already Normalized:</span>
              <span className="font-medium text-muted-foreground">{result.skipped}</span>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• All new royalties will automatically use normalized territory codes</p>
          <p>• Territory names like "United States", "USA" will be converted to "US"</p>
          <p>• Full country names will be converted to ISO 2-letter codes</p>
        </div>
      </CardContent>
    </Card>
  );
}
