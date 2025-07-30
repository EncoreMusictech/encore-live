import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type ProType = 'ASCAP' | 'BMI' | 'ICE' | 'SOCAN' | 'PRS' | 'OTHER';
export type SenderCodeStatus = 'not_submitted' | 'submitted' | 'verified';

export interface SenderCode {
  id: string;
  user_id: string;
  sender_code: string;
  company_name: string;
  ipi_cae_number?: string;
  contact_email: string;
  target_pros: ProType[];
  status: SenderCodeStatus;
  supporting_document_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  status_updated_at?: string;
}

export interface SenderCodeRequest {
  id: string;
  sender_code_id: string;
  pro_type: ProType;
  request_content: string;
  request_sent_at: string;
  response_received_at?: string;
  response_notes?: string;
}

export const useSenderCodes = () => {
  const { user } = useAuth();
  const [senderCodes, setSenderCodes] = useState<SenderCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSenderCodes = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('cwr_sender_codes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSenderCodes(data || []);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to fetch sender codes');
    } finally {
      setLoading(false);
    }
  };

  const createSenderCode = async (senderCodeData: Omit<SenderCode, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'status_updated_at'>) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    try {
      // Check for duplicates first
      const { data: duplicateCheck } = await supabase
        .rpc('check_duplicate_sender_code', { 
          p_sender_code: senderCodeData.sender_code.toUpperCase(),
          p_user_id: user.id 
        });

      if (duplicateCheck) {
        throw new Error('A sender code with this value already exists');
      }

      const { data, error } = await supabase
        .from('cwr_sender_codes')
        .insert({
          company_name: senderCodeData.company_name,
          contact_email: senderCodeData.contact_email,
          sender_code: senderCodeData.sender_code.toUpperCase(),
          ipi_cae_number: senderCodeData.ipi_cae_number,
          target_pros: senderCodeData.target_pros,
          status: senderCodeData.status || 'not_submitted',
          supporting_document_url: senderCodeData.supporting_document_url,
          notes: senderCodeData.notes,
          user_id: user.id,
          encrypted_sender_code: '' // This will be set by the trigger
        })
        .select()
        .single();

      if (error) throw error;

      setSenderCodes(prev => [data, ...prev]);
      toast.success('Sender code created successfully');
      return data;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSenderCode = async (id: string, updates: Partial<SenderCode>) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cwr_sender_codes')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setSenderCodes(prev => prev.map(code => code.id === id ? data : code));
      toast.success('Sender code updated successfully');
      return data;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: SenderCodeStatus, notes?: string) => {
    return updateSenderCode(id, { 
      status, 
      notes, 
      status_updated_at: new Date().toISOString() 
    });
  };

  const deleteSenderCode = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    try {
      const { error } = await supabase
        .from('cwr_sender_codes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSenderCodes(prev => prev.filter(code => code.id !== id));
      toast.success('Sender code deleted successfully');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkDuplicate = async (senderCode: string) => {
    if (!user) return false;

    try {
      const { data } = await supabase
        .rpc('check_duplicate_sender_code', { 
          p_sender_code: senderCode.toUpperCase(),
          p_user_id: user.id 
        });

      return data;
    } catch (err) {
      console.error('Error checking duplicate:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchSenderCodes();
  }, [user]);

  return {
    senderCodes,
    loading,
    error,
    createSenderCode,
    updateSenderCode,
    updateStatus,
    deleteSenderCode,
    checkDuplicate,
    refetch: fetchSenderCodes
  };
};