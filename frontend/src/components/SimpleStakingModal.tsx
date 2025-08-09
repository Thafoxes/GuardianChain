import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';

interface SimpleStakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SimpleStakingModal: React.FC<SimpleStakingModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [identifier, setIdentifier] = useState('');
  const [longevity, setLongevity] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [error, setError] = useState('');
  const [registrationTx, setRegistrationTx] = useState('');

  const { wallet } = useWallet();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet.address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!window.ethereum) {
      setError('MetaMask not found');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Connect to the UserVerification contract directly
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Contract address from API environment
      const userVerificationAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
      
      // Simplified ABI for registerUser function
      const userVerificationABI = [
        "function registerUser(string memory identifier, uint256 longevity) external",
        "function isRegistered(address user) external view returns (bool)"
      ];
      
      const contract = new ethers.Contract(userVerificationAddress, userVerificationABI, signer);
      
      // Check if already registered
      const isRegistered = await contract.isRegistered(wallet.address);
      if (isRegistered) {
        setStep('verify');
        return;
      }
      
      // Call registerUser
      const tx = await contract.registerUser(identifier, longevity);
      setRegistrationTx(tx.hash);
      
      // Wait for confirmation
      await tx.wait();
      
      alert(`✅ Registration successful! Transaction: ${tx.hash}`);
      setStep('verify');
      
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!wallet.address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Call the API for verification
      const response = await fetch('http://localhost:3001/api/stake/register-and-stake-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: wallet.address
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
        
        alert(`✅ Verification successful! 
        
Your account has been verified and you can now submit reports.
        
Verification TX: ${data.data.verificationTx}
Permissions TX: ${data.data.permissionTx}`);
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {step === 'register' ? 'Register Account' : 'Verify Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>Step {step === 'register' ? '1' : '2'} of 2:</strong> 
            {step === 'register' 
              ? ' Register using your wallet (blockchain transaction)'
              : ' API verification (automatic stake validation)'
            }
          </p>
        </div>

        {step === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identifier
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your identifier"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longevity (years)
              </label>
              <input
                type="number"
                value={longevity}
                onChange={(e) => setLongevity(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="100"
                required
                disabled={isLoading}
              />
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <p className="text-sm text-gray-600">
                <strong>Connected Wallet:</strong> {wallet.address}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading || !wallet.address}
            >
              {isLoading ? 'Registering...' : 'Register with Wallet'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">
                ✅ Registration completed successfully!
                {registrationTx && (
                  <><br />TX: {registrationTx}</>
                )}
              </p>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <p className="text-sm text-gray-600">
                <strong>Next:</strong> API will verify your stake and grant permissions
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleVerify}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify & Grant Permissions'}
            </button>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          <p><strong>Process:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Register with your wallet (you pay gas)</li>
            <li>API handles verification automatically</li>
            <li>Report submission permissions granted</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
