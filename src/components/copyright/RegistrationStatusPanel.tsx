import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  FileText,
  Send,
  Eye,
  RotateCcw
} from 'lucide-react';
import { usePRORegistrations, PRORegistrationSubmission, PRORegistrationWork } from '@/hooks/usePRORegistrations';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const RegistrationStatusPanel: React.FC = () => {
  const {
    submissions,
    loading,
    fetchSubmissions,
    fetchSubmissionWorks,
    cancelSubmission,
    getPendingSubmissions,
    getSubmissionsNeedingAttention
  } = usePRORegistrations();

  const [selectedSubmission, setSelectedSubmission] = useState<PRORegistrationSubmission | null>(null);
  const [submissionWorks, setSubmissionWorks] = useState<PRORegistrationWork[]>([]);
  const [loadingWorks, setLoadingWorks] = useState(false);

  const pendingSubmissions = getPendingSubmissions();
  const attentionNeeded = getSubmissionsNeedingAttention();

  const handleViewDetails = async (submission: PRORegistrationSubmission) => {
    setSelectedSubmission(submission);
    setLoadingWorks(true);
    try {
      const works = await fetchSubmissionWorks(submission.id);
      setSubmissionWorks(works);
    } finally {
      setLoadingWorks(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700"><Clock className="h-3 w-3 mr-1" />Submitted</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case 'acknowledged':
        return <Badge variant="secondary" className="bg-green-50 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Acknowledged</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-orange-50 text-orange-700"><AlertTriangle className="h-3 w-3 mr-1" />Partial</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'cancelled':
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getWorkStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'accepted':
        return <Badge variant="secondary" className="bg-green-50 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'conflict':
        return <Badge variant="secondary" className="bg-orange-50 text-orange-700"><AlertTriangle className="h-3 w-3 mr-1" />Conflict</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{submissions.length}</div>
            <p className="text-sm text-muted-foreground">Total Submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{pendingSubmissions.length}</div>
            <p className="text-sm text-muted-foreground">Awaiting Response</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {submissions.filter(s => s.status === 'acknowledged').length}
            </div>
            <p className="text-sm text-muted-foreground">Fully Registered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{attentionNeeded.length}</div>
            <p className="text-sm text-muted-foreground">Need Attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Attention Alert */}
      {attentionNeeded.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {attentionNeeded.length} submission(s) have issues that need your attention. 
            Review rejected works and resubmit after corrections.
          </AlertDescription>
        </Alert>
      )}

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>PRO Registration Submissions</CardTitle>
              <CardDescription>Track your work registrations across PROs</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchSubmissions()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Submissions Yet</h3>
              <p className="text-muted-foreground">
                Use the "Register to PRO" feature to submit works for registration.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submission</TableHead>
                  <TableHead>PRO</TableHead>
                  <TableHead>Works</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Expected ACK</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div className="font-mono text-sm">{submission.cwr_file_name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{submission.pro_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span>{submission.works_submitted} submitted</span>
                        </div>
                        {submission.ack_received && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="text-green-600">{submission.works_accepted} ✓</span>
                            {submission.works_rejected > 0 && (
                              <span className="text-red-600">{submission.works_rejected} ✗</span>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell>{formatDate(submission.submission_date)}</TableCell>
                    <TableCell>{formatDate(submission.expected_ack_date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(submission)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {(submission.status === 'submitted' || submission.status === 'processing') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelSubmission(submission.id)}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        )}
                        {(submission.status === 'failed' || submission.status === 'partial') && (
                          <Button variant="outline" size="sm">
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">File Name</p>
                  <p className="font-mono text-sm">{selectedSubmission.cwr_file_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedSubmission.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p>{formatDate(selectedSubmission.submission_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">PRO</p>
                  <Badge variant="outline">{selectedSubmission.pro_name}</Badge>
                </div>
              </div>

              {selectedSubmission.ack_received && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-sm">Acknowledgment Received</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{selectedSubmission.works_accepted}</div>
                        <p className="text-sm text-muted-foreground">Accepted</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{selectedSubmission.works_rejected}</div>
                        <p className="text-sm text-muted-foreground">Rejected</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-600">{selectedSubmission.works_pending}</div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Submitted Works</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingWorks ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : submissionWorks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No works found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Work Title</TableHead>
                          <TableHead>Work ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>PRO Work ID</TableHead>
                          <TableHead>Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissionWorks.map((work) => (
                          <TableRow key={work.id}>
                            <TableCell className="font-medium">{work.work_title}</TableCell>
                            <TableCell className="font-mono text-sm">{work.work_id || '-'}</TableCell>
                            <TableCell>{getWorkStatusBadge(work.registration_status)}</TableCell>
                            <TableCell className="font-mono text-sm">{work.pro_work_id || '-'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {work.ack_message || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegistrationStatusPanel;
