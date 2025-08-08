import React, { useState, useEffect } from 'react';
import { X, Coins, Shield, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface StakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UserStatus {
  address: string;
  isRegistered: boolean;
  isVerified: boolean;
  balance: string;
  canStake: boolean;
  userStatus: {
    createdAt: string;
    longevity: string;
  } | null;
}

const StakingModal: React.FC<StakingModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { wallet } = useWallet();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'check' | 'form' | 'staking' | 'success' | 'error'>('check');
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [identifier, setIdentifier] = useState('');
  const [longevity, setLongevity] = useState(30);
  const [treasuryAddress, setTreasuryAddress] = useState('');

  // Check user status when modal opens
  useEffect(() => {
    if (isOpen && wallet.address) {
      checkUserStatus();
      // Set default treasury address (signer[1] from your plan)
      setTreasuryAddress(process.env.REACT_APP_TREASURY_ADDRESS || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
    }
  }, [isOpen, wallet.address]);

  const checkUserStatus = async () => {
    if (!wallet.address) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/stake/status/${wallet.address}`);
      const data = await response.json();

      if (data.success) {
        setUserStatus(data.data);
        
        if (data.data.isRegistered && data.data.isVerified) {
          setStep('success');
        } else if (data.data.isRegistered && !data.data.isVerified) {
          setError('User is registered but not verified. Please contact support.');
          setStep('error');
        } else {
          setStep('form');
        }
      } else {
        setError(data.message || 'Failed to check user status');
        setStep('error');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleStaking = async () => {
    if (!wallet.address || !wallet.isConnected) {
      setError('Wallet not connected');
      return;
    }

    if (!identifier.trim()) {
      setError('Please enter an identifier');
      return;
    }

    if (!treasuryAddress.trim()) {
      setError('Treasury address is required');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('staking');

    try {
      // For demo purposes, use a test private key (in production, use MetaMask signing)
      const testPrivateKey = process.env.REACT_APP_TEST_PRIVATE_KEY || '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/stake/register-and-stake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier,
          longevity,
          privateKey: testPrivateKey, // In production, handle this securely
          treasuryAddress
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('success');
        
        // Auto-login and redirect to dashboard
        try {
          await login();
          toast.success('Successfully verified and logged in!');
          setTimeout(() => {
            onSuccess();
            navigate('/dashboard');
          }, 2000);
        } catch (loginError) {
          // If login fails, just show success but let user manually login
          onSuccess();
        }
      } else {
        setError(data.message || 'Staking failed');
        setStep('error');
      }
    } catch (err: any) {
      setError(err.message || 'Staking failed');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Coins className="mr-2 text-primary-600" />
              Stake & Verify
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Status Check Step */}
          {step === 'check' && (
            <div className="text-center py-8">
              <Loader className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-4" />
              <p className="text-gray-600">Checking your account status...</p>
            </div>
          )}

          {/* Registration Form Step */}
          {step === 'form' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Stake-Based Verification</h3>
                <p className="text-blue-700 text-sm">
                  Stake 10 GCR tokens to get instantly verified and start submitting reports.
                  Your stake will be returned when your reports are processed.
                </p>
              </div>

              {userStatus && (
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Account Status</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600">Balance:</span> {userStatus.balance}</p>
                    <p><span className="text-gray-600">Can Stake:</span> 
                      {userStatus.canStake ? 
                        <span className="text-green-600 ml-1">✅ Yes</span> : 
                        <span className="text-red-600 ml-1">❌ Insufficient balance</span>
                      }
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identifier (Encrypted)
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Your encrypted identifier..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longevity (Years)
                </label>
                <input
                  type="number"
                  value={longevity}
                  onChange={(e) => setLongevity(parseInt(e.target.value))}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Treasury Address
                </label>
                <input
                  type="text"
                  value={treasuryAddress}
                  onChange={(e) => setTreasuryAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">Treasury address where stakes are held</p>
              </div>

              <button
                onClick={handleStaking}
                disabled={!userStatus?.canStake || loading}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                ) : (
                  <Shield className="h-5 w-5 mr-2" />
                )}
                Stake 10 GCR & Get Verified
              </button>
            </div>
          )}

          {/* Staking In Progress */}
          {step === 'staking' && (
            <div className="text-center py-8">
              <Loader className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Processing Your Stake</h3>
              <p className="text-gray-600 mb-4">
                Please wait while we register your account, process your stake, and verify your status.
              </p>
              <div className="text-left bg-gray-50 rounded-lg p-4 text-sm">
                <div className="space-y-2">
                  <p>🔄 Registering user account...</p>
                  <p>💰 Transferring 10 GCR to treasury...</p>
                  <p>✅ Auto-verifying account...</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-700 mb-2">
                Successfully Verified!
              </h3>
              <p className="text-gray-600 mb-6">
                You are now verified and can submit reports. Your 10 GCR stake will be returned when your reports are processed.
              </p>
              <button
                onClick={async () => {
                  try {
                    await login();
                    navigate('/dashboard');
                    onClose();
                  } catch (error) {
                    toast.error('Login failed. Please try logging in manually.');
                  }
                }}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-700 mb-2">
                Error
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={() => setStep('check')}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-md font-medium hover:bg-primary-700"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StakingModal;
