import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, Upload, TrendingUp } from 'lucide-react';
import ManualStatementEntry from './ManualStatementEntry';
import StatementUploader from './StatementUploader';
import HistoricalDataSummary from './HistoricalDataSummary';
import { useHistoricalStatements } from '@/hooks/useHistoricalStatements';

interface HistoricalStatementInputProps {
  artistName: string;
  onDataUpdate?: () => void;
}

export default function HistoricalStatementInput({ artistName, onDataUpdate }: HistoricalStatementInputProps) {
  const [inputMode, setInputMode] = useState<'summary' | 'manual' | 'upload'>('summary');
  const { statements, hasData, loading } = useHistoricalStatements(artistName);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Historical Statement Data
          </CardTitle>
          <CardDescription>
            Add up to 8 quarters (2 years) of actual statement data for more accurate deal projections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasData && inputMode === 'summary' ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground mb-4">
                No historical data found for {artistName}. Add statement data to enhance deal analysis accuracy.
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => setInputMode('manual')} variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Enter Manually
                </Button>
                <Button onClick={() => setInputMode('upload')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </Button>
              </div>
            </div>
          ) : (
            <Tabs value={inputMode} onValueChange={(v: any) => setInputMode(v)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="manual">
                  <FileText className="h-4 w-4 mr-2" />
                  Manual Entry
                </TabsTrigger>
                <TabsTrigger value="upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-6">
                <HistoricalDataSummary 
                  artistName={artistName}
                  onEdit={() => setInputMode('manual')}
                />
              </TabsContent>

              <TabsContent value="manual" className="mt-6">
                <ManualStatementEntry 
                  artistName={artistName}
                  onSuccess={() => {
                    setInputMode('summary');
                    onDataUpdate?.();
                  }}
                />
              </TabsContent>

              <TabsContent value="upload" className="mt-6">
                <StatementUploader 
                  artistName={artistName}
                  onSuccess={() => {
                    setInputMode('summary');
                    onDataUpdate?.();
                  }}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
