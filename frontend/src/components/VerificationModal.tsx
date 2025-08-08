import React, { useState } from 'react';
import { X, AlertCircle, UserCheck, Shield } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsRegistering(true);

    try {
      await userApi.registerUser({
        identifier: 'auto_user',
        longevity: 1,
        walletAddress
      });

      toast.success('Registration and verification successful! You can now submit reports.');
      onVerificationComplete();
      onClose();
    } catch (error: any) {
      console.error('Registration failed:', error);
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
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
            <h3 className="text-sm font-medium text-gray-900 mb-3">Simplified Verification Process:</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
                <span className="text-sm text-gray-600">Click "Verify Account" below</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-green-600">2</span>
                </div>
                <span className="text-sm text-gray-600">Instant verification by admin</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-600">Submit reports immediately</span>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded-full w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded-full w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded-full w-5/6"></div>
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
                {isRegistering ? 'Verifying...' : 'Verify Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
