import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useViewModeOptional } from './useViewModeOptional';

export const useSuperAdmin = () => {
  const { user } = useAuth();
  const { isViewingAsSubAccount } = useViewModeOptional();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdminStatus = () => {
      // Check if user is a super admin (case-insensitive)
      const email = user?.email?.toLowerCase() || '';
      const superAdminStatus = ['info@encoremusic.tech', 'support@encoremusic.tech', 'operations@encoremusic.tech'].includes(email);
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

  // Suppress super admin when viewing as sub-account
  const effectiveIsSuperAdmin = isViewingAsSubAccount ? false : isSuperAdmin;

  return {
    isSuperAdmin: effectiveIsSuperAdmin,
    loading
  };
};