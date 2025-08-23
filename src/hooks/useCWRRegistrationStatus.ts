import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CWRSubmission {
  id: string;
  user_id: string;
  copyright_id?: string;
  sender_code: string;
  pro_name: string;
  submission_date: string;
  cwr_file_name?: string;
  cwr_file_url?: string;
  work_title: string;
  iswc?: string;
  submission_status: string;
  submitted_by: string;
  created_at: string;
  updated_at: string;
}

export interface CWRAcknowledgment {
  id: string;
  user_id: string;
  submission_id: string;
  ack_file_name?: string;
  ack_file_url?: string;
  response_code?: string;
  response_message?: string;
  registration_status: string;
  parsed_data: any;
  linked_records: any;
  received_at: string;
  created_at: string;
  updated_at: string;
}

export interface RegistrationStatusRecord {
  id: string;
  work_title: string;
  iswc?: string;
  submitted_by: string;
  submission_date: string;
  pro_name: string;
  registration_status: string;
  last_response?: string;
  sender_code: string;
  ack_data?: CWRAcknowledgment;
  submission_data: CWRSubmission;
}

export const useCWRRegistrationStatus = () => {
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<RegistrationStatusRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration since we just created the schema
  const mockRegistrations: RegistrationStatusRecord[] = [
    {
      id: '1',
      work_title: 'Midnight Blue',
      iswc: 'T1234567890',
      submitted_by: 'Encore Music LLC',
      submission_date: '2025-07-29',
      pro_name: 'ASCAP',
      registration_status: 'pending',
      last_response: 'No errors',
      sender_code: 'ENCORMUS',
      submission_data: {
        id: '1',
        user_id: 'current-user',
        sender_code: 'ENCORMUS',
        pro_name: 'ASCAP',
        submission_date: '2025-07-29',
        work_title: 'Midnight Blue',
        iswc: 'T1234567890',
        submission_status: 'submitted',
        submitted_by: 'Encore Music LLC',
        created_at: '2025-07-29T10:00:00Z',
        updated_at: '2025-07-29T10:00:00Z'
      }
    },
    {
      id: '2',
      work_title: 'Red Moon',
      iswc: 'T9876543210',
      submitted_by: 'OuterTune Admin',
      submission_date: '2025-07-26',
      pro_name: 'BMI',
      registration_status: 'needs_amending',
      last_response: 'Role mismatch (SWR)',
      sender_code: 'OUTERTUNE',
      submission_data: {
        id: '2',
        user_id: 'current-user',
        sender_code: 'OUTERTUNE',
        pro_name: 'BMI',
        submission_date: '2025-07-26',
        work_title: 'Red Moon',
        iswc: 'T9876543210',
        submission_status: 'needs_amendment',
        submitted_by: 'OuterTune Admin',
        created_at: '2025-07-26T14:30:00Z',
        updated_at: '2025-07-26T14:30:00Z'
      },
      ack_data: {
        id: 'ack-2',
        user_id: 'current-user',
        submission_id: '2',
        response_code: 'RJ',
        response_message: 'Role mismatch in SWR record',
        registration_status: 'needs_amending',
        parsed_data: {
          errors: ['SWR role mismatch'],
          warnings: []
        },
        linked_records: {
          swr: ['SWR123456'],
          pwr: [],
          nwr: []
        },
        received_at: '2025-07-27T09:15:00Z',
        created_at: '2025-07-27T09:15:00Z',
        updated_at: '2025-07-27T09:15:00Z'
      }
    },
    {
      id: '3',
      work_title: 'Golden Hour',
      iswc: 'T5555666777',
      submitted_by: 'Encore Music LLC',
      submission_date: '2025-07-20',
      pro_name: 'SOCAN',
      registration_status: 'registered',
      last_response: 'Registration complete',
      sender_code: 'ENCORMUS',
      submission_data: {
        id: '3',
        user_id: 'current-user',
        sender_code: 'ENCORMUS',
        pro_name: 'SOCAN',
        submission_date: '2025-07-20',
        work_title: 'Golden Hour',
        iswc: 'T5555666777',
        submission_status: 'registered',
        submitted_by: 'Encore Music LLC',
        created_at: '2025-07-20T11:00:00Z',
        updated_at: '2025-07-22T15:30:00Z'
      },
      ack_data: {
        id: 'ack-3',
        user_id: 'current-user',
        submission_id: '3',
        response_code: 'RA',
        response_message: 'Registration accepted and processed',
        registration_status: 'registered',
        parsed_data: {
          errors: [],
          warnings: []
        },
        linked_records: {
          swr: ['SWR789012'],
          pwr: ['PWR345678'],
          nwr: ['NWR901234']
        },
        received_at: '2025-07-22T15:30:00Z',
        created_at: '2025-07-22T15:30:00Z',
        updated_at: '2025-07-22T15:30:00Z'
      }
    },
    {
      id: '4',
      work_title: 'Electric Dreams',
      iswc: 'T8888999000',
      submitted_by: 'Encore Music LLC',
      submission_date: '2025-07-15',
      pro_name: 'BMI',
      registration_status: 'in_dispute',
      last_response: 'Ownership conflict detected',
      sender_code: 'ENCORMUS',
      submission_data: {
        id: '4',
        user_id: 'current-user',
        sender_code: 'ENCORMUS',
        pro_name: 'BMI',
        submission_date: '2025-07-15',
        work_title: 'Electric Dreams',
        iswc: 'T8888999000',
        submission_status: 'disputed',
        submitted_by: 'Encore Music LLC',
        created_at: '2025-07-15T16:45:00Z',
        updated_at: '2025-07-18T10:20:00Z'
      },
      ack_data: {
        id: 'ack-4',
        user_id: 'current-user',
        submission_id: '4',
        response_code: 'DU',
        response_message: 'Duplicate work registration with conflicting ownership',
        registration_status: 'in_dispute',
        parsed_data: {
          errors: ['Ownership conflict'],
          warnings: ['Duplicate ISWC found']
        },
        linked_records: {
          swr: ['SWR555666'],
          pwr: [],
          nwr: []
        },
        received_at: '2025-07-18T10:20:00Z',
        created_at: '2025-07-18T10:20:00Z',
        updated_at: '2025-07-18T10:20:00Z'
      }
    }
  ];

  const fetchRegistrationStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, use mock data since we just created the schema
      // In a real implementation, this would fetch from the database:
      // const { data: submissions, error: submissionsError } = await supabase
      //   .from('cwr_submissions')
      //   .select(`
      //     *,
      //     cwr_acknowledgments(*)
      //   `)
      //   .order('submission_date', { ascending: false });

      // if (submissionsError) throw submissionsError;

      setRegistrations(mockRegistrations);
    } catch (err) {
      console.error('Error fetching registration status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch registration status');
      toast({
        title: "Error",
        description: "Failed to fetch registration status data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRegistrationStatus = async (submissionId: string, newStatus: string, reason?: string) => {
    try {
      // In a real implementation, this would update the database
      // For now, update the mock data
      setRegistrations(prev => 
        prev.map(reg => 
          reg.id === submissionId 
            ? { ...reg, registration_status: newStatus, last_response: reason || reg.last_response }
            : reg
        )
      );

      toast({
        title: "Status Updated",
        description: `Registration status updated to ${newStatus}`
      });
    } catch (err) {
      console.error('Error updating registration status:', err);
      toast({
        title: "Error",
        description: "Failed to update registration status",
        variant: "destructive"
      });
    }
  };

  const regenerateCWRFile = async (submissionId: string) => {
    try {
      toast({
        title: "Regenerating CWR",
        description: "Regenerating CWR file for re-submission..."
      });
      
      // In a real implementation, this would trigger CWR regeneration
      // For now, just show success message
      setTimeout(() => {
        toast({
          title: "CWR Regenerated",
          description: "CWR file has been regenerated and is ready for re-submission"
        });
      }, 2000);
    } catch (err) {
      console.error('Error regenerating CWR:', err);
      toast({
        title: "Error",
        description: "Failed to regenerate CWR file",
        variant: "destructive"
      });
    }
  };

  const resendToPRO = async (submissionId: string) => {
    try {
      const registration = registrations.find(r => r.id === submissionId);
      if (!registration) return;

      toast({
        title: "Resending to PRO",
        description: `Resending ${registration.work_title} to ${registration.pro_name}...`
      });
      
      // In a real implementation, this would trigger re-submission
      setTimeout(() => {
        toast({
          title: "Resent Successfully",
          description: `Work has been resent to ${registration.pro_name}`
        });
      }, 2000);
    } catch (err) {
      console.error('Error resending to PRO:', err);
      toast({
        title: "Error",
        description: "Failed to resend to PRO",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchRegistrationStatus();
  }, []);

  return {
    registrations,
    loading,
    error,
    fetchRegistrationStatus,
    updateRegistrationStatus,
    regenerateCWRFile,
    resendToPRO
  };
};