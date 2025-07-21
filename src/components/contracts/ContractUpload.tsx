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
import * as pdfjsLib from "pdfjs-dist";

// Set up PDF.js worker with error handling
if (typeof window !== 'undefined') {
  try {
    // Try to use a bundled worker first, fallback to CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.js',
      import.meta.url
    ).toString();
  } catch (error) {
    console.warn('Failed to set up bundled PDF worker, using CDN fallback');
    // Fallback to CDN with error handling
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
  }
}

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
  
  const { user } = useAuth();

  // Debug logging for initial component state
  console.log('ContractUpload component loaded', { 
    user: !!user, 
    userId: user?.id,
    uploadStatus,
    selectedFile: !!selectedFile 
  });

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (error: any) {
      console.error('PDF text extraction failed:', error);
      
      // If PDF.js fails, provide a helpful error message
      if (error.message?.includes('worker') || error.message?.includes('Worker')) {
        throw new Error('PDF processing failed due to worker setup. Please try refreshing the page and uploading again.');
      }
      
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  };

  const parseContract = async (text: string) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.functions.invoke('parse-contract', {
      body: {
        fileContent: text,
        fileName: selectedFile?.name || 'unknown.pdf',
        userId: user.id
      }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Failed to parse contract');

    return data;
  };

  const createContractFromParsedData = async () => {
    if (!user || !parsedData) return;

    // Map parsed data to contract format
    const contractData = {
      title: contractTitle || `${parsedData.contract_type} Agreement`,
      counterparty_name: counterpartyName || parsedData.parties?.[1]?.name || 'Unknown Party',
      contract_type: (parsedData.contract_type || 'publishing') as any,
      start_date: parsedData.key_dates?.start_date || null,
      end_date: parsedData.key_dates?.end_date || null,
      notes: notes,
      financial_terms: parsedData.financial_terms || {},
      royalty_splits: parsedData.financial_terms?.royalty_rates || {},
      advance_amount: parsedData.financial_terms?.advance_amount || 0,
      commission_percentage: parsedData.financial_terms?.commission_percentage || 0,
      territories: parsedData.territory ? [parsedData.territory] : [],
      contract_data: parsedData as any,
      user_id: user.id
    };

    const { data: contract, error } = await supabase
      .from('contracts')
      .insert(contractData)
      .select()
      .single();

    if (error) throw error;

    // Link the parsing result to the contract
    if (parsingResultId) {
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

      // Extract text from PDF
      console.log('Extracting text from PDF...');
      const text = await extractTextFromPDF(selectedFile);
      console.log('Text extracted, length:', text.length);
      setExtractedText(text);
      setUploadProgress(50);

      // Parse contract with AI
      setUploadStatus('parsing');
      setUploadProgress(75);
      console.log('Parsing contract with AI...');

      const result = await parseContract(text);
      console.log('Contract parsed successfully:', result);
      setParsedData(result.parsed_data);
      setParsingResultId(result.parsing_result_id);
      setConfidence(result.confidence);

      // Auto-fill form fields from parsed data
      if (result.parsed_data.parties?.[1]?.name) {
        setCounterpartyName(result.parsed_data.parties[1].name);
      }

      setUploadProgress(100);
      setUploadStatus('completed');

      toast.success('Contract parsed successfully!');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to process contract');
      setUploadStatus('error');
      toast.error(`Failed to parse contract: ${err.message}`);
    }
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
                Parse Contract
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
                    {uploadStatus === 'uploading' ? 'Extracting text...' : 'Parsing contract with AI...'}
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

        {/* Parsing Results */}
        {uploadStatus === 'completed' && parsedData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Contract Parsed Successfully
                </CardTitle>
                <CardDescription>
                  Review the extracted information and create your contract
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Parsing Confidence</span>
                  <Badge variant={confidence > 0.8 ? "default" : confidence > 0.6 ? "secondary" : "destructive"}>
                    {Math.round(confidence * 100)}%
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Contract Type:</span>
                    <p className="text-muted-foreground capitalize">
                      {parsedData.contract_type || 'Unknown'}
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
                    rows={3}
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