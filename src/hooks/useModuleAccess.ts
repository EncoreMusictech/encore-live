import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface ModuleAccess {
  module_id: string;
  access_source: string;
  granted_at: string;
  expires_at?: string;
}

export function useModuleAccess() {
  const { user } = useAuth();
  const [moduleAccess, setModuleAccess] = useState<ModuleAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);

  useEffect(() => {
    const fetchModuleAccess = async () => {
      if (!user) {
        setModuleAccess([]);
        setIsDemoUser(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_module_access')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching module access:', error);
          setModuleAccess([]);
        } else {
          setModuleAccess(data || []);
        }

        // Check if this is the demo user
        setIsDemoUser(user.email === 'info@encoremusic.tech');
      } catch (error) {
        console.error('Error fetching module access:', error);
        setModuleAccess([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModuleAccess();
  }, [user]);

  const hasModuleAccess = (moduleId: string) => {
    return moduleAccess.some(access => 
      access.module_id === moduleId && 
      (access.expires_at ? new Date(access.expires_at) > new Date() : true)
    );
  };

  const getAccessSource = (moduleId: string) => {
    const access = moduleAccess.find(access => access.module_id === moduleId);
    return access?.access_source || null;
  };

  return {
    moduleAccess,
    hasModuleAccess,
    getAccessSource,
    isDemoUser,
    loading,
  };
}