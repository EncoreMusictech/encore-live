import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useSuperAdmin = () => {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdminStatus = () => {
      // Check if user is the super admin email
      const superAdminStatus = user?.email === 'support@encoremusic.tech' || user?.email === 'info@encoremusic.tech';
      setIsSuperAdmin(superAdminStatus);
      setLoading(false);
    };

    if (user) {
      checkSuperAdminStatus();
    } else {
      setIsSuperAdmin(false);
      setLoading(false);
    }
  }, [user]);

  return {
    isSuperAdmin,
    loading
  };
};