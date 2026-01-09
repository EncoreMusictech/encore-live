import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PRORegistrationSubmission {
  id: string;
  user_id: string;
  pro_name: string;
  export_id: string | null;
  cwr_file_name: string;
  submission_date: string;
  expected_ack_date: string | null;
  ack_received: boolean;
  ack_file_name: string | null;
  ack_received_at: string | null;
  works_submitted: number;
  works_accepted: number;
  works_rejected: number;
  works_pending: number;
  status: string;
  error_message: string | null;
  submission_metadata: Record<string, unknown> | null;
  ack_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PRORegistrationWork {
  id: string;
  submission_id: string;
  copyright_id: string;
  work_title: string;
  work_id: string | null;
  registration_status: string;
  ack_message: string | null;
  pro_work_id: string | null;
  created_at: string;
  updated_at: string;
}

export const usePRORegistrations = () => {
  const [submissions, setSubmissions] = useState<PRORegistrationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('pro_registration_submissions')
        .select('*')
        .order('submission_date', { ascending: false });

      if (fetchError) throw fetchError;
      setSubmissions((data || []) as PRORegistrationSubmission[]);
    } catch (err) {
      console.error('Error fetching PRO submissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubmissionWorks = useCallback(async (submissionId: string): Promise<PRORegistrationWork[]> => {
    try {
      const { data, error } = await supabase
        .from('pro_registration_works')
        .select('*')
        .eq('submission_id', submissionId)
        .order('work_title', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching submission works:', err);
      return [];
    }
  }, []);

  const createSubmission = useCallback(async (
    proName: string,
    cwrFileName: string,
    exportId: string | null,
    works: Array<{ copyrightId: string; workTitle: string; workId?: string }>
  ): Promise<PRORegistrationSubmission | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate expected ACK date (typically 5-10 business days for ASCAP)
      const expectedAckDate = new Date();
      expectedAckDate.setDate(expectedAckDate.getDate() + 7);

      const { data: submission, error: submissionError } = await supabase
        .from('pro_registration_submissions')
        .insert({
          user_id: user.id,
          pro_name: proName,
          export_id: exportId,
          cwr_file_name: cwrFileName,
          expected_ack_date: expectedAckDate.toISOString(),
          works_submitted: works.length,
          works_pending: works.length,
          status: 'submitted',
          submission_metadata: {
            submitted_by: user.email,
            submission_method: 'automated'
          }
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Insert the individual works
      if (submission && works.length > 0) {
        const workRecords = works.map(work => ({
          submission_id: submission.id,
          copyright_id: work.copyrightId,
          work_title: work.workTitle,
          work_id: work.workId || null,
          registration_status: 'pending'
        }));

        const { error: worksError } = await supabase
          .from('pro_registration_works')
          .insert(workRecords);

        if (worksError) {
          console.error('Error inserting registration works:', worksError);
        }
      }

      toast({
        title: 'Registration Submitted',
        description: `${works.length} works submitted to ${proName}`
      });

      await fetchSubmissions();
      return submission as PRORegistrationSubmission;
    } catch (err) {
      console.error('Error creating submission:', err);
      toast({
        title: 'Submission Failed',
        description: err instanceof Error ? err.message : 'Failed to create submission',
        variant: 'destructive'
      });
      return null;
    }
  }, [fetchSubmissions, toast]);

  const updateSubmissionStatus = useCallback(async (
    submissionId: string,
    status: string,
    metadata?: Partial<PRORegistrationSubmission>
  ) => {
      await supabase
        .from('pro_registration_submissions')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;
      await fetchSubmissions();
      return true;
    } catch (err) {
      console.error('Error updating submission:', err);
      return false;
    }
  }, [fetchSubmissions]);

  const processAcknowledgment = useCallback(async (
    submissionId: string,
    ackFileName: string,
    ackData: {
      worksAccepted: number;
      worksRejected: number;
      workDetails: Array<{
        copyrightId: string;
        status: 'accepted' | 'rejected';
        message?: string;
        proWorkId?: string;
      }>
    }
  ) => {
    try {
      // Update submission record
      const worksTotal = ackData.worksAccepted + ackData.worksRejected;
      const status = ackData.worksRejected === 0 ? 'acknowledged' : 
                     ackData.worksAccepted === 0 ? 'failed' : 'partial';

      await supabase
        .from('pro_registration_submissions')
        .update({
          ack_received: true,
          ack_file_name: ackFileName,
          ack_received_at: new Date().toISOString(),
          works_accepted: ackData.worksAccepted,
          works_rejected: ackData.worksRejected,
          works_pending: 0,
          status,
          ack_metadata: { 
            processed_at: new Date().toISOString(),
            total_works: worksTotal 
          }
        })
        .eq('id', submissionId);

      // Update individual work statuses
      for (const work of ackData.workDetails) {
        await supabase
          .from('pro_registration_works')
          .update({
            registration_status: work.status,
            ack_message: work.message || null,
            pro_work_id: work.proWorkId || null,
            updated_at: new Date().toISOString()
          })
          .eq('submission_id', submissionId)
          .eq('copyright_id', work.copyrightId);

        // Also update the copyright's PRO status
        const proStatusField = `${ackData.workDetails[0]?.proWorkId ? 'ascap' : 'ascap'}_status`;
        // This would need to be dynamically determined based on the PRO
      }

      toast({
        title: 'Acknowledgment Processed',
        description: `${ackData.worksAccepted} accepted, ${ackData.worksRejected} rejected`
      });

      await fetchSubmissions();
      return true;
    } catch (err) {
      console.error('Error processing acknowledgment:', err);
      toast({
        title: 'Processing Failed',
        description: 'Failed to process acknowledgment file',
        variant: 'destructive'
      });
      return false;
    }
  }, [fetchSubmissions, toast]);

  const cancelSubmission = useCallback(async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from('pro_registration_submissions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: 'Submission Cancelled',
        description: 'The registration submission has been cancelled'
      });

      await fetchSubmissions();
      return true;
    } catch (err) {
      console.error('Error cancelling submission:', err);
      return false;
    }
  }, [fetchSubmissions, toast]);

  const getSubmissionsByPRO = useCallback((proName: string) => {
    return submissions.filter(s => s.pro_name === proName);
  }, [submissions]);

  const getPendingSubmissions = useCallback(() => {
    return submissions.filter(s => s.status === 'submitted' || s.status === 'processing');
  }, [submissions]);

  const getSubmissionsNeedingAttention = useCallback(() => {
    return submissions.filter(s => s.status === 'failed' || s.status === 'partial');
  }, [submissions]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return {
    submissions,
    loading,
    error,
    fetchSubmissions,
    fetchSubmissionWorks,
    createSubmission,
    updateSubmissionStatus,
    processAcknowledgment,
    cancelSubmission,
    getSubmissionsByPRO,
    getPendingSubmissions,
    getSubmissionsNeedingAttention
  };
};
