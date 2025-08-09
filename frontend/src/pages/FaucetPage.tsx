import { useState, useEffect } from 'react';
import { Coins, Clock, Droplets, CheckCircle, AlertCircle, Gift } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { faucetApi, blockchainApi } from '../services/api';
import { ApiResponse } from '../types';
import toast from 'react-hot-toast';

const FaucetPage = () => {
  const { wallet } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [faucetStatus, setFaucetStatus] = useState({
    canClaim: true,
    timeLeft: 0,
    amount: '100',
    cooldownHours: 24
  });
  const [faucetInfo, setFaucetInfo] = useState({
    faucetAddress: '',
    balance: '0',
    faucetAmount: '100',
    cooldownHours: 24,
    tokenSymbol: 'GCR',
    tokenName: 'GuardianChain Reward Token'
  });
  const [userBalance, setUserBalance] = useState('0');

  // Fetch faucet status and info on component mount
  useEffect(() => {
    fetchFaucetInfo();
    if (wallet.isConnected && wallet.address) {
      fetchFaucetStatus();
      fetchUserBalance();
    }
  }, [wallet.isConnected, wallet.address]);

  const fetchFaucetInfo = async () => {
    try {
      const response = await faucetApi.getInfo();
      if (response && response.success) {
        setFaucetInfo(response.data);
      }
    } catch (error) {
      console.error('Error fetching faucet info:', error);
    }
  };

  const fetchFaucetStatus = async () => {
    if (!wallet.address) return;
    
    try {
      const response = await faucetApi.getStatus(wallet.address);
      if (response && response.success) {
        setFaucetStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching faucet status:', error);
    }
  };

  const fetchUserBalance = async () => {
    if (!wallet.address) return;
    
    try {
      const response = await blockchainApi.getTokenBalance(wallet.address);
      if (response && response.success) {
        setUserBalance(response.data.balance);
      }
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  };

  const handleClaimTokens = async () => {
    if (!wallet.isConnected || !wallet.address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!faucetStatus.canClaim) {
      toast.error(`You can claim tokens again in ${faucetStatus.timeLeft} hours`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await faucetApi.claimTokens(wallet.address);
      
      if (response && response.success) {
        toast.success(
          `Successfully claimed ${response.data.amount} GCR tokens!`,
          { duration: 5000 }
        );
        
        // Refresh status and balance
        await fetchFaucetStatus();
        await fetchUserBalance();
        await fetchFaucetInfo();
        
      } else {
        toast.error(response?.message || 'Failed to claim tokens');
      }
    } catch (error: any) {
      console.error('Error claiming tokens:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to claim tokens';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeLeft = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.ceil(hours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${Math.ceil(hours)} hour${Math.ceil(hours) !== 1 ? 's' : ''}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full">
              <Droplets className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GCR Token Faucet</h1>
          <p className="text-lg text-gray-600">
            Get free GCR tokens for testing on GuardianChain
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Claim Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Gift className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Claim Free Tokens</h2>
              <p className="text-gray-600">
                Get {faucetInfo.faucetAmount} {faucetInfo.tokenSymbol} tokens every {faucetInfo.cooldownHours} hours
              </p>
            </div>

            {/* Wallet Status */}
            {!wallet.isConnected ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                  <span className="text-yellow-800">Please connect your wallet to claim tokens</span>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <span className="text-green-800 font-medium">Wallet Connected</span>
                    <p className="text-green-600 text-sm">{wallet.address}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Current Balance */}
            {wallet.isConnected && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Coins className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="text-blue-800 font-medium">Your GCR Balance</span>
                  </div>
                  <span className="text-blue-900 font-bold text-lg">{userBalance} GCR</span>
                </div>
              </div>
            )}

            {/* Claim Status */}
            {wallet.isConnected && (
              <div className={`border rounded-lg p-4 mb-6 ${
                faucetStatus.canClaim 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center">
                  <Clock className={`w-5 h-5 mr-3 ${
                    faucetStatus.canClaim ? 'text-green-600' : 'text-orange-600'
                  }`} />
                  <div>
                    {faucetStatus.canClaim ? (
                      <span className="text-green-800 font-medium">Ready to claim!</span>
                    ) : (
                      <div>
                        <span className="text-orange-800 font-medium">Cooldown active</span>
                        <p className="text-orange-600 text-sm">
                          Next claim available in {formatTimeLeft(faucetStatus.timeLeft)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Claim Button */}
            <button
              onClick={handleClaimTokens}
              disabled={!wallet.isConnected || !faucetStatus.canClaim || isLoading}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
                !wallet.isConnected || !faucetStatus.canClaim || isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 shadow-lg'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Claiming...
                </div>
              ) : !wallet.isConnected ? (
                'Connect Wallet to Claim'
              ) : !faucetStatus.canClaim ? (
                `Claim Available in ${formatTimeLeft(faucetStatus.timeLeft)}`
              ) : (
                `Claim ${faucetInfo.faucetAmount} ${faucetInfo.tokenSymbol} Tokens`
              )}
            </button>
          </div>

          {/* Info Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Faucet Information</h3>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Token Name</span>
                <span className="font-semibold text-gray-900">{faucetInfo.tokenName}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Token Symbol</span>
                <span className="font-semibold text-gray-900">{faucetInfo.tokenSymbol}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Claim Amount</span>
                <span className="font-semibold text-gray-900">{faucetInfo.faucetAmount} {faucetInfo.tokenSymbol}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Cooldown Period</span>
                <span className="font-semibold text-gray-900">{faucetInfo.cooldownHours} hours</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Faucet Balance</span>
                <span className="font-semibold text-gray-900">{faucetInfo.balance} {faucetInfo.tokenSymbol}</span>
              </div>
            </div>

            {/* Usage Instructions */}
            <div className="mt-8 p-4 bg-indigo-50 rounded-lg">
              <h4 className="font-semibold text-indigo-900 mb-2">How to use:</h4>
              <ol className="text-sm text-indigo-800 space-y-1">
                <li>1. Connect your MetaMask wallet</li>
                <li>2. Make sure you're on Oasis Sapphire Testnet</li>
                <li>3. Click "Claim" to receive 100 GCR tokens</li>
                <li>4. Use tokens to stake and verify your account</li>
                <li>5. Wait 24 hours before claiming again</li>
              </ol>
            </div>

            {/* Network Warning */}
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Make sure you're connected to the Oasis Sapphire Testnet. 
                Tokens claimed on other networks will not work with GuardianChain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaucetPage;
