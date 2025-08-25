import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = () => {
      // Check if user is the admin email
      const adminStatus = user?.email === 'info@encoremusic.tech';
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

  return {
    isAdmin,
    loading
  };
};