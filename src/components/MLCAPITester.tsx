import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface MLCTestResult {
  summary?: {
    total_matches: number;
    unique_works: number;
    total_recordings: number;
    strategies_used: number;
  };
  matches?: any[];
  works?: any[];
  error?: string;
  execution_time?: number;
}

export function MLCAPITester() {
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('darren');
  const [lastName, setLastName] = useState('lighty');
  const [ipi, setIpi] = useState('');
  const [title, setTitle] = useState('');
  const [result, setResult] = useState<MLCTestResult | null>(null);

  const testMLCAPI = async () => {
    setLoading(true);
    setResult(null);
    
    const startTime = Date.now();
    
    try {
      console.log('🔍 Starting MLC API test...', { firstName, lastName, ipi, title });
      
      const { data, error } = await supabase.functions.invoke('enhanced-mlc-lookup', {
        body: { 
          workTitle: title,
          writerName: firstName && lastName ? `${firstName} ${lastName}` : '',
          enhanced: true,
          includeRecordings: true
        }
      });
      
      const executionTime = Date.now() - startTime;
      
      if (error) {
        console.error('❌ MLC API Error:', error);
        setResult({ error: error.message, execution_time: executionTime });
        toast.error(`MLC API Error: ${error.message}`);
      } else {
        console.log('✅ MLC API Success:', data);
        setResult({ ...data, execution_time: executionTime });
        
        if (data?.summary) {
          toast.success(`Found ${data.summary.unique_works} works using ${data.summary.strategies_used} strategies`);
        } else {
          toast.success('MLC API call completed');
        }
      }
    } catch (err: any) {
      const executionTime = Date.now() - startTime;
      console.error('❌ MLC API Exception:', err);
      setResult({ error: err.message || 'Unknown error', execution_time: executionTime });
      toast.error(`API Error: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (loading) {
      return <Badge variant="outline" className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Testing...clrect
      </Badge>;
    }
    if (result?.error) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>;
    }
    if (result && !result.error) {
      return <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Success
      </Badge>;
    }
    return <Badge variant="secondary" className="flex items-center gap-1">
      <Clock className="h-3 w-3" />
      Ready
    </Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>MLC API Verification Tool</CardTitle>
              <CardDescription>
                Test the MLC API integration to verify successful calls and data retrieval
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ipi">IPI Number (Optional)</Label>
              <Input
                id="ipi"
                value={ipi}
                onChange={(e) => setIpi(e.target.value)}
                placeholder="Enter IPI number"
              />
            </div>
            <div>
              <Label htmlFor="title">Song Title (Optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter song title"
              />
            </div>
          </div>

          <Button 
            onClick={testMLCAPI} 
            disabled={loading || (!firstName && !lastName)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing MLC API...
              </>
            ) : (
              'Test MLC API Call'
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              API Response
              {result.execution_time && (
                <Badge variant="outline">
                  {result.execution_time}ms
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.error ? (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive font-medium">Error:</p>
                <p className="text-sm text-destructive/80 mt-1">{result.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {result.summary && (
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                    <h4 className="font-medium text-success mb-2">Search Summary:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Total Matches: <span className="font-medium">{result.summary.total_matches}</span></div>
                      <div>Unique Works: <span className="font-medium">{result.summary.unique_works}</span></div>
                      <div>Total Recordings: <span className="font-medium">{result.summary.total_recordings}</span></div>
                      <div>Strategies Used: <span className="font-medium">{result.summary.strategies_used}</span></div>
                    </div>
                  </div>
                )}
                
                <div>
                  <Label>Full Response Data:</Label>
                  <Textarea
                    value={JSON.stringify(result, null, 2)}
                    readOnly
                    className="h-64 font-mono text-xs mt-2"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}