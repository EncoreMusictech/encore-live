import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeliveryJob {
  id: string;
  export_id: string;
  ftp_credential_id: string;
  file_path: string;
  delivery_status: string;
  attempt_count: number;
  max_attempts: number;
  last_attempt_at?: string;
  completed_at?: string;
  error_message?: string;
  delivery_metadata: any;
  created_at: string;
}

interface ACKProcessingLog {
  id: string;
  ack_file_name: string;
  processing_status: string;
  works_updated: number;
  errors_found: number;
  processing_errors: any;
  processed_at?: string;
  created_at: string;
}

export const useExportDelivery = () => {
  const [deliveryJobs, setDeliveryJobs] = useState<DeliveryJob[]>([]);
  const [ackLogs, setAckLogs] = useState<ACKProcessingLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [delivering, setDelivering] = useState<string | null>(null);
  const [processingAck, setProcessingAck] = useState(false);
  const { toast } = useToast();

  const fetchDeliveryJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('export_delivery_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching delivery jobs:', error);
        return;
      }

      setDeliveryJobs(data || []);
    } catch (error) {
      console.error('Error fetching delivery jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAckLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('ack_processing_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ACK logs:', error);
        return;
      }

      setAckLogs(data || []);
    } catch (error) {
      console.error('Error fetching ACK logs:', error);
    }
  };

  const deliverExport = async (exportId: string, ftpCredentialId: string) => {
    setDelivering(exportId);
    try {
      const { data, error } = await supabase.functions.invoke('deliver-export-ftp', {
        body: { exportId, ftpCredentialId }
      });

      if (error) {
        console.error('Delivery error:', error);
        toast({
          title: "Delivery Failed",
          description: error.message || "Failed to deliver export file",
          variant: "destructive"
        });
        return null;
      }

      if (data.success) {
        toast({
          title: "Delivery Started",
          description: "Export file delivery has been initiated",
        });
      } else {
        toast({
          title: "Delivery Failed",
          description: data.message || "Failed to deliver export file",
          variant: "destructive"
        });
      }

      await fetchDeliveryJobs();
      return data;
    } catch (error) {
      console.error('Error delivering export:', error);
      toast({
        title: "Delivery Error",
        description: "An unexpected error occurred during delivery",
        variant: "destructive"
      });
      return null;
    } finally {
      setDelivering(null);
    }
  };

  const processAckFiles = async () => {
    setProcessingAck(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-ack-files', {
        body: {}
      });

      if (error) {
        console.error('ACK processing error:', error);
        toast({
          title: "ACK Processing Failed",
          description: error.message || "Failed to process ACK files",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "ACK Processing Complete",
        description: `Processed ${data.processedFiles} files, updated ${data.totalWorksUpdated} works`,
      });

      await Promise.all([fetchAckLogs(), fetchDeliveryJobs()]);
      return data;
    } catch (error) {
      console.error('Error processing ACK files:', error);
      toast({
        title: "Processing Error",
        description: "An unexpected error occurred during ACK processing",
        variant: "destructive"
      });
      return null;
    } finally {
      setProcessingAck(false);
    }
  };

  const retryDelivery = async (jobId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('export_delivery_jobs')
        .update({
          delivery_status: 'pending',
          error_message: null
        })
        .eq('id', jobId);

      if (error) {
        console.error('Error retrying delivery:', error);
        toast({
          title: "Retry Failed",
          description: "Failed to retry delivery",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Delivery Queued",
        description: "Export delivery has been queued for retry",
      });

      await fetchDeliveryJobs();
      return true;
    } catch (error) {
      console.error('Error retrying delivery:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryJobs();
    fetchAckLogs();
  }, []);

  return {
    deliveryJobs,
    ackLogs,
    loading,
    delivering,
    processingAck,
    deliverExport,
    processAckFiles,
    retryDelivery,
    refetch: () => Promise.all([fetchDeliveryJobs(), fetchAckLogs()])
  };
};