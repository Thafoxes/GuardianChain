import React, { useState } from 'react';
import { blockchainService } from '../services/blockchain';

const VerifierManagement: React.FC = () => {
  const [verifierAddress, setVerifierAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleAddVerifier = async () => {
    if (!verifierAddress || !verifierAddress.startsWith('0x')) {
      showMessage('Please enter a valid wallet address', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const txHash = await blockchainService.addVerifier(verifierAddress);
      showMessage(`Verifier added successfully! Transaction: ${txHash.slice(0, 10)}...`, 'success');
      setVerifierAddress('');
    } catch (error: any) {
      showMessage(`Failed to add verifier: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveVerifier = async () => {
    if (!verifierAddress || !verifierAddress.startsWith('0x')) {
      showMessage('Please enter a valid wallet address', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const txHash = await blockchainService.removeVerifier(verifierAddress);
      showMessage(`Verifier removed successfully! Transaction: ${txHash.slice(0, 10)}...`, 'success');
      setVerifierAddress('');
    } catch (error: any) {
      showMessage(`Failed to remove verifier: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        👮 Verifier Management
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Add or remove authorized verifiers who can update report statuses.
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="verifierAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Wallet Address
          </label>
          <input
            type="text"
            id="verifierAddress"
            value={verifierAddress}
            onChange={(e) => setVerifierAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleAddVerifier}
            disabled={isLoading || !verifierAddress}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              '✅ Add Verifier'
            )}
          </button>

          <button
            onClick={handleRemoveVerifier}
            disabled={isLoading || !verifierAddress}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              '❌ Remove Verifier'
            )}
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded-md ${
            messageType === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">How it works:</h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Verifiers can update report statuses (investigating, verified, rejected)</li>
            <li>• Only admin can add or remove verifiers</li>
            <li>• Admins are automatically verifiers</li>
            <li>• Changes are recorded on the blockchain</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VerifierManagement;
