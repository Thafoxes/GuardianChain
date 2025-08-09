import { useState, useEffect } from 'react';
import { userApi } from '../services/api';
import { useWallet } from '../contexts/WalletContext';

interface UserRoles {
  isReporter: boolean;
  isVerifier: boolean;
  isAdmin: boolean;
  isVerified: boolean;
  role: string;
}

export const useUserRoles = () => {
  const [roles, setRoles] = useState<UserRoles | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { wallet } = useWallet();

  useEffect(() => {
    const fetchRoles = async () => {
      if (!wallet.address || !wallet.isConnected) {
        setRoles(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await userApi.getUserRoles(wallet.address);
        if (response.success && response.data) {
          setRoles(response.data);
        } else {
          setError(response.message || 'Failed to fetch user roles');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch user roles');
        console.error('Error fetching user roles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [wallet.address, wallet.isConnected]);

  const refetch = async () => {
    if (wallet.address && wallet.isConnected) {
      setLoading(true);
      setError(null);
      try {
        const response = await userApi.getUserRoles(wallet.address);
        if (response.success && response.data) {
          setRoles(response.data);
        } else {
          setError(response.message || 'Failed to fetch user roles');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch user roles');
      } finally {
        setLoading(false);
      }
    }
  };

  return { roles, loading, error, refetch };
};
