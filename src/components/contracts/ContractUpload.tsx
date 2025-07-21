
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ContractReviewView } from './ContractReviewView';
import { ContractAutoPopulator } from './ContractAutoPopulator';

interface ContractUploadProps {
  onBack: () => void;
  onSuccess: () => void;
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

export const ContractUpload = ({ onBack, onSuccess }: ContractUploadProps) => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'parsing' | 'completed' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedContractData | null>(null);
  const [parsingResultId, setParsingResultId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [contractTitle, setContractTitle] = useState('');
  const [counterpartyName, setCounterpartyName] = useState('');
  const [notes, setNotes] = useState('');
  const [showReviewView, setShowReviewView] = useState(false);
  const [showAutoPopulator, setShowAutoPopulator] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  const [autoPopulatedData, setAutoPopulatedData] = useState<any>(null);
  
  const { user } = useAuth();

  console.log('ContractUpload component loaded', { 
    user: !!user, 
    userId: user?.id,
    uploadStatus,
    selectedFile: !!selectedFile 
  });

  // Transform parsed data from edge function format to component format
  const transformParsedData = (rawData: any): ParsedContractData => {
    const parties = [];
    
    // Add administrator if available
    if (rawData.administrator_name) {
      parties.push({
        name: rawData.administrator_name,
        role: 'administrator',
        contact_info: {
          email: rawData.administrator_email || undefined,
          address: rawData.administrator_address || undefined
        }
      });
    }
    
    // Add counterparty if available
    if (rawData.counterparty_name) {
      parties.push({
        name: rawData.counterparty_name,
        role: 'counterparty',
        contact_info: {
          email: rawData.counterparty_email || undefined,
          address: rawData.counterparty_address || undefined
        }
      });
    }
    
    // Add any additional parties from the parties array
    if (rawData.parties && Array.isArray(rawData.parties)) {
      rawData.parties.forEach((party: any) => {
        if (party.party_name && !parties.find(p => p.name === party.party_name)) {
          parties.push({
            name: party.party_name,
            role: party.party_type || 'party',
            contact_info: {}
          });
        }
      });
    }

    return {
      contract_type: rawData.contract_type || 'other',
      parties,
      financial_terms: {
        advance_amount: rawData.advance_amount || 0,
        commission_percentage: rawData.admin_fee_percentage || rawData.commission_percentage || 0,
        royalty_rates: {
          mechanical: rawData.mechanical_split_percentage || 0,
          performance: rawData.performance_percentage || 0,
          synchronization: rawData.sync_revenue_split_percentage || 0
        }
      },
      key_dates: {
        start_date: rawData.effective_date || undefined,
        end_date: rawData.end_date || undefined,
        renewal_terms: rawData.renewal_options ? 'Automatic renewal' : undefined
      },
      territory: rawData.territory || undefined,
      works_covered: rawData.works || [],
      payment_terms: rawData.payment_terms || `${rawData.payment_terms_days || 'Net'} ${rawData.royalty_frequency || 'quarterly'}`,
      recoupment_status: rawData.recoupable ? 'Recoupable' : 'Non-recoupable',
      termination_clauses: rawData.termination_notice_days ? `${rawData.termination_notice_days} days notice required` : undefined,
      additional_terms: rawData.notes || undefined
    };
  };

  const extractTextFromPDF = async (fileUrl: string) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.functions.invoke('parse-contract', {
      body: {
        fileUrl: fileUrl,
        fileName: selectedFile?.name || 'unknown.pdf',
        userId: user.id
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }
    if (!data.success) {
      console.error('Edge function returned error:', data.error);
      throw new Error(data.error || 'Failed to extract text from PDF');
    }

    return {
      extractedText: data.extractedText,
      parsed_data: data.parsed_data,
      parsing_result_id: data.parsing_result_id,
      confidence: data.confidence
    };
  };

  const createContractFromParsedData = async (formData?: any) => {
    if (!user || !parsedData) return;

    const dataToUse = formData || autoPopulatedData || {};
    
    const contractData = {
      title: dataToUse.title || contractTitle || `${parsedData.contract_type} Agreement`,
      counterparty_name: dataToUse.counterparty_name || counterpartyName || parsedData.parties?.[1]?.name || 'Unknown Party',
      contract_type: (dataToUse.contract_type || parsedData.contract_type || 'publishing') as any,
      start_date: dataToUse.start_date || parsedData.key_dates?.start_date || null,
      end_date: dataToUse.end_date || parsedData.key_dates?.end_date || null,
      notes: dataToUse.notes || notes,
      financial_terms: dataToUse.financial_terms || parsedData.financial_terms || {},
      royalty_splits: dataToUse.royalty_splits || parsedData.financial_terms?.royalty_rates || {},
      advance_amount: dataToUse.advance_amount || parsedData.financial_terms?.advance_amount || 0,
      commission_percentage: dataToUse.commission_percentage || 
        (parsedData.financial_terms?.commission_percentage ? 
          parsedData.financial_terms.commission_percentage * 100 : 0),
      territories: dataToUse.territories || (parsedData.territory ? [parsedData.territory] : []),
      contract_data: parsedData as any,
      user_id: user.id,
      contact_name: dataToUse.contact_name || '',
      contact_phone: dataToUse.contact_phone || '',
      contact_address: dataToUse.contact_address || '',
      recipient_email: dataToUse.recipient_email || ''
    };

    const { data: contract, error } = await supabase
      .from('contracts')
      .insert(contractData)
      .select()
      .single();

    if (error) throw error;

    // Link the parsing result to the contract (skip for test/demo IDs)
    if (parsingResultId && !parsingResultId.startsWith('test-') && !parsingResultId.startsWith('parsed-')) {
      await supabase
        .from('contract_parsing_results')
        .update({ contract_id: contract.id })
        .eq('id', parsingResultId);
    }

    return contract;
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !user) {
      console.error('Upload failed: Missing file or user', { selectedFile: !!selectedFile, user: !!user });
      toast.error('Please select a file and ensure you are logged in');
      return;
    }

    console.log('Starting file upload...', { fileName: selectedFile.name, fileSize: selectedFile.size, userId: user.id });

    try {
      setUploadStatus('uploading');
      setUploadProgress(10);
      setError(null);

      // Upload PDF to Supabase Storage
      const fileName = `${user.id}/${Date.now()}-${selectedFile.name}`;
      console.log('Uploading to storage...', { fileName, bucketId: 'contract-documents' });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contract-documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('File uploaded successfully:', uploadData);
      setUploadProgress(25);

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('contract-documents')
        .getPublicUrl(fileName);

      setUploadedFileUrl(publicUrl);

      // Extract text and parse contract using edge function
      console.log('Processing contract with AI...');
      setUploadStatus('parsing');
      const result = await extractTextFromPDF(publicUrl);
      console.log('Contract processed successfully:', result);
      
      // Set all the extracted data
      setExtractedText(result.extractedText);
      
      // Transform the parsed data to match the expected format
      const transformedData = transformParsedData(result.parsed_data);
      setParsedData(transformedData);
      setParsingResultId(result.parsing_result_id);
      setConfidence(result.confidence);
      setUploadProgress(75);

      // Auto-fill form fields from parsed data
      if (result.parsed_data.counterparty_name || result.parsed_data.parties?.[1]?.party_name) {
        setCounterpartyName(result.parsed_data.counterparty_name || result.parsed_data.parties[1].party_name);
      }

      setUploadProgress(100);
      setUploadStatus('completed');

      // Show auto-populator if confidence is reasonable
      if (result.confidence >= 0.4) {
        setShowAutoPopulator(true);
      }

      toast.success('Contract parsed successfully!');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to process contract');
      setUploadStatus('error');
      toast.error(`Failed to parse contract: ${err.message}`);
    }
  };

  const handleAutoPopulate = (formData: any) => {
    setAutoPopulatedData(formData);
    setContractTitle(formData.title);
    setCounterpartyName(formData.counterparty_name);
    setNotes(formData.notes);
    setShowAutoPopulator(false);
    toast.success('Contract details auto-populated! Please review and modify as needed.');
  };

  const handleCreateContract = async () => {
    try {
      await createContractFromParsedData();
      toast.success('Contract created successfully!');
      onSuccess();
    } catch (err: any) {
      console.error('Contract creation error:', err);
      toast.error('Failed to create contract');
      setError(err.message || 'Failed to create contract');
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('onDrop called with files:', acceptedFiles);
    const file = acceptedFiles[0];
    console.log('Selected file:', { 
      name: file?.name, 
      type: file?.type, 
      size: file?.size,
      isPDF: file?.type === 'application/pdf'
    });
    
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setUploadStatus('idle');
      setError(null);
      setShowAutoPopulator(false);
      setAutoPopulatedData(null);
      console.log('File set successfully:', file.name);
      toast.success(`File selected: ${file.name}`);
    } else {
      console.error('Invalid file type:', file?.type);
      toast.error('Please select a PDF file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    onDropRejected: (rejectedFiles) => {
      console.error('Files rejected:', rejectedFiles);
      toast.error('Please select a valid PDF file');
    },
    onError: (error) => {
      console.error('Dropzone error:', error);
      toast.error('Error with file selection');
    }
  });

  // Show review view if contract parsing is complete
  if (showReviewView && parsingResultId && uploadedFileUrl && selectedFile) {
    return (
      <ContractReviewView
        parsingResultId={parsingResultId}
        pdfUrl={uploadedFileUrl}
        fileName={selectedFile.name}
        onBack={() => setShowReviewView(false)}
        onApprove={(contractData) => {
          handleCreateContract();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="gap-2"
      >
        ← Back to options
      </Button>

      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Upload Contract PDF</h3>
          <p className="text-muted-foreground">
            Upload a contract PDF and we'll extract the key terms using AI
          </p>
        </div>

        {/* File Upload Area */}
        {!selectedFile && (
          <Card className="border-dashed border-2">
            <div 
              {...getRootProps()} 
              className={`p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'bg-accent' : 'hover:bg-accent/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-lg">Drop the PDF file here...</p>
              ) : (
                <div>
                  <p className="text-lg mb-2">Drag & drop a PDF file here, or click to select</p>
                  <p className="text-sm text-muted-foreground">Only PDF files are supported</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Selected File */}
        {selectedFile && uploadStatus === 'idle' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button onClick={handleFileUpload} className="w-full">
                Parse Contract with AI
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Processing Status */}
        {(uploadStatus === 'uploading' || uploadStatus === 'parsing') && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="h-6 w-6 animate-spin" />
                <div>
                  <p className="font-medium">
                    {uploadStatus === 'uploading' ? 'Uploading and extracting text...' : 'Analyzing contract with AI...'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This may take a few moments
                  </p>
                </div>
              </div>
              <Progress value={uploadProgress} className="mb-2" />
              <p className="text-sm text-center text-muted-foreground">
                {uploadProgress}% complete
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {uploadStatus === 'error' && error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Auto-Population Interface */}
        {uploadStatus === 'completed' && showAutoPopulator && parsedData && (
          <ContractAutoPopulator
            parsedData={parsedData}
            confidence={confidence}
            onAutoPopulate={handleAutoPopulate}
            onEditManually={() => setShowAutoPopulator(false)}
          />
        )}

        {/* Contract Details Form */}
        {uploadStatus === 'completed' && !showAutoPopulator && parsedData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Contract Analyzed Successfully
                </CardTitle>
                <CardDescription>
                  {autoPopulatedData ? 
                    'Form auto-populated with extracted data. Please review and modify as needed.' :
                    'Review the extracted information and complete the contract details'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">AI Analysis Confidence</span>
                  <Badge variant={confidence > 0.8 ? "default" : confidence > 0.6 ? "secondary" : "destructive"}>
                    {Math.round(confidence * 100)}%
                  </Badge>
                </div>

                {autoPopulatedData && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      Contract details have been auto-populated. You can modify any field before creating the contract.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Contract Type:</span>
                    <p className="text-muted-foreground capitalize">
                      {parsedData.contract_type?.replace('_', ' ') || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Territory:</span>
                    <p className="text-muted-foreground">
                      {parsedData.territory || 'Not specified'}
                    </p>
                  </div>
                </div>

                {parsedData.parties && parsedData.parties.length > 0 && (
                  <div>
                    <span className="font-medium text-sm">Parties:</span>
                    <div className="mt-1 space-y-1">
                      {parsedData.parties.map((party, index) => (
                        <p key={index} className="text-sm text-muted-foreground">
                          {party.name} ({party.role})
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contract Details Form */}
            <Card>
              <CardHeader>
                <CardTitle>Contract Details</CardTitle>
                <CardDescription>
                  Complete the contract information to create your digital agreement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Contract Title</Label>
                    <Input
                      id="title"
                      value={contractTitle}
                      onChange={(e) => setContractTitle(e.target.value)}
                      placeholder="Enter contract title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="counterparty">Counterparty Name</Label>
                    <Input
                      id="counterparty"
                      value={counterpartyName}
                      onChange={(e) => setCounterpartyName(e.target.value)}
                      placeholder="Enter counterparty name"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes about this contract"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleCreateContract} className="flex-1">
                    Create Contract
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedFile(null);
                      setUploadStatus('idle');
                      setParsedData(null);
                      setError(null);
                      setShowAutoPopulator(false);
                      setAutoPopulatedData(null);
                    }}
                  >
                    Upload Different File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
