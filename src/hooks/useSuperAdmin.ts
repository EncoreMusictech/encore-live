import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useSuperAdmin = () => {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdminStatus = () => {
      // Check if user is a super admin (case-insensitive)
      const email = user?.email?.toLowerCase() || '';
      const superAdminStatus = ['support@encoremusic.tech','info@encoremusic.tech'].includes(email);
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