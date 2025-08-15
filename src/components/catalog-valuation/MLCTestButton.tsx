import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function MLCTestButton() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testMLCIntegration = async () => {
    setTesting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-mlc-integration', {
        body: {}
      });

      if (error) {
        throw error;
      }

      setResult(data);
      
      if (data.success) {
        toast({
          title: "MLC Integration Test",
          description: "MLC API connection successful!",
        });
      } else {
        toast({
          title: "MLC Integration Test Failed",
          description: data.error || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('MLC test error:', error);
      const errorResult = {
        success: false,
        error: error.message || 'Test failed'
      };
      setResult(errorResult);
      
      toast({
        title: "MLC Test Error",
        description: error.message || 'Failed to test MLC integration',
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const testExistingMLCFunction = async () => {
    setTesting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('mlc-repertoire-lookup', {
        body: {
          workTitle: 'Yesterday',
          writerName: 'Paul McCartney'
        }
      });

      if (error) {
        throw error;
      }

      setResult({
        success: true,
        existingFunction: data,
        message: 'Existing MLC function test'
      });
      
      toast({
        title: "Existing MLC Function Test",
        description: data.found ? "MLC data found!" : "No MLC data found",
      });
    } catch (error) {
      console.error('Existing MLC test error:', error);
      const errorResult = {
        success: false,
        error: error.message || 'Existing function test failed',
        existingFunction: true
      };
      setResult(errorResult);
      
      toast({
        title: "Existing MLC Function Error",
        description: error.message || 'Failed to test existing MLC function',
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          MLC Integration Test
        </CardTitle>
        <CardDescription>
          Test the MLC API integration to debug data retrieval issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={testMLCIntegration}
            disabled={testing}
            variant="outline"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Test New MLC Integration
          </Button>

          <Button
            onClick={testExistingMLCFunction}
            disabled={testing}
            variant="outline"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Test Existing MLC Function
          </Button>
        </div>

        {result && (
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              <span className="font-medium">
                {result.success ? 'Test Successful' : 'Test Failed'}
              </span>
            </div>
            
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}