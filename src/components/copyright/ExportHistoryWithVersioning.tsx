import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Download, 
  FileText, 
  Calendar, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Eye,
  Filter,
  Archive,
  GitBranch,
  Tag,
  FileDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExportRecord {
  id: string;
  export_format: string;
  copyright_count?: number;
  file_storage_path?: string;
  file_size_bytes?: number;
  export_version: number;
  batch_name?: string;
  export_notes?: string;
  export_tags?: string[];
  validation_score: number;
  readiness_issues?: any;
  delivery_job_id?: string;
  parent_export_id?: string;
  created_at: string;
  export_status: string;
}

interface DeliveryJob {
  id: string;
  delivery_status: string;
  attempt_count: number;
  max_attempts: number;
  last_attempt_at?: string;
  completed_at?: string;
  error_message?: string;
}

interface ExportHistoryWithVersioningProps {
  userId: string;
}

const ExportHistoryWithVersioning: React.FC<ExportHistoryWithVersioningProps> = ({ userId }) => {
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [deliveryJobs, setDeliveryJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExport, setSelectedExport] = useState<ExportRecord | null>(null);
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchExports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('copyright_exports')
        .select(`
          *,
          export_delivery_jobs(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching exports:', error);
        toast({
          title: "Error",
          description: "Failed to fetch export history",
          variant: "destructive"
        });
        return;
      }

      setExports((data || []).map((item: any) => ({ 
        ...item, 
        copyright_count: item.copyright_count || 0,
        readiness_issues: Array.isArray(item.readiness_issues) ? item.readiness_issues : 
          item.readiness_issues ? [item.readiness_issues] : []
      })));
    } catch (error) {
      console.error('Error fetching exports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('export_delivery_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching delivery jobs:', error);
        return;
      }

      setDeliveryJobs(data || []);
    } catch (error) {
      console.error('Error fetching delivery jobs:', error);
    }
  };

  useEffect(() => {
    fetchExports();
    fetchDeliveryJobs();
  }, [userId]);

  const filteredExports = exports.filter(export_ => {
    const matchesFormat = filterFormat === 'all' || export_.export_format.toLowerCase() === filterFormat.toLowerCase();
    const matchesStatus = filterStatus === 'all' || export_.export_status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      export_.batch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      export_.export_notes?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFormat && matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-amber-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDeliveryStatus = (exportId: string) => {
    const job = deliveryJobs.find(j => j.id === exportId);
    if (!job) return null;
    return job;
  };

  const downloadExport = async (export_: ExportRecord) => {
    if (!export_.file_storage_path) {
      toast({
        title: "Download Error",
        description: "Export file not available for download",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('cwr-exports')
        .download(export_.file_storage_path);

      if (error) {
        console.error('Download error:', error);
        toast({
          title: "Download Failed",
          description: "Failed to download export file",
          variant: "destructive"
        });
        return;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${export_.batch_name || 'export'}_v${export_.export_version}.${export_.export_format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Error",
        description: "An error occurred during download",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Export History & Versioning
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search exports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterFormat} onValueChange={setFilterFormat}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="cwr">CWR</SelectItem>
                <SelectItem value="ddex">DDEX</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Name</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Works</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No exports found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExports.map((export_) => {
                    const deliveryJob = getDeliveryStatus(export_.delivery_job_id || '');
                    return (
                      <TableRow key={export_.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {export_.parent_export_id && (
                              <GitBranch className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">
                              {export_.batch_name || 'Unnamed Export'}
                            </span>
                          </div>
                          {export_.export_tags && export_.export_tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {export_.export_tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {export_.export_tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{export_.export_tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={export_.export_format === "CWR" ? "default" : "secondary"}>
                            {export_.export_format}
                          </Badge>
                        </TableCell>
                        <TableCell>{export_.copyright_count || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(export_.export_status)}
                            <Badge 
                              variant={
                                export_.export_status === 'completed' ? 'default' :
                                export_.export_status === 'failed' ? 'destructive' : 'secondary'
                              }
                            >
                              {export_.export_status}
                            </Badge>
                          </div>
                          {deliveryJob && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Delivery: {deliveryJob.delivery_status}
                              {deliveryJob.attempt_count > 0 && ` (${deliveryJob.attempt_count}/${deliveryJob.max_attempts})`}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">v{export_.export_version}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={export_.validation_score} className="w-16" />
                            <span className="text-sm text-muted-foreground">
                              {export_.validation_score.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(export_.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(export_.created_at).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {export_.file_storage_path && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadExport(export_)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedExport(export_)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Export Details</DialogTitle>
                                </DialogHeader>
                                {selectedExport && (
                                  <ExportDetailsView 
                                    export_={selectedExport} 
                                    deliveryJob={getDeliveryStatus(selectedExport.delivery_job_id || '')} 
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Exports</p>
                <p className="text-2xl font-bold">{exports.length}</p>
              </div>
              <FileDown className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {exports.filter(e => e.export_status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-amber-600">
                  {exports.filter(e => e.export_status === 'processing').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {exports.filter(e => e.export_status === 'failed').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Jobs Timeline */}
      {deliveryJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Recent Delivery Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deliveryJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center gap-4 p-3 rounded-lg border">
                  <div className="flex-shrink-0">
                    {job.delivery_status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    ) : job.delivery_status === 'failed' ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      Export delivery {job.delivery_status}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {job.attempt_count > 0 && `Attempt ${job.attempt_count}/${job.max_attempts} • `}
                      {job.last_attempt_at && 
                        `Last attempt: ${new Date(job.last_attempt_at).toLocaleString()}`
                      }
                    </p>
                    {job.error_message && (
                      <p className="text-sm text-red-600 mt-1">{job.error_message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface ExportDetailsViewProps {
  export_: ExportRecord;
  deliveryJob: DeliveryJob | null;
}

const ExportDetailsView: React.FC<ExportDetailsViewProps> = ({ export_, deliveryJob }) => {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="validation">Validation</TabsTrigger>
        <TabsTrigger value="delivery">Delivery</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Export Information</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Batch Name:</strong> {export_.batch_name || 'Unnamed'}</div>
              <div><strong>Format:</strong> {export_.export_format}</div>
              <div><strong>Version:</strong> v{export_.export_version}</div>
              <div><strong>Works Count:</strong> {export_.copyright_count || 0}</div>
              <div><strong>File Size:</strong> {export_.file_size_bytes ? `${(export_.file_size_bytes / 1024).toFixed(1)} KB` : 'N/A'}</div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Status & Timing</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Status:</strong> 
                <Badge className="ml-2" variant={export_.export_status === 'completed' ? 'default' : 'secondary'}>
                  {export_.export_status}
                </Badge>
              </div>
              <div><strong>Created:</strong> {new Date(export_.created_at).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {export_.export_notes && (
          <div>
            <h4 className="font-medium mb-2">Notes</h4>
            <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
              {export_.export_notes}
            </p>
          </div>
        )}

        {export_.export_tags && export_.export_tags.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {export_.export_tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="validation" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-1">
                  {export_.validation_score.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Validation Score</p>
                <Progress value={export_.validation_score} className="mt-2" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600 mb-1">
                  {Array.isArray(export_.readiness_issues) ? export_.readiness_issues.length : 0}
                </div>
                <p className="text-sm text-muted-foreground">Issues Found</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {Array.isArray(export_.readiness_issues) && export_.readiness_issues.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Validation Issues</h4>
            <div className="space-y-2">
              {export_.readiness_issues.map((issue, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{issue.type || 'Validation Issue'}</p>
                    <p className="text-sm text-muted-foreground">{issue.message || 'No details available'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="delivery" className="space-y-4">
        {deliveryJob ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <Badge 
                      className="mb-2" 
                      variant={deliveryJob.delivery_status === 'completed' ? 'default' : 'secondary'}
                    >
                      {deliveryJob.delivery_status}
                    </Badge>
                    <p className="text-sm text-muted-foreground">Delivery Status</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-1">
                      {deliveryJob.attempt_count}/{deliveryJob.max_attempts}
                    </div>
                    <p className="text-sm text-muted-foreground">Delivery Attempts</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              {deliveryJob.last_attempt_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Attempt:</span>
                  <span>{new Date(deliveryJob.last_attempt_at).toLocaleString()}</span>
                </div>
              )}
              {deliveryJob.completed_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed:</span>
                  <span>{new Date(deliveryJob.completed_at).toLocaleString()}</span>
                </div>
              )}
            </div>

            {deliveryJob.error_message && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">Delivery Error</p>
                <p className="text-sm text-red-600 mt-1">{deliveryJob.error_message}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No delivery information available</p>
            <p className="text-sm">This export was not configured for automatic delivery</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default ExportHistoryWithVersioning;