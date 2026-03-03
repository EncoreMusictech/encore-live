import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, FileSpreadsheet, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BulkUploadJob {
  id: string;
  file_name: string;
  total_works: number;
  successful_works: number;
  failed_works: number;
  status: string;
  created_at: string;
}

interface BulkUploadHistoryProps {
  companyId: string;
}

export function BulkUploadHistory({ companyId }: BulkUploadHistoryProps) {
  const [jobs, setJobs] = useState<BulkUploadJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
  }, [companyId]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      // @ts-ignore
      const { data, error } = await supabase
        .from('bulk_upload_jobs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs((data as BulkUploadJob[]) || []);
    } catch (error) {
      console.error('Error fetching upload jobs:', error);
      toast({ title: 'Error', description: 'Failed to load upload history', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (job: BulkUploadJob) => {
    try {
      setDeleting(job.id);

      // 1. Get all copyright IDs linked to this job
      // @ts-ignore
      const { data: copyrights } = await supabase
        .from('copyrights')
        .select('id')
        .eq('bulk_upload_job_id', job.id);

      const copyrightIds = copyrights?.map((c: any) => c.id) || [];

      if (copyrightIds.length > 0) {
        // 2. Delete contract_schedule_works referencing these copyrights
        await supabase
          .from('contract_schedule_works')
          .delete()
          .in('copyright_id', copyrightIds);

        // 3. Delete copyright_writers, copyright_publishers, copyright_recordings
        await supabase.from('copyright_writers').delete().in('copyright_id', copyrightIds);
        await supabase.from('copyright_publishers').delete().in('copyright_id', copyrightIds);
        await supabase.from('copyright_recordings').delete().in('copyright_id', copyrightIds);

        // 4. Delete copyrights
        // @ts-ignore
        await supabase
          .from('copyrights')
          .delete()
          .eq('bulk_upload_job_id', job.id);
      }

      // 5. Delete catalog_items
      // @ts-ignore
      await supabase
        .from('catalog_items')
        .delete()
        .eq('bulk_upload_job_id', job.id);

      // 6. Delete the job record
      // @ts-ignore
      await supabase
        .from('bulk_upload_jobs')
        .delete()
        .eq('id', job.id);

      setJobs(prev => prev.filter(j => j.id !== job.id));
      toast({
        title: 'Job Deleted',
        description: `Removed "${job.file_name}" and all ${job.successful_works} associated works.`,
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({ title: 'Error', description: 'Failed to delete upload job', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Upload History</CardTitle>
          <CardDescription>
            Past bulk upload jobs for this sub-account ({jobs.length} total)
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchJobs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading upload history...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No bulk uploads yet</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Success</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{job.file_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(job.created_at).toLocaleDateString()} {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>{statusBadge(job.status)}</TableCell>
                    <TableCell className="text-right text-primary font-medium">{job.successful_works}</TableCell>
                    <TableCell className="text-right text-destructive font-medium">{job.failed_works}</TableCell>
                    <TableCell className="text-right">{job.total_works}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deleting === job.id}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this upload job?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete all {job.successful_works} works imported from "{job.file_name}", including their copyrights, writers, publishers, recordings, and any associated contract schedules.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteJob(job)}>
                              Delete All Works
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
