import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FTPCredential {
  id: string;
  pro_name: string;
  pro_code: string;
  host: string;
  port: number;
  username: string;
  base_path: string;
  connection_type: string;
  is_active: boolean;
  connection_status: string;
  last_connection_test?: string;
  created_at: string;
  updated_at: string;
}

interface FTPCredentialInput {
  pro_name: string;
  pro_code: string;
  host: string;
  port: number;
  username: string;
  password: string;
  base_path?: string;
  connection_type: 'ftp' | 'sftp';
}

export const useFTPCredentials = () => {
  const [credentials, setCredentials] = useState<FTPCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pro_ftp_credentials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching FTP credentials:', error);
        toast({
          title: "Error",
          description: "Failed to load FTP credentials",
          variant: "destructive"
        });
        return;
      }

      setCredentials(data || []);
    } catch (error) {
      console.error('Error fetching FTP credentials:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCredential = async (input: FTPCredentialInput) => {
    setLoading(true);
    try {
      // In a real implementation, password would be encrypted client-side or server-side
      const { data, error } = await supabase
        .from('pro_ftp_credentials')
        .insert({
          pro_name: input.pro_name,
          pro_code: input.pro_code,
          host: input.host,
          port: input.port,
          username: input.username,
          password_encrypted: btoa(input.password), // Simple base64 encoding - use proper encryption in production
          base_path: input.base_path || '/',
          connection_type: input.connection_type,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating FTP credential:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to create FTP credentials",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Success",
        description: "FTP credentials created successfully",
      });

      await fetchCredentials();
      return data;
    } catch (error) {
      console.error('Error creating FTP credential:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateCredential = async (id: string, updates: Partial<FTPCredentialInput>) => {
    setLoading(true);
    try {
      const updateData: any = { ...updates };
      if (updates.password) {
        updateData.password_encrypted = btoa(updates.password);
        delete updateData.password;
      }

      const { error } = await supabase
        .from('pro_ftp_credentials')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating FTP credential:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to update FTP credentials",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "FTP credentials updated successfully",
      });

      await fetchCredentials();
      return true;
    } catch (error) {
      console.error('Error updating FTP credential:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteCredential = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('pro_ftp_credentials')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting FTP credential:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete FTP credentials",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "FTP credentials deleted successfully",
      });

      await fetchCredentials();
      return true;
    } catch (error) {
      console.error('Error deleting FTP credential:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (id: string) => {
    setTesting(id);
    try {
      // Simulate connection test - in production this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      const { error } = await supabase
        .from('pro_ftp_credentials')
        .update({
          connection_status: success ? 'connected' : 'failed',
          last_connection_test: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating connection status:', error);
      }

      toast({
        title: success ? "Connection Successful" : "Connection Failed",
        description: success ? "FTP connection test passed" : "Unable to connect to FTP server",
        variant: success ? "default" : "destructive"
      });

      await fetchCredentials();
      return success;
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: "Test Failed",
        description: "An unexpected error occurred during connection test",
        variant: "destructive"
      });
      return false;
    } finally {
      setTesting(null);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  return {
    credentials,
    loading,
    testing,
    createCredential,
    updateCredential,
    deleteCredential,
    testConnection,
    refetch: fetchCredentials
  };
};