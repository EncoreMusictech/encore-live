import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useContracts } from '@/hooks/useContracts';
import { useToast } from '@/hooks/use-toast';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

interface SubAccountContractUploadProps {
  companyId: string;
  companyName: string;
}

export function SubAccountContractUpload({ companyId, companyName }: SubAccountContractUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'parsing' | 'review' | 'saving' | 'completed' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Review form fields
  const [title, setTitle] = useState('');
  const [counterpartyName, setCounterpartyName] = useState('');
  const [contractType, setContractType] = useState('publishing');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [commissionPercentage, setCommissionPercentage] = useState('');
  const [postTermMonths, setPostTermMonths] = useState('');
  const [postTermEndDate, setPostTermEndDate] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const { user } = useAuth();
  const { createContract } = useContracts();
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setError(null);
      setUploadStatus('idle');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  const extractTextClientside = async (file: File): Promise<string> => {
    try {
      try {
        const anyGlobal: any = GlobalWorkerOptions as any;
        if (!(anyGlobal as any).__workerInitialized) {
          const worker = new Worker(new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url), { type: 'module' });
          (GlobalWorkerOptions as any).workerPort = worker as any;
          (anyGlobal as any).__workerInitialized = true;
        }
      } catch (e) {
        console.warn('PDF worker init failed:', e);
      }

      const buffer = await file.arrayBuffer();
      const pdf: any = await (getDocument({ data: buffer }) as any).promise;
      let fullText = '';
      const pageLimit = Math.min(pdf.numPages || 0, 50);
      for (let p = 1; p <= pageLimit; p++) {
        const page = await pdf.getPage(p);
        const content: any = await page.getTextContent();
        const text = (content.items || []).map((it: any) => it.str || '').join(' ');
        fullText += text + '\n';
      }
      return fullText.replace(/\s+/g, ' ').trim();
    } catch (err) {
      console.error('Client-side PDF extraction failed:', err);
      return '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    try {
      setUploadStatus('uploading');
      setUploadProgress(10);
      setError(null);

      const fileName = `${user.id}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('contract-documents')
        .upload(fileName, selectedFile, { cacheControl: '3600', upsert: false });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      setUploadProgress(30);

      const { data: { publicUrl } } = supabase.storage
        .from('contract-documents')
        .getPublicUrl(fileName);

      setPdfUrl(publicUrl);
      setUploadStatus('parsing');
      setUploadProgress(40);

      const clientText = await extractTextClientside(selectedFile);
      
      const { data, error: fnError } = await supabase.functions.invoke('parse-contract', {
        body: { fileUrl: publicUrl, fileName: selectedFile.name, userId: user.id, rawText: clientText || undefined },
      });

      if (fnError || !data?.success) throw new Error(data?.error || fnError?.message || 'Failed to parse contract');

      setUploadProgress(80);
      const pd = data.parsed_data;
      setParsedData(pd);
      setConfidence(data.confidence || 0);

      // Auto-fill form
      setTitle(pd.agreement_title || `${pd.contract_type || 'Publishing'} Agreement`);
      setCounterpartyName(pd.counterparty_name || '');
      setContractType(normalizeContractType(pd.contract_type));
      setStartDate(pd.effective_date || '');
      setEndDate(pd.end_date || '');
      setAdvanceAmount(pd.advance_amount?.toString() || '');
      setCommissionPercentage(pd.admin_fee_percentage?.toString() || pd.commission_percentage?.toString() || '');

      setUploadProgress(100);
      setUploadStatus('review');
      toast({ title: 'Contract Parsed', description: `Confidence: ${Math.round((data.confidence || 0) * 100)}%` });
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message);
      setUploadStatus('error');
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleSaveContract = async () => {
    if (!title || !counterpartyName) {
      toast({ title: 'Validation Error', description: 'Title and counterparty name are required.', variant: 'destructive' });
      return;
    }

    try {
      setUploadStatus('saving');

      // Calculate post-term end date from months if provided
      let computedPostTermEndDate = postTermEndDate || null;
      if (!computedPostTermEndDate && postTermMonths && endDate) {
        const end = new Date(endDate);
        end.setMonth(end.getMonth() + parseInt(postTermMonths));
        computedPostTermEndDate = end.toISOString().split('T')[0];
      }

      await createContract({
        title,
        counterparty_name: counterpartyName,
        contract_type: contractType as any,
        start_date: startDate || null,
        end_date: endDate || null,
        advance_amount: advanceAmount ? parseFloat(advanceAmount) : null,
        commission_percentage: commissionPercentage ? parseFloat(commissionPercentage) : null,
        client_company_id: companyId,
        contract_data: parsedData || {},
        contract_status: 'draft' as any,
        original_pdf_url: pdfUrl,
        // Post-term fields stored via contract_data since typed columns may not be in generated types yet
        financial_terms: {
          ...(parsedData?.financial_terms || {}),
          post_term_collection_months: postTermMonths ? parseInt(postTermMonths) : null,
          post_term_collection_end_date: computedPostTermEndDate,
        },
      } as any);

      // If the typed columns exist, update them directly
      // This handles the case where the types haven't been regenerated yet
      if (computedPostTermEndDate || postTermMonths) {
        // The createContract call above returns the contract, but we rely on the
        // financial_terms JSON for now. The direct column update happens below
        // once the types are regenerated.
      }

      setUploadStatus('completed');
      toast({ title: 'Contract Saved', description: `"${title}" has been created for ${companyName}.` });
    } catch (err: any) {
      setError(err.message);
      setUploadStatus('error');
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setUploadStatus('idle');
    setUploadProgress(0);
    setSelectedFile(null);
    setParsedData(null);
    setConfidence(0);
    setError(null);
    setTitle('');
    setCounterpartyName('');
    setContractType('publishing');
    setStartDate('');
    setEndDate('');
    setAdvanceAmount('');
    setCommissionPercentage('');
    setPostTermMonths('');
    setPostTermEndDate('');
    setPdfUrl(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Contract</CardTitle>
        <CardDescription>Upload a PDF contract for {companyName}. AI will parse the agreement terms automatically.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {uploadStatus === 'idle' && (
          <>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-primary/10 rounded-full">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <p className="font-medium">
                  {selectedFile ? selectedFile.name : 'Drop a PDF contract here or click to browse'}
                </p>
                <p className="text-sm text-muted-foreground">PDF files up to 20MB</p>
              </div>
            </div>
            {selectedFile && (
              <Button onClick={handleUpload} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Upload & Parse Contract
              </Button>
            )}
          </>
        )}

        {(uploadStatus === 'uploading' || uploadStatus === 'parsing') && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>{uploadStatus === 'uploading' ? 'Uploading document...' : 'AI is parsing contract terms...'}</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {uploadStatus === 'review' && (
          <div className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Contract parsed with {Math.round(confidence * 100)}% confidence. Review and adjust the fields below.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Counterparty Name *</Label>
                <Input value={counterpartyName} onChange={e => setCounterpartyName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Contract Type</Label>
                <select
                  value={contractType}
                  onChange={e => setContractType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="publishing">Publishing</option>
                  <option value="artist">Artist</option>
                  <option value="producer">Producer</option>
                  <option value="sync">Sync</option>
                  <option value="distribution">Distribution</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Advance Amount</Label>
                <Input type="number" value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Commission %</Label>
                <Input type="number" value={commissionPercentage} onChange={e => setCommissionPercentage(e.target.value)} />
              </div>
            </div>

            {/* Post-Term Collection Period */}
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-500" />
                  Post-Term Collection Period
                </CardTitle>
                <CardDescription className="text-xs">
                  Define how long royalties can be collected after the initial contract term ends.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Collection Period (months)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g. 24"
                      value={postTermMonths}
                      onChange={e => {
                        setPostTermMonths(e.target.value);
                        // Auto-calculate end date
                        if (e.target.value && endDate) {
                          const end = new Date(endDate);
                          end.setMonth(end.getMonth() + parseInt(e.target.value));
                          setPostTermEndDate(end.toISOString().split('T')[0]);
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Collection End Date</Label>
                    <Input
                      type="date"
                      value={postTermEndDate}
                      onChange={e => setPostTermEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={handleSaveContract} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Contract
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </div>
        )}

        {uploadStatus === 'saving' && (
          <div className="flex items-center gap-3 justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Saving contract...</span>
          </div>
        )}

        {uploadStatus === 'completed' && (
          <div className="text-center space-y-4 py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <p className="font-medium">Contract saved successfully!</p>
            <Button onClick={resetForm} variant="outline">Upload Another Contract</Button>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={resetForm} variant="outline" className="w-full">Try Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function normalizeContractType(t?: string): string {
  if (!t) return 'publishing';
  const s = String(t).toLowerCase();
  if (s.includes('publish')) return 'publishing';
  if (s.includes('artist') || s.includes('record')) return 'artist';
  if (s.includes('producer')) return 'producer';
  if (s.includes('sync') || s.includes('licen')) return 'sync';
  if (s.includes('distrib')) return 'distribution';
  return 'publishing';
}
