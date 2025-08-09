import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { authApi } from '../services/api';
import { User, AuthState } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  auth: AuthState;
  login: () => Promise<void>;
  logout: () => void;
  register: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  const { wallet, signMessage } = useWallet();

  // Login with wallet signature
  const login = async (): Promise<void> => {
    if (!wallet.isConnected || !wallet.address) {
      throw new Error('Wallet not connected');
    }

    try {
      setAuth(prev => ({ ...prev, loading: true }));

      // Get nonce from server
      const nonceResponse = await authApi.getNonce(wallet.address);
      const nonce = nonceResponse.data.nonce;

      // Create message to sign
      const message = `Sign this message to authenticate with GuardianChain.\n\nNonce: ${nonce}\nAddress: ${wallet.address}`;

      // Sign message
      const signature = await signMessage(message);

      // Send login request
      const loginResponse = await authApi.login({
        address: wallet.address,
        signature,
        message,
        nonce,
      });

      if (loginResponse.success && loginResponse.data.user) {
        setAuth({
          isAuthenticated: true,
          user: loginResponse.data.user,
          loading: false,
        });

        // Store token and wallet address if provided
        if (loginResponse.data.token) {
          localStorage.setItem('auth_token', loginResponse.data.token);
        }
        localStorage.setItem('wallet_address', wallet.address);

        toast.success('Successfully logged in!');
      } else {
        throw new Error(loginResponse.message || 'Login failed');
      }

    } catch (error: any) {
      console.error('Login failed:', error);
      setAuth(prev => ({ ...prev, loading: false }));
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  // Register new user (deprecated - use staking modal instead)
  const register = async (): Promise<void> => {
    if (!wallet.isConnected || !wallet.address) {
      throw new Error('Wallet not connected');
    }

    try {
      setAuth(prev => ({ ...prev, loading: true }));

      // For backwards compatibility, but users should use staking modal
      const registerResponse = await authApi.register({
        address: wallet.address,
        metadata: {
          identifier: 'legacy_user',
          longevity: 1,
        },
      });

      if (registerResponse.success && registerResponse.data.user) {
        setAuth({
          isAuthenticated: true,
          user: registerResponse.data.user,
          loading: false,
        });

        toast.success('Registration successful! Consider staking to get verified.');
      } else {
        throw new Error(registerResponse.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      setAuth(prev => ({ ...prev, loading: false }));
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  // Logout
  const logout = (): void => {
    setAuth({
      isAuthenticated: false,
      user: null,
      loading: false,
    });

    // Clear stored token and wallet address
    localStorage.removeItem('auth_token');
    localStorage.removeItem('wallet_address');
    
    toast.success('Logged out successfully');
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    if (!auth.isAuthenticated || !wallet.address) return;

    try {
      const userResponse = await authApi.getProfile();
      if (userResponse.success && userResponse.data) {
        setAuth(prev => ({
          ...prev,
          user: userResponse.data,
        }));
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (!token || !wallet.isConnected) {
        setAuth(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        const userResponse = await authApi.getProfile();
        if (userResponse.success && userResponse.data) {
          setAuth({
            isAuthenticated: true,
            user: userResponse.data,
            loading: false,
          });
        } else {
          // Invalid token, clear it
          localStorage.removeItem('auth_token');
          setAuth({
            isAuthenticated: false,
            user: null,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
        setAuth({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      }
    };

    if (wallet.isConnected) {
      checkAuth();
    } else {
      setAuth({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
    }
  }, [wallet.isConnected, wallet.address]);

  // Logout when wallet disconnects
  useEffect(() => {
    if (!wallet.isConnected && auth.isAuthenticated) {
      logout();
    }
  }, [wallet.isConnected, auth.isAuthenticated]);

  const value: AuthContextType = {
    auth,
    login,
    logout,
    register,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
