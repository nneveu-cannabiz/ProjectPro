import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { isUserAdmin } from '../data/supabase-store';

export const useAdminCheck = () => {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser?.id) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const adminStatus = await isUserAdmin(currentUser.id);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [currentUser?.id]);

  return { isAdmin, loading };
};
