import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers, BrowserProvider } from 'ethers';
import toast from 'react-hot-toast';
import { WalletState } from '../types';

interface WalletContextType {
  wallet: WalletState;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signMessage: (message: string) => Promise<string>;
  switchToSapphire: () => Promise<void>;
  isCorrectNetwork: () => boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    balance: null,
    tokenBalance: null,
  });

  // Sapphire network configuration
  const SAPPHIRE_NETWORKS = {
    localnet: {
      chainId: 23293, // Match the actual chain ID from your blockchain (0x5afd)
      chainName: 'Sapphire Localnet',
      rpcUrls: ['http://localhost:8545'],
      nativeCurrency: {
        name: 'TEST',
        symbol: 'TEST',
        decimals: 18,
      },
      blockExplorerUrls: [],
    },
    testnet: {
      chainId: 0x5aff,
      chainName: 'Sapphire Testnet',
      rpcUrls: ['https://testnet.sapphire.oasis.dev'],
      nativeCurrency: {
        name: 'TEST',
        symbol: 'TEST',
        decimals: 18,
      },
      blockExplorerUrls: ['https://testnet.explorer.sapphire.oasis.dev'],
    },
    mainnet: {
      chainId: 0x5afe,
      chainName: 'Sapphire Mainnet',
      rpcUrls: ['https://sapphire.oasis.io'],
      nativeCurrency: {
        name: 'ROSE',
        symbol: 'ROSE',
        decimals: 18,
      },
      blockExplorerUrls: ['https://explorer.sapphire.oasis.io'],
    },
  };

  const TARGET_NETWORK = SAPPHIRE_NETWORKS.localnet; // Change for different environments

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Get current network info
  const isCorrectNetwork = (): boolean => {
    return wallet.chainId === TARGET_NETWORK.chainId;
  };

  // Switch to Sapphire network
  const switchToSapphire = async (): Promise<void> => {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed');
    }

    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${TARGET_NETWORK.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          // Add the network to MetaMask
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${TARGET_NETWORK.chainId.toString(16)}`,
              chainName: TARGET_NETWORK.chainName,
              rpcUrls: TARGET_NETWORK.rpcUrls,
              nativeCurrency: TARGET_NETWORK.nativeCurrency,
              blockExplorerUrls: TARGET_NETWORK.blockExplorerUrls || [],
            }],
          });
          toast.success('Sapphire network added to MetaMask!');
        } catch (addError) {
          console.error('Failed to add network:', addError);
          throw new Error('Failed to add Sapphire network to MetaMask');
        }
      } else {
        throw switchError;
      }
    }
  };

  // Connect wallet
  const connectWallet = async (): Promise<void> => {
    if (!isMetaMaskInstalled()) {
      toast.error('Please install MetaMask to continue');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);

      setWallet({
        isConnected: true,
        address,
        chainId: Number(network.chainId),
        balance: ethers.formatEther(balance),
        tokenBalance: null, // Will be fetched separately
      });

      // Check if on correct network
      if (Number(network.chainId) !== TARGET_NETWORK.chainId) {
        toast.error('Please switch to Sapphire network');
        await switchToSapphire();
      } else {
        toast.success('Wallet connected successfully!');
      }

    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
    }
  };

  // Disconnect wallet
  const disconnectWallet = (): void => {
    setWallet({
      isConnected: false,
      address: null,
      chainId: null,
      balance: null,
      tokenBalance: null,
    });
    toast.success('Wallet disconnected');
  };

  // Sign message
  const signMessage = async (message: string): Promise<string> => {
    if (!wallet.isConnected || !wallet.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error: any) {
      console.error('Failed to sign message:', error);
      throw new Error('Failed to sign message');
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== wallet.address) {
        // Account changed, reconnect
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      // Reload the page when chain changes
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [wallet.address]);

  // Check if already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) return;

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });

        if (accounts.length > 0) {
          // Auto-connect if previously connected
          await connectWallet();
        }
      } catch (error) {
        console.error('Failed to check connection:', error);
      }
    };

    checkConnection();
  }, []);

  const value: WalletContextType = {
    wallet,
    connectWallet,
    disconnectWallet,
    signMessage,
    switchToSapphire,
    isCorrectNetwork,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Extend window object for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
