import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useViewModeOptional } from './useViewModeOptional';

export const useUserRoles = () => {
  const { user } = useAuth();
  const { isViewingAsSubAccount } = useViewModeOptional();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user roles:', error);
          setRoles([]);
          return;
        }

        setRoles(data?.map(item => item.role) || []);
      } catch (error) {
        console.error('Error fetching user roles:', error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoles();
  }, [user]);

  // Suppress admin role when viewing as sub-account
  const effectiveRoles = isViewingAsSubAccount ? roles.filter(r => r !== 'admin') : roles;

  const hasRole = (role: string) => effectiveRoles.includes(role);
  const isAdmin = hasRole('admin');

  return {
    roles: effectiveRoles,
    loading,
    hasRole,
    isAdmin
  };
};