import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, Shield, AlertCircle, Coins } from 'lucide-react';
import StakingModal from '../components/StakingModal';
import toast from 'react-hot-toast';

const RegisterPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showStakingModal, setShowStakingModal] = useState(false);
  const { wallet, connectWallet, isCorrectNetwork, switchToSapphire } = useWallet();
  const { auth } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/dashboard');
    }
  }, [auth.isAuthenticated, navigate]);

  // Auto-open staking modal when wallet is connected
  useEffect(() => {
    if (wallet.isConnected && isCorrectNetwork()) {
      setShowStakingModal(true);
    }
  }, [wallet.isConnected, isCorrectNetwork]);

  const handleWalletConnect = async () => {
    try {
      setIsLoading(true);
      await connectWallet();
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStakingSuccess = () => {
    setShowStakingModal(false);
    navigate('/dashboard');
  };

  const handleNetworkSwitch = async () => {
    try {
      await switchToSapphire();
    } catch (error: any) {
      toast.error(error.message || 'Failed to switch network');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-bold text-secondary-900">
            Join GuardianChain
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            Stake 10 GCR tokens to get instantly verified and start reporting
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {!wallet.isConnected ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Connect Your Wallet
                    </h3>
                    <p className="mt-1 text-sm text-blue-700">
                      First, connect your MetaMask wallet to get started with GuardianChain.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleWalletConnect}
                disabled={isLoading}
                className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <Wallet className="h-5 w-5 mr-2" />
                )}
                Connect MetaMask
              </button>
            </div>
          ) : !isCorrectNetwork() ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Wrong Network
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      Please switch to Oasis Sapphire Testnet to continue.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleNetworkSwitch}
                className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Switch to Sapphire Testnet
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <Coins className="h-5 w-5 text-green-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Ready to Stake & Verify
                    </h3>
                    <p className="mt-1 text-sm text-green-700">
                      Your wallet is connected. Click below to stake tokens and get verified.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowStakingModal(true)}
                className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Coins className="h-5 w-5 mr-2" />
                Stake & Get Verified
              </button>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-secondary-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in instead
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Staking Modal */}
      <StakingModal
        isOpen={showStakingModal}
        onClose={() => setShowStakingModal(false)}
        onSuccess={handleStakingSuccess}
      />
    </div>
  );
};

export default RegisterPage;
