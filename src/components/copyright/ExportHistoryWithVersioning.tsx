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
  copyright_count: number;
  file_storage_path?: string;
  file_size_bytes?: number;
  export_version: number;
  batch_name?: string;
  export_notes?: string;
  export_tags?: string[];
  validation_score: number;
  readiness_issues?: any[];
  delivery_job_id?: string;
  parent_export_id?: string;
  created_at: string;
  export_status: string;
}

interface DeliveryJob {
  id: string;
  delivery_status: string;
  attempt_count: number;
  completed_at?: string;
  error_message?: string;
  pro_ftp_credentials?: {
    pro_name: string;
    host: string;
  };
}

const ExportHistoryWithVersioning: React.FC = () => {
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [deliveryJobs, setDeliveryJobs] = useState<{ [key: string]: DeliveryJob }>({});
  const [loading, setLoading] = useState(true);
  const [selectedExport, setSelectedExport] = useState<ExportRecord | null>(null);
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchExports();
  }, []);

  const fetchExports = async () => {
    setLoading(true);
    try {
      const { data: exportsData, error: exportsError } = await supabase
        .from('copyright_exports')
        .select('*')
        .order('created_at', { ascending: false });

      if (exportsError) {
        console.error('Error fetching exports:', exportsError);
        toast({
          title: "Error",
          description: "Failed to load export history",
          variant: "destructive"
        });
        return;
      }

      setExports(exportsData || []);

      // Fetch delivery job details for exports that have them
      const exportIdsWithDelivery = exportsData?.filter(e => e.delivery_job_id).map(e => e.delivery_job_id) || [];
      
      if (exportIdsWithDelivery.length > 0) {
        const { data: deliveryData, error: deliveryError } = await supabase
          .from('export_delivery_jobs')
          .select(`
            id,
            delivery_status,
            attempt_count,
            completed_at,
            error_message,
            pro_ftp_credentials (pro_name, host)
          `)
          .in('id', exportIdsWithDelivery);

        if (!deliveryError && deliveryData) {
          const deliveryMap = deliveryData.reduce((acc, job) => {
            acc[job.id] = job;
            return acc;
          }, {} as { [key: string]: DeliveryJob });
          setDeliveryJobs(deliveryMap);
        }
      }
    } catch (error) {
      console.error('Error fetching export history:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadExport = async (exportRecord: ExportRecord) => {
    if (!exportRecord.file_storage_path) {
      toast({
        title: "Download Error",
        description: "Export file is not available for download",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('cwr-exports')
        .download(exportRecord.file_storage_path);

      if (error) {
        console.error('Download error:', error);
        toast({
          title: "Download Failed",
          description: "Failed to download export file",
          variant: "destructive"
        });
        return;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportRecord.batch_name || 'export'}_v${exportRecord.export_version}.${exportRecord.format.toLowerCase()}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "Export file download has started",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Error",
        description: "An unexpected error occurred during download",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string, deliveryJob?: DeliveryJob) => {
    if (deliveryJob) {
      switch (deliveryJob.delivery_status) {
        case 'completed':
          return <Badge variant="secondary" className="text-emerald-700 bg-emerald-50"><CheckCircle className="h-3 w-3 mr-1" />Delivered</Badge>;
        case 'failed':
          return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Delivery Failed</Badge>;
        case 'pending':
        case 'in_progress':
        case 'retrying':
          return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Delivering</Badge>;
      }
    }

    switch (status) {
      case 'completed':
        return <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Processing</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const filteredExports = exports.filter(exp => {
    const matchesFormat = filterFormat === 'all' || exp.format.toLowerCase() === filterFormat;
    const matchesStatus = filterStatus === 'all' || exp.status === filterStatus;
    const matchesSearch = !searchTerm || 
      exp.batch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.export_notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.export_tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFormat && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Export History</h2>
          <p className="text-muted-foreground">View and manage your CWR/DDEX export history with versioning</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Input
              placeholder="Search batch name, notes, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select value={filterFormat} onValueChange={setFilterFormat}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="cwr">CWR</SelectItem>
                <SelectItem value="ddex">DDEX</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Export History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Export Records ({filteredExports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading export history...</p>
            </div>
          ) : filteredExports.length === 0 ? (
            <div className="text-center py-8">
              <FileDown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Export Records Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterFormat !== 'all' || filterStatus !== 'all' 
                  ? 'No exports match your current filters.' 
                  : 'No exports have been created yet.'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Works</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExports.map((exportRecord) => {
                  const deliveryJob = exportRecord.delivery_job_id ? deliveryJobs[exportRecord.delivery_job_id] : undefined;
                  
                  return (
                    <TableRow key={exportRecord.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{exportRecord.batch_name || 'Unnamed Export'}</div>
                          <div className="text-sm text-muted-foreground">
                            {exportRecord.file_size_bytes && formatFileSize(exportRecord.file_size_bytes)}
                          </div>
                          {exportRecord.export_tags && exportRecord.export_tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {exportRecord.export_tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  <Tag className="h-2 w-2 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {exportRecord.export_tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{exportRecord.export_tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{exportRecord.format.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{exportRecord.copyright_count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3" />
                          v{exportRecord.export_version}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${getScoreColor(exportRecord.validation_score)}`}>
                          {exportRecord.validation_score.toFixed(1)}%
                        </div>
                        <Progress 
                          value={exportRecord.validation_score} 
                          className="w-16 h-1 mt-1" 
                        />
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(exportRecord.status, deliveryJob)}
                        {deliveryJob && deliveryJob.delivery_status === 'completed' && (
                          <div className="text-xs text-muted-foreground mt-1">
                            to {deliveryJob.pro_ftp_credentials?.pro_name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(exportRecord.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(exportRecord.created_at).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedExport(exportRecord)}>
                                <Eye className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Export Details - {exportRecord.batch_name}</DialogTitle>
                              </DialogHeader>
                              {selectedExport && (
                                <Tabs defaultValue="overview">
                                  <TabsList>
                                    <TabsTrigger value="overview">Overview</TabsTrigger>
                                    <TabsTrigger value="delivery">Delivery</TabsTrigger>
                                    <TabsTrigger value="validation">Validation</TabsTrigger>
                                  </TabsList>
                                  <TabsContent value="overview" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium">Batch Name</Label>
                                        <p>{selectedExport.batch_name || 'Unnamed'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Format</Label>
                                        <p>{selectedExport.format.toUpperCase()}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Works Count</Label>
                                        <p>{selectedExport.copyright_count}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">File Size</Label>
                                        <p>{formatFileSize(selectedExport.file_size_bytes)}</p>
                                      </div>
                                    </div>
                                    {selectedExport.export_notes && (
                                      <div>
                                        <Label className="text-sm font-medium">Notes</Label>
                                        <p className="text-sm text-muted-foreground mt-1">{selectedExport.export_notes}</p>
                                      </div>
                                    )}
                                  </TabsContent>
                                  <TabsContent value="delivery">
                                    {deliveryJob ? (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label className="text-sm font-medium">Status</Label>
                                            <p>{deliveryJob.delivery_status}</p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-medium">Attempts</Label>
                                            <p>{deliveryJob.attempt_count}</p>
                                          </div>
                                        </div>
                                        {deliveryJob.error_message && (
                                          <div>
                                            <Label className="text-sm font-medium">Error</Label>
                                            <p className="text-sm text-red-600">{deliveryJob.error_message}</p>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-muted-foreground">No delivery configured for this export.</p>
                                    )}
                                  </TabsContent>
                                  <TabsContent value="validation">
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="text-sm font-medium">Validation Score</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Progress value={selectedExport.validation_score} className="flex-1" />
                                          <span className={`font-medium ${getScoreColor(selectedExport.validation_score)}`}>
                                            {selectedExport.validation_score.toFixed(1)}%
                                          </span>
                                        </div>
                                      </div>
                                      {selectedExport.readiness_issues && selectedExport.readiness_issues.length > 0 && (
                                        <div>
                                          <Label className="text-sm font-medium">Issues</Label>
                                          <div className="mt-1 space-y-1">
                                            {selectedExport.readiness_issues.map((issue, index) => (
                                              <div key={index} className="text-sm text-muted-foreground">
                                                • {issue.message}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </TabsContent>
                                </Tabs>
                              )}
                            </DialogContent>
                          </Dialog>
                          {exportRecord.file_storage_path && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => downloadExport(exportRecord)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Label: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={`text-sm font-medium ${className || ''}`}>{children}</div>
);

export default ExportHistoryWithVersioning;