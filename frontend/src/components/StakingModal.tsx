import React, { useState, useEffect } from 'react';
import { X, Coins, Shield, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { stakingApi } from '../services/api';
import { ethers } from 'ethers';
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
  hasStaked: boolean;
  stakeAmount?: string;
  registrationTx?: string;
  stakeTx?: string;
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

  // Check user status when modal opens
  useEffect(() => {
    if (isOpen && wallet.address) {
      checkUserStatus();
    }
  }, [isOpen, wallet.address]);

  const checkUserStatus = async () => {
    if (!wallet.address) return;

    setLoading(true);
    setError(null);

    try {
      const statusResponse = await stakingApi.getStatus(wallet.address);

      if (statusResponse.success && statusResponse.data) {
        const status = {
          address: wallet.address,
          ...statusResponse.data
        };
        setUserStatus(status);
        
        if (status.isRegistered && status.isVerified) {
          setStep('success');
        } else if (status.isRegistered && !status.isVerified) {
          setError('User is registered but not verified. Please contact support.');
          setStep('error');
        } else {
          setStep('form');
        }
      } else {
        setError(statusResponse.message || 'Failed to check user status');
        setStep('error');
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
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

    setLoading(true);
    setError(null);
    setStep('staking');

    try {
      // Step 1: First register the user via MetaMask (direct smart contract call)
      if (!userStatus?.isRegistered) {
        toast('Step 1: Registering user...', {
          icon: '📝',
          duration: 4000
        });

        try {
          // Try direct MetaMask registration first
          if (!window.ethereum) {
            throw new Error('MetaMask not found');
          }

          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();

          // UserVerification contract ABI (simplified)
          const userVerificationABI = [
            "function registerUser(string memory _identifier, uint256 _longevity) external"
          ];

          const userVerificationAddress = import.meta.env.VITE_CONTRACT_ADDRESS_USER_VERIFICATION;
          if (!userVerificationAddress) {
            throw new Error('User verification contract address not configured');
          }

          const userContract = new ethers.Contract(userVerificationAddress, userVerificationABI, signer);

          // Register user via MetaMask with explicit gas configuration for Sapphire
          const registerTx = await userContract.registerUser(identifier, longevity, {
            gasLimit: 1000000, // Increased gas limit for Sapphire encryption operations
            // Let MetaMask handle gas price for local network
          });
          
          toast('Registration transaction submitted. Waiting for confirmation...', {
            icon: '⏳',
            duration: 6000
          });
          
          // Wait for registration confirmation
          const registerReceipt = await registerTx.wait();
          
          if (!registerReceipt || registerReceipt.status !== 1) {
            throw new Error('Registration transaction failed or was reverted');
          }

          toast.success('User registration confirmed via MetaMask! Now staking tokens...');

        } catch (metaMaskError) {
          console.warn('MetaMask registration failed, using API fallback:', metaMaskError);
          
          // Fallback to API registration + staking (all-in-one)
          toast('MetaMask registration failed, using API registration + staking...', {
            icon: '🔄',
            duration: 4000
          });

          // Use the register-and-stake API endpoint for complete flow
          const apiResponse = await stakingApi.registerAndStake({
            identifier,
            longevity,
            walletAddress: wallet.address,
            stakeTransactionHash: 'api-registration' // API handles the staking internally
          });

          if (!apiResponse.success) {
            throw new Error(`API registration and staking failed: ${apiResponse.message}`);
          }

          toast.success('User registration and staking completed via API!');
          
          // Skip to success since API handled everything
          setStep('success');
          
          // Auto-login and redirect
          try {
            await login();
            toast.success('Successfully verified and logged in!');
            setTimeout(() => {
              onSuccess();
              navigate('/dashboard');
            }, 2000);
          } catch (loginError) {
            onSuccess();
          }
          
          return; // Exit early since API handled everything
        }
      } else {
        toast('User already registered. Proceeding to stake tokens...', {
          icon: 'ℹ️',
          duration: 3000
        });
      }

      // Step 2: Stake tokens via MetaMask
      toast('Step 2: Staking 10 GCR tokens via MetaMask...', {
        icon: '💰',
        duration: 4000
      });

      const treasuryAddress = import.meta.env.VITE_TREASURY_ADDRESS || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      const tokenAddress = import.meta.env.VITE_REWARD_TOKEN_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // ERC20 token contract interface (simplified)
      const tokenABI = [
        "function transfer(address to, uint256 amount) external returns (bool)",
        "function balanceOf(address account) external view returns (uint256)",
        "function decimals() external view returns (uint8)"
      ];

      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);

      // Check user's token balance
      const balance = await tokenContract.balanceOf(wallet.address);
      const stakeAmount = ethers.parseEther('10'); // 10 GCR tokens

      if (balance < stakeAmount) {
        throw new Error(`Insufficient GCR tokens. Need 10 GCR, have ${ethers.formatEther(balance)} GCR`);
      }

      // Send 10 GCR tokens to treasury
      const stakeTx = await tokenContract.transfer(treasuryAddress, stakeAmount);
      
      toast('Stake transaction submitted. Waiting for confirmation...', {
        icon: '⏳',
        duration: 6000
      });
      
      // Wait for transaction confirmation
      const receipt = await stakeTx.wait();
      
      if (!receipt || receipt.status !== 1) {
        throw new Error('Stake transaction failed or was reverted');
      }

      toast.success('Stake transaction confirmed! Processing verification...');

      // Step 3: Call API to verify the stake and complete verification
      const response = await stakingApi.stakeForVerification({
        walletAddress: wallet.address,
        stakeTransactionHash: stakeTx.hash
      });

      if (response.success && response.data) {
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
        setError(response.message || 'Verification failed after successful staking');
        setStep('error');
      }
    } catch (err: any) {
      console.error('Staking error:', err);
      
      let errorMessage = 'Staking failed';
      if (err.message.includes('Insufficient GCR')) {
        errorMessage = err.message;
      } else if (err.message.includes('rejected')) {
        errorMessage = 'Transaction was rejected by user';
      } else if (err.message.includes('MetaMask')) {
        errorMessage = 'MetaMask connection error';
      } else if (err.message.includes('Transaction failed')) {
        errorMessage = 'Blockchain transaction failed. Please try again.';
      } else if (err.message.includes('User verification contract')) {
        errorMessage = 'Smart contract configuration error. Please contact support.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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
                    <p><span className="text-gray-600">Registered:</span> 
                      {userStatus.isRegistered ? 
                        <span className="text-green-600 ml-1">✅ Yes</span> : 
                        <span className="text-gray-600 ml-1">❌ No</span>
                      }
                    </p>
                    <p><span className="text-gray-600">Verified:</span> 
                      {userStatus.isVerified ? 
                        <span className="text-green-600 ml-1">✅ Yes</span> : 
                        <span className="text-gray-600 ml-1">❌ No</span>
                      }
                    </p>
                    <p><span className="text-gray-600">Has Staked:</span> 
                      {userStatus.hasStaked ? 
                        <span className="text-green-600 ml-1">✅ Yes ({userStatus.stakeAmount} GCR)</span> : 
                        <span className="text-gray-600 ml-1">❌ No</span>
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-2">
                  <Coins className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Two-Step Verification Process:</p>
                    <ol className="list-decimal list-inside text-blue-800 space-y-1">
                      <li><strong>Register:</strong> Call registerUser() via MetaMask (if not already registered)</li>
                      <li><strong>Stake:</strong> Transfer 10 GCR tokens to treasury via MetaMask</li>
                      <li><strong>Verify:</strong> API verifies your stake and activates your account</li>
                      <li>You can then submit reports to the blockchain</li>
                    </ol>
                    <p className="text-blue-700 mt-2 text-xs">
                      ⚠️ This uses your own wallet to register (msg.sender), ensuring proper ownership.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStaking}
                disabled={loading}
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
                Processing MetaMask transaction and verifying your account...
              </p>
              <div className="text-left bg-gray-50 rounded-lg p-4 text-sm">
                <div className="space-y-2">
                  <p>� Sending 10 GCR tokens to treasury via MetaMask...</p>
                  <p>⏳ Waiting for transaction confirmation...</p>
                  <p>🔄 Registering and verifying account...</p>
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
