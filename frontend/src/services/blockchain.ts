import { ethers } from 'ethers';
import { wrap } from '@oasisprotocol/sapphire-paratime';

// Contract ABI for ReportContract (only the functions we need)
const REPORT_CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "reportId", "type": "uint256"}],
    "name": "getReportContent",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "reportId", "type": "uint256"}],
    "name": "getReportInfo",
    "outputs": [
      {"internalType": "uint256", "name": "id", "type": "uint256"},
      {"internalType": "address", "name": "reporter", "type": "address"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "uint8", "name": "status", "type": "uint8"},
      {"internalType": "address", "name": "verifiedBy", "type": "address"},
      {"internalType": "uint256", "name": "verificationTimestamp", "type": "uint256"},
      {"internalType": "bytes32", "name": "contentHash", "type": "bytes32"},
      {"internalType": "bool", "name": "rewardClaimed", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "reportId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "accessor", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "content", "type": "string"}
    ],
    "name": "ContentRetrieved",
    "type": "event"
  }
];

// Sapphire Localnet configuration
const SAPPHIRE_LOCALNET = {
  chainId: '0x5AFD', // 23293 in hex
  chainName: 'Sapphire Localnet',
  nativeCurrency: {
    name: 'TEST',
    symbol: 'TEST',
    decimals: 18,
  },
  rpcUrls: ['http://localhost:8545'],
  blockExplorerUrls: ['http://localhost:8545'],
};

// Contract address from deployment
const REPORT_CONTRACT_ADDRESS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  async connectWallet(): Promise<{ address: string; chainId: string }> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      console.log('🔗 Connecting to wallet...');
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create provider and wrap for Sapphire
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.provider = wrap(this.provider);
      
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();
      
      // Get current chain ID
      const network = await this.provider.getNetwork();
      
      console.log('🔗 Wallet connected:', { 
        address, 
        chainId: network.chainId.toString(),
        networkName: network.name 
      });
      
      return {
        address,
        chainId: network.chainId.toString()
      };
    } catch (error: any) {
      console.error('🔗 Error connecting wallet:', error);
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  }

  async switchToSapphireLocalnet(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      // Try to switch to Sapphire Localnet
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SAPPHIRE_LOCALNET.chainId }],
      });
    } catch (switchError: any) {
      // If the chain doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SAPPHIRE_LOCALNET],
          });
        } catch (addError: any) {
          throw new Error(`Failed to add Sapphire Localnet: ${addError.message}`);
        }
      } else {
        throw new Error(`Failed to switch to Sapphire Localnet: ${switchError.message}`);
      }
    }
  }

  async getReportContent(reportId: number): Promise<{
    content: string;
    title?: string;
    evidence?: string;
    category?: string;
    severity?: string;
    anonymous?: boolean;
  }> {
    if (!this.signer) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    try {
      console.log('📄 Getting report content for ID:', reportId);
      
      // Create contract instance
      const contract = new ethers.Contract(
        REPORT_CONTRACT_ADDRESS,
        REPORT_CONTRACT_ABI,
        this.signer
      );

      // First check if the report exists
      try {
        console.log('📄 Checking if report exists...');
        const reportInfo = await contract.getReportInfo(reportId);
        console.log('📄 Report info:', reportInfo);
      } catch (infoError: any) {
        console.error('📄 Report info error:', infoError);
        throw new Error('Report does not exist or you do not have permission to access it.');
      }

      // Call getReportContent function
      console.log('📄 Calling getReportContent...');
      const tx = await contract.getReportContent(reportId);
      console.log('📄 Transaction sent:', tx);
      
      const receipt = await tx.wait();
      console.log('📄 Transaction receipt:', receipt);

      // Extract content from ContentRetrieved event
      let decryptedContent = '';
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          if (parsedLog && parsedLog.name === 'ContentRetrieved') {
            decryptedContent = parsedLog.args.content;
            console.log('📄 Content retrieved from event:', decryptedContent);
            break;
          }
        } catch (parseError) {
          // Skip logs that don't match our interface
          continue;
        }
      }

      if (!decryptedContent) {
        throw new Error('Failed to retrieve decrypted content from transaction');
      }

      // Try to parse as JSON (if it was stored as structured data)
      try {
        const parsedContent = JSON.parse(decryptedContent);
        return {
          content: parsedContent.content || decryptedContent,
          title: parsedContent.title,
          evidence: parsedContent.evidence,
          category: parsedContent.category,
          severity: parsedContent.severity,
          anonymous: parsedContent.anonymous
        };
      } catch {
        // If not JSON, return as plain text
        return {
          content: decryptedContent
        };
      }

    } catch (error: any) {
      console.error('📄 Error getting report content:', error);
      
      if (error.message.includes('Not authorized')) {
        throw new Error('You are not authorized to view this report content. Only the reporter or authorized verifiers can access encrypted content.');
      } else if (error.message.includes('Report does not exist')) {
        throw new Error('Report not found.');
      } else if (error.message.includes('user rejected')) {
        throw new Error('Transaction was rejected by user.');
      } else if (error.message.includes('execution reverted')) {
        // More specific error for reverted transactions
        throw new Error('Transaction failed. This could mean: (1) Report does not exist, (2) You are not authorized to view this content, or (3) The report ID is invalid.');
      } else {
        throw new Error(`Failed to decrypt report content: ${error.message}`);
      }
    }
  }

  isConnected(): boolean {
    return this.provider !== null && this.signer !== null;
  }

  async getCurrentAccount(): Promise<string | null> {
    if (!this.signer) return null;
    
    try {
      return await this.signer.getAddress();
    } catch {
      return null;
    }
  }

  async isCorrectNetwork(): Promise<boolean> {
    if (!this.provider) {
      console.log('🔍 Network check: No provider available');
      return false;
    }
    
    try {
      const network = await this.provider.getNetwork();
      console.log('🔍 Current network:', { 
        chainId: network.chainId.toString(), 
        expected: '23293',
        matches: network.chainId.toString() === '23293'
      });
      return network.chainId.toString() === '23293'; // Sapphire Localnet
    } catch (error) {
      console.error('🔍 Network check error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
