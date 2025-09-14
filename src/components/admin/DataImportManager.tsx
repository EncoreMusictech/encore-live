import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Download, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';

interface UploadJob {
  id: string;
  job_name: string;
  file_name: string;
  file_type: string;
  status: string;
  total_records: number;
  processed_records: number;
  successful_records: number;
  failed_records: number;
  created_at: string;
}

export const DataImportManager = () => {
  const [uploadJobs, setUploadJobs] = useState<UploadJob[]>([]);
  const [uploading, setUploading] = useState(false);
  const [jobName, setJobName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && (file.type === 'text/csv' || file.type === 'application/pdf')) {
      setSelectedFile(file);
      if (!jobName) {
        setJobName(`Import ${file.name} - ${new Date().toLocaleDateString()}`);
      }
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV or PDF file",
        variant: "destructive",
      });
    }
  }, [jobName, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  const uploadFile = async () => {
    if (!selectedFile || !jobName) {
      toast({
        title: "Missing information",
        description: "Please provide a job name and select a file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      // Upload file to Supabase storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('import-files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Create upload job record
      const { data, error } = await supabase
        .from('sub_accounts_upload_jobs')
        .insert({
          job_name: jobName,
          file_name: selectedFile.name,
          file_type: fileExt?.toLowerCase() || 'unknown',
          file_size: selectedFile.size,
          file_path: filePath,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Call edge function to process the file
      const { error: processError } = await supabase.functions.invoke('process-data-import', {
        body: { uploadJobId: data.id }
      });

      if (processError) {
        console.error('Processing error:', processError);
      }

      toast({
        title: "Upload successful",
        description: "File uploaded and processing started",
      });

      // Reset form
      setSelectedFile(null);
      setJobName('');
      
      // Refresh jobs list
      fetchUploadJobs();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const fetchUploadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('sub_accounts_upload_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUploadJobs(data || []);
    } catch (error) {
      console.error('Error fetching upload jobs:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'failed': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Data</TabsTrigger>
          <TabsTrigger value="jobs">Import Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Form */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Client Data</CardTitle>
                <CardDescription>
                  Upload CSV or PDF files containing client information for bulk import
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="job-name">Job Name</Label>
                  <Input
                    id="job-name"
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    placeholder="Enter a name for this import job"
                  />
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                    ${selectedFile ? 'border-green-500 bg-green-50' : ''}
                  `}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium">
                        {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Supports CSV and PDF files (max 50MB)
                      </p>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={uploadFile}
                  disabled={!selectedFile || !jobName || uploading}
                  className="w-full"
                >
                  {uploading ? 'Uploading...' : 'Start Import'}
                </Button>
              </CardContent>
            </Card>

            {/* File Format Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Supported File Formats</CardTitle>
                <CardDescription>
                  Guidelines for preparing your import files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    CSV Format
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Headers: company_name, contact_email, contact_name, phone, subscription_tier, modules_access, billing_address, payment_method
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF Format
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Structured text with labels like "Company:", "Email:", "Contact:", etc.
                  </p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Required fields:</strong> company_name, contact_email, contact_name
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Import Jobs</CardTitle>
                <CardDescription>
                  Monitor the status of your data import jobs
                </CardDescription>
              </div>
              <Button onClick={fetchUploadJobs} variant="outline" size="sm">
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {uploadJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No import jobs found. Start by uploading a file.
                </div>
              ) : (
                <div className="space-y-4">
                  {uploadJobs.map((job) => (
                    <Card key={job.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <h4 className="font-medium">{job.job_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {job.file_name} • {job.file_type.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </div>

                      {job.total_records > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{job.processed_records}/{job.total_records} records</span>
                          </div>
                          <Progress 
                            value={(job.processed_records / job.total_records) * 100}
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>✓ {job.successful_records} successful</span>
                            <span>✗ {job.failed_records} failed</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-xs text-muted-foreground">
                          Created: {new Date(job.created_at).toLocaleString()}
                        </span>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                          {job.status === 'completed' && (
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3 mr-1" />
                              Report
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};