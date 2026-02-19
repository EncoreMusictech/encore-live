import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useContracts } from '@/hooks/useContracts';
import { useToast } from '@/hooks/use-toast';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { ContractAutoPopulator } from '@/components/contracts/ContractAutoPopulator';
import { ContractDetailsView } from '@/components/contracts/ContractDetailsView';
import { PDFViewer } from '@/components/contracts/PDFViewer';

interface SubAccountContractUploadProps {
  companyId: string;
  companyName: string;
}

interface ParsedContractData {
  contract_type: string;
  parties: Array<{
    name: string;
    role: string;
    contact_info?: {
      email?: string;
      phone?: string;
      address?: string;
    };
  }>;
  financial_terms: {
    advance_amount?: number;
    royalty_rates?: {
      mechanical?: number;
      performance?: number;
      synchronization?: number;
    };
    commission_percentage?: number;
  };
  key_dates: {
    start_date?: string;
    end_date?: string;
    renewal_terms?: string;
  };
  territory?: string;
  works_covered?: Array<{
    title: string;
    artist?: string;
    isrc?: string;
    iswc?: string;
  }>;
  payment_terms?: string;
  recoupment_status?: string;
  termination_clauses?: string;
  additional_terms?: string;
}

export function SubAccountContractUpload({ companyId, companyName }: SubAccountContractUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'parsing' | 'review' | 'saving' | 'completed' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedContractData | null>(null);
  const [rawParsedData, setRawParsedData] = useState<any>(null);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showAutoPopulator, setShowAutoPopulator] = useState(false);
  const [autoPopulatedData, setAutoPopulatedData] = useState<any>(null);

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
  const [notes, setNotes] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const { user } = useAuth();
  const { createContract } = useContracts();
  const { toast } = useToast();

  // Transform raw edge function output into structured ParsedContractData
  const transformParsedData = (rawData: any): ParsedContractData => {
    const parties = [] as ParsedContractData['parties'];

    if (rawData.administrator_name) {
      parties.push({
        name: rawData.administrator_name,
        role: 'administrator',
        contact_info: {
          email: rawData.administrator_email || undefined,
          address: rawData.administrator_address || undefined,
        },
      });
    }

    if (rawData.counterparty_name) {
      parties.push({
        name: rawData.counterparty_name,
        role: 'counterparty',
        contact_info: {
          email: rawData.counterparty_email || undefined,
          address: rawData.counterparty_address || undefined,
        },
      });
    }

    if (rawData.parties && Array.isArray(rawData.parties)) {
      rawData.parties.forEach((party: any) => {
        if (party.party_name && !parties.find(p => p.name === party.party_name)) {
          parties.push({ name: party.party_name, role: party.party_type || 'party', contact_info: {} });
        }
      });
    }

    return {
      contract_type: normalizeContractType(rawData.contract_type),
      parties,
      financial_terms: {
        advance_amount: rawData.advance_amount || 0,
        commission_percentage: rawData.admin_fee_percentage || rawData.commission_percentage || 0,
        royalty_rates: {
          mechanical: rawData.mechanical_split_percentage || 0,
          performance: rawData.performance_percentage || 0,
          synchronization: rawData.sync_revenue_split_percentage || 0,
        },
      },
      key_dates: {
        start_date: rawData.effective_date || undefined,
        end_date: rawData.end_date || undefined,
        renewal_terms: rawData.renewal_options ? 'Automatic renewal' : undefined,
      },
      territory: rawData.territory || undefined,
      works_covered: Array.isArray(rawData.works)
        ? rawData.works.map((w: any) => ({
            title: w.work_title || w.title || w.work_id || '',
            artist: w.artist_name || w.album_title || undefined,
            isrc: w.isrc || undefined,
            iswc: w.iswc_number || w.iswc || undefined,
          }))
        : [],
      payment_terms:
        rawData.payment_terms ||
        `${rawData.payment_terms_days || 'Net'} ${rawData.royalty_frequency || 'quarterly'}`,
      recoupment_status: rawData.recoupable ? 'Recoupable' : 'Non-recoupable',
      termination_clauses: rawData.termination_notice_days
        ? `${rawData.termination_notice_days} days notice required`
        : undefined,
      additional_terms:
        [
          rawData.delivery_requirement && `Delivery Requirement: ${rawData.delivery_requirement}`,
          rawData.delivery_commitment && `Delivery Commitment: ${rawData.delivery_commitment}`,
          rawData.approval_terms && `Approval Terms: ${rawData.approval_terms}`,
        ]
          .filter(Boolean)
          .join(' | ') || undefined,
    };
  };

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
      fullText = fullText.replace(/\s+/g, ' ').trim();

      // If text is long enough, return it directly
      if (fullText.length >= 200) return fullText;

      // OCR fallback for scanned PDFs (first 2 pages)
      try {
        let ocrText = '';
        const pagesToOcr = Math.min(pdf.numPages || 0, 2);
        for (let p = 1; p <= pagesToOcr; p++) {
          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: ctx as any, viewport } as any).promise;
          const dataUrl = canvas.toDataURL('image/png');
          const Tesseract: any = await import('tesseract.js');
          const res: any = await Tesseract.recognize(dataUrl, 'eng');
          ocrText += ' ' + (res?.data?.text || '');
        }
        ocrText = ocrText.replace(/\s+/g, ' ').trim();
        if (ocrText.length > fullText.length) return ocrText;
      } catch (ocrErr) {
        console.warn('OCR fallback failed:', ocrErr);
      }

      return fullText;
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
      setRawParsedData(pd);
      setConfidence(data.confidence || 0);

      // Transform the raw data
      const transformed = transformParsedData(pd);
      setParsedData(transformed);

      // Build form data for auto-population
      const mainParty = transformed.parties?.find(p => p.role !== 'administrator') || transformed.parties?.[0];
      const derivedTitle =
        pd.agreement_title && String(pd.agreement_title).trim().length > 0
          ? pd.agreement_title
          : `${transformed.contract_type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Agreement`;

      const formData = {
        title: derivedTitle,
        counterparty_name: mainParty?.name || '',
        contract_type: transformed.contract_type || 'publishing',
        start_date: transformed.key_dates?.start_date || '',
        end_date: transformed.key_dates?.end_date || '',
        advance_amount: transformed.financial_terms?.advance_amount?.toString() || '',
        commission_percentage: transformed.financial_terms?.commission_percentage
          ? (transformed.financial_terms.commission_percentage * 100).toString()
          : '',
        notes: [
          transformed.payment_terms && `Payment Terms / Frequency: ${transformed.payment_terms}`,
          transformed.recoupment_status && `Recoupment: ${transformed.recoupment_status}`,
          transformed.termination_clauses && `Termination: ${transformed.termination_clauses}`,
          transformed.additional_terms && `Delivery & Approvals: ${transformed.additional_terms}`,
        ]
          .filter(Boolean)
          .join('\n\n'),
      };

      setUploadProgress(100);

      // Auto-populate based on confidence thresholds
      if ((data.confidence || 0) >= 0.6) {
        handleAutoPopulate(formData);
        setUploadStatus('review');
      } else if ((data.confidence || 0) >= 0.4) {
        setShowAutoPopulator(true);
        setUploadStatus('review');
      } else {
        // Low confidence – fill what we can and let user edit
        applyFormData(formData);
        setUploadStatus('review');
      }

      toast({ title: 'Contract Parsed', description: `Confidence: ${Math.round((data.confidence || 0) * 100)}%` });
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message);
      setUploadStatus('error');
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const applyFormData = (formData: any) => {
    setTitle(formData.title || '');
    setCounterpartyName(formData.counterparty_name || '');
    setContractType(normalizeContractType(formData.contract_type));
    setStartDate(formData.start_date || '');
    setEndDate(formData.end_date || '');
    setAdvanceAmount(formData.advance_amount || '');
    setCommissionPercentage(formData.commission_percentage || '');
    setNotes(formData.notes || '');
  };

  const handleAutoPopulate = (formData: any) => {
    applyFormData(formData);
    setAutoPopulatedData(formData);
    setShowAutoPopulator(false);
  };

  const handleSaveContract = async () => {
    if (!title || !counterpartyName) {
      toast({ title: 'Validation Error', description: 'Title and counterparty name are required.', variant: 'destructive' });
      return;
    }

    try {
      setUploadStatus('saving');

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
        contract_data: rawParsedData || parsedData || {},
        contract_status: 'draft' as any,
        original_pdf_url: pdfUrl,
        notes,
        financial_terms: {
          ...(parsedData?.financial_terms || {}),
          post_term_collection_months: postTermMonths ? parseInt(postTermMonths) : null,
          post_term_collection_end_date: computedPostTermEndDate,
        },
      } as any);

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
    setRawParsedData(null);
    setConfidence(0);
    setError(null);
    setShowAutoPopulator(false);
    setAutoPopulatedData(null);
    setTitle('');
    setCounterpartyName('');
    setContractType('publishing');
    setStartDate('');
    setEndDate('');
    setAdvanceAmount('');
    setCommissionPercentage('');
    setPostTermMonths('');
    setPostTermEndDate('');
    setNotes('');
    setPdfUrl(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Contract</CardTitle>
        <CardDescription>Upload a PDF contract for {companyName}. AI will parse the agreement terms automatically.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload area */}
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

        {/* Progress */}
        {(uploadStatus === 'uploading' || uploadStatus === 'parsing') && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>{uploadStatus === 'uploading' ? 'Uploading document...' : 'AI is parsing contract terms...'}</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Auto-Populator card (medium confidence) */}
        {uploadStatus === 'review' && showAutoPopulator && parsedData && (
          <ContractAutoPopulator
            parsedData={parsedData}
            confidence={confidence}
            onAutoPopulate={(formData) => {
              handleAutoPopulate({
                ...formData,
                advance_amount: formData.advance_amount?.toString() || '',
                commission_percentage: formData.commission_percentage?.toString() || '',
              });
            }}
            onEditManually={() => {
              setShowAutoPopulator(false);
              applyFormData({
                title: title || `${parsedData.contract_type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Agreement`,
                counterparty_name: parsedData.parties?.find(p => p.role !== 'administrator')?.name || '',
                contract_type: parsedData.contract_type,
                start_date: parsedData.key_dates?.start_date || '',
                end_date: parsedData.key_dates?.end_date || '',
                advance_amount: parsedData.financial_terms?.advance_amount?.toString() || '',
                commission_percentage: parsedData.financial_terms?.commission_percentage
                  ? (parsedData.financial_terms.commission_percentage * 100).toString()
                  : '',
              });
            }}
          />
        )}

        {/* Tabbed Review Interface */}
        {uploadStatus === 'review' && !showAutoPopulator && parsedData && (
          <div className="space-y-6">
            {/* Status Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Contract Analyzed Successfully
                </CardTitle>
                <CardDescription>
                  {autoPopulatedData
                    ? 'Form auto-populated with extracted data. Review and modify as needed.'
                    : 'Review the extracted information and complete the contract details.'}
                </CardDescription>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-medium">AI Analysis Confidence</span>
                  <Badge variant={confidence > 0.8 ? 'default' : confidence > 0.6 ? 'secondary' : 'destructive'}>
                    {Math.round(confidence * 100)}%
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Contract Details</TabsTrigger>
                <TabsTrigger value="preview">PDF Preview</TabsTrigger>
                <TabsTrigger value="analysis">Full Analysis</TabsTrigger>
              </TabsList>

              {/* Contract Details Tab */}
              <TabsContent value="details" className="space-y-6">
                {autoPopulatedData && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      Contract details have been auto-populated. You can modify any field before saving.
                    </AlertDescription>
                  </Alert>
                )}

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
                        <Input type="date" value={postTermEndDate} onChange={e => setPostTermEndDate(e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Additional notes about this contract"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleSaveContract} className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Contract
                  </Button>
                  <Button variant="outline" onClick={resetForm}>Cancel</Button>
                </div>
              </TabsContent>

              {/* PDF Preview Tab */}
              <TabsContent value="preview">
                {pdfUrl && selectedFile ? (
                  <PDFViewer pdfUrl={pdfUrl} fileName={selectedFile.name} />
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center h-96 text-center">
                      <div>
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">PDF Preview Not Available</h3>
                        <p className="text-muted-foreground">
                          {!pdfUrl ? 'File URL not found' : 'No file selected'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Full Analysis Tab */}
              <TabsContent value="analysis">
                <ContractDetailsView parsedData={rawParsedData || {}} confidence={confidence} />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Saving */}
        {uploadStatus === 'saving' && (
          <div className="flex items-center gap-3 justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Saving contract...</span>
          </div>
        )}

        {/* Completed */}
        {uploadStatus === 'completed' && (
          <div className="text-center space-y-4 py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <p className="font-medium">Contract saved successfully!</p>
            <Button onClick={resetForm} variant="outline">Upload Another Contract</Button>
          </div>
        )}

        {/* Error */}
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
