import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useViewModeOptional } from './useViewModeOptional';

export const useAdmin = () => {
  const { user } = useAuth();
  const { isViewingAsSubAccount } = useViewModeOptional();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = () => {
      // Check if user is an admin (case-insensitive)
      const email = user?.email?.toLowerCase() || '';
      const adminStatus = ['info@encoremusic.tech', 'support@encoremusic.tech', 'operations@encoremusic.tech'].includes(email);
      setIsAdmin(adminStatus);
      setLoading(false);
    };

    if (user) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
      setLoading(false);
    }
  }, [user]);

  // Suppress admin when viewing as sub-account
  const effectiveIsAdmin = isViewingAsSubAccount ? false : isAdmin;

  return {
    isAdmin: effectiveIsAdmin,
    loading
  };
};