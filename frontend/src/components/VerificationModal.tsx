import React, { useState } from 'react';
import { X, AlertCircle, UserCheck, Clock, Shield } from 'lucide-react';
import { userApi } from '../services/api';
import toast from 'react-hot-toast';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  onVerificationComplete: () => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  onVerificationComplete
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    longevity: 30,
    privateKey: ''
  });

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.identifier.trim()) {
      toast.error('Please enter an identifier');
      return;
    }

    if (!formData.privateKey.trim()) {
      toast.error('Please enter your private key');
      return;
    }

    setIsRegistering(true);

    try {
      await userApi.registerUser({
        identifier: formData.identifier.trim(),
        longevity: formData.longevity,
        walletAddress,
        privateKey: formData.privateKey.trim()
      });

      toast.success('Registration successful! Please wait for admin verification.');
      onVerificationComplete();
      onClose();
    } catch (error: any) {
      console.error('Registration failed:', error);
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">User Verification Required</h2>
              <p className="text-sm text-gray-500">Register and verify your account to submit reports</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Alert */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-amber-800 font-medium mb-1">Account Not Verified</p>
                <p className="text-amber-700">
                  You need to register and be verified by an administrator before you can submit reports to the blockchain.
                </p>
              </div>
            </div>
          </div>

          {/* Verification Steps */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Verification Process:</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
                <span className="text-sm text-gray-600">Complete registration form</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Clock className="w-3 h-3 text-gray-400" />
                </div>
                <span className="text-sm text-gray-600">Wait for admin verification</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Shield className="w-3 h-3 text-gray-400" />
                </div>
                <span className="text-sm text-gray-600">Submit reports to blockchain</span>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                User Identifier
              </label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                placeholder="Enter a unique identifier (e.g., username)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">This will be encrypted and stored on the blockchain</p>
            </div>

            <div>
              <label htmlFor="longevity" className="block text-sm font-medium text-gray-700 mb-1">
                Account Longevity (years)
              </label>
              <input
                type="number"
                id="longevity"
                name="longevity"
                value={formData.longevity}
                onChange={handleInputChange}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Expected account usage duration</p>
            </div>

            <div>
              <label htmlFor="privateKey" className="block text-sm font-medium text-gray-700 mb-1">
                Private Key
              </label>
              <input
                type="password"
                id="privateKey"
                name="privateKey"
                value={formData.privateKey}
                onChange={handleInputChange}
                placeholder="Enter your wallet's private key"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-red-500 mt-1">⚠️ Your private key is only used for signing and is not stored</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">
                <strong>Wallet Address:</strong> {walletAddress}
              </p>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRegistering}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRegistering ? 'Registering...' : 'Register Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
