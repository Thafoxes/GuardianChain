import { ethers } from 'ethers';
import { wrap } from '@oasisprotocol/sapphire-paratime';

// Contract ABI for ReportContract (only the functions we need)
const REPORT_CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "string", "name": "content", "type": "string"}],
    "name": "submitReport",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalReports",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
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
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "reportId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "reporter", "type": "address"},
      {"indexed": false, "internalType": "bytes32", "name": "contentHash", "type": "bytes32"}
    ],
    "name": "ReportSubmitted",
    "type": "event"
  }
];

// Sapphire Testnet configuration
const SAPPHIRE_TESTNET = {
  chainId: '0x5AFF', // 23295 in hex
  chainName: 'Sapphire Testnet',
  nativeCurrency: {
    name: 'TEST',
    symbol: 'TEST',
    decimals: 18,
  },
  rpcUrls: ['https://testnet.sapphire.oasis.io'],
  blockExplorerUrls: ['https://testnet.explorer.sapphire.oasis.io'],
};


// Contract addresses from environment variables
const REPORT_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS_REPORT_CONTRACT;
const USER_VERIFICATION_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS_USER_VERIFICATION;

// Validate that required environment variables are set
if (!REPORT_CONTRACT_ADDRESS) {
  throw new Error('VITE_CONTRACT_ADDRESS_REPORT_CONTRACT is not set in environment variables');
}
if (!USER_VERIFICATION_ADDRESS) {
  throw new Error('VITE_CONTRACT_ADDRESS_USER_VERIFICATION is not set in environment variables');
}

console.log('🔧 Contract addresses loaded from environment:', {
  reportContract: REPORT_CONTRACT_ADDRESS,
  userVerification: USER_VERIFICATION_ADDRESS
});

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

  async initializeFromExistingProvider(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      // Create provider and wrap for Sapphire
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.provider = wrap(this.provider);
      
      // Get signer
      this.signer = await this.provider.getSigner();
      
      console.log('🔗 Blockchain service initialized with existing provider');
    } catch (error: any) {
      console.error('🔗 Error initializing blockchain service:', error);
      throw new Error(`Failed to initialize blockchain service: ${error.message}`);
    }
  }

  // Update the switch network method
  async switchToSapphireTestnet(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      // Try to switch to Sapphire Testnet
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SAPPHIRE_TESTNET.chainId }],
      });
    } catch (switchError: any) {
      // If the chain doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SAPPHIRE_TESTNET],
          });
        } catch (addError: any) {
          throw new Error(`Failed to add Sapphire Testnet: ${addError.message}`);
        }
      } else {
        throw new Error(`Failed to switch to Sapphire Testnet: ${switchError.message}`);
      }
    }
  }

  async checkUserVerification(userAddress: string): Promise<boolean> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const userVerificationABI = [
        {
          "inputs": [{"internalType": "address", "name": "userAddress", "type": "address"}],
          "name": "isUserVerified",
          "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
          "stateMutability": "view",
          "type": "function"
        }
      ];

      const userContract = new ethers.Contract(
        USER_VERIFICATION_ADDRESS,
        userVerificationABI,
        this.provider
      );

      const isVerified = await userContract.isUserVerified(userAddress);
      console.log('🔍 User verification status:', { userAddress, isVerified, contractAddress: USER_VERIFICATION_ADDRESS });
      
      return isVerified;
    } catch (error: any) {
      console.error('🔍 Error checking verification:', error);
      return false;
    }
  }

  async getUserRoles(userAddress: string): Promise<{
    isAdmin: boolean;
    isVerifier: boolean;
    isVerified: boolean;
    role: 'ADMIN' | 'VERIFIER' | 'VERIFIED' | 'USER';
  }> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const userVerificationABI = [
        {
          "inputs": [{"internalType": "address", "name": "userAddress", "type": "address"}],
          "name": "isUserVerified",
          "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [{"internalType": "address", "name": "verifier", "type": "address"}],
          "name": "isVerifier",
          "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "admin",
          "outputs": [{"internalType": "address", "name": "", "type": "address"}],
          "stateMutability": "view",
          "type": "function"
        }
      ];

      const userContract = new ethers.Contract(
        USER_VERIFICATION_ADDRESS,
        userVerificationABI,
        this.provider
      );

      // Check all roles in parallel
      const [isVerified, isVerifier, adminAddress] = await Promise.all([
        userContract.isUserVerified(userAddress).catch(() => false),
        userContract.isVerifier(userAddress).catch(() => false),
        userContract.admin().catch(() => '0x0000000000000000000000000000000000000000')
      ]);

      const isAdmin = adminAddress.toLowerCase() === userAddress.toLowerCase();

      // Determine primary role (highest priority first)
      let role: 'ADMIN' | 'VERIFIER' | 'VERIFIED' | 'USER' = 'USER';
      if (isAdmin) {
        role = 'ADMIN';
      } else if (isVerifier) {
        role = 'VERIFIER';
      } else if (isVerified) {
        role = 'VERIFIED';
      }

      console.log('🔍 User roles:', { 
        userAddress, 
        isAdmin, 
        isVerifier, 
        isVerified, 
        role,
        adminAddress,
        contractAddress: USER_VERIFICATION_ADDRESS 
      });
      
      return { isAdmin, isVerifier, isVerified, role };
    } catch (error: any) {
      console.error('🔍 Error checking user roles:', error);
      return { isAdmin: false, isVerifier: false, isVerified: false, role: 'USER' };
    }
  }

  /**
   * Submit a new report to the blockchain
   */
  async submitReport(reportData: {
    title: string;
    content: string;
    evidence: string;
    category: string;
    severity: string;
    anonymous: boolean;
    submittedBy: string;
  }): Promise<string> {
    if (!this.signer || !this.provider) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    // Prepare the content as JSON string (contract will handle encryption)
    const reportContent = JSON.stringify(reportData);
    
    console.log('📝 Preparing report content for blockchain submission:', {
      contentLength: reportContent.length,
      title: reportData.title,
      category: reportData.category
    });

  try {
    console.log('📝 Submitting report to blockchain...');

    // Get user address
    const userAddress = await this.signer.getAddress();
    console.log('📝 Submitting from address:', userAddress);

     // CHECK 1: Verify user is verified before submitting
    console.log('🔍 Checking user verification status...');
    const isVerified = await this.checkUserVerification(userAddress);
    
    if (!isVerified) {
      throw new Error('You must be verified before submitting reports. Please complete the verification process first.');
    }
    
    console.log('✅ User is verified, proceeding with submission');

    // Get contract with signer
    const contract = new ethers.Contract(
      REPORT_CONTRACT_ADDRESS,
      REPORT_CONTRACT_ABI,
      this.signer
    );

     // CHECK 2: Verify contract is properly deployed
    try {
      const totalReports = await contract.getTotalReports();
      console.log('📊 Current total reports:', totalReports.toString());
    } catch (contractError: any) {
      console.error('📝 Contract connection error:', contractError);
      throw new Error('Contract not properly deployed or accessible. Please check your network connection.');
    }

    // Check network to determine transaction type
    const network = await this.provider.getNetwork();
    const chainId = network.chainId;
    
    console.log('Network info:', { 
      chainId: chainId.toString(), 
      name: network.name,
      isSapphireTestnet: chainId === 23295n 
    });

    // Submit report with minimal transaction options for better compatibility
    console.log('📝 Calling contract.submitReport with content:', reportContent.substring(0, 100) + '...');
    
    try {
      // First try without custom gas settings to let MetaMask estimate
      const tx = await contract.submitReport(reportContent);
      console.log('📝 Report submitted, transaction hash:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log('✅ Report submission confirmed');
        return tx.hash;
      } else {
        throw new Error('Transaction failed');
      }
    } catch (gasError: any) {
      console.log('⚠️ Auto gas estimation failed, trying manual gas settings:', gasError.message);
      
      // Fallback: try with manual gas settings
      const txOptions: any = {
        gasLimit: 300000, // Reduced gas limit
      };
      
      if (chainId === 23295n) { // Sapphire Testnet
        txOptions.gasPrice = ethers.parseUnits('1', 'gwei'); // Lower gas price
        console.log('Using manual gas settings for Sapphire Testnet');
      }
      
      console.log('Fallback transaction options:', txOptions);
      const tx = await contract.submitReport(reportContent, txOptions);
      
      console.log('📝 Report submitted (fallback), transaction hash:', tx.hash);
      
      // Wait for confirmation  
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log('✅ Report submission confirmed (fallback)');
        return tx.hash;
      } else {
        throw new Error('Transaction failed (fallback)');
      }
    }

  } catch (error: any) {
    console.error('📝 Error submitting report:', error);
    
    if (error.message.includes('User must be verified')) {
      throw new Error('You must be verified before submitting reports. Please complete the verification process first.');
    } else if (error.message.includes('user rejected')) {
      throw new Error('Transaction was rejected by user.');
    } else if (error.message.includes('insufficient funds')) {
      throw new Error('Insufficient funds for transaction fees.');
    } else if (error.message.includes('execution reverted')) {
      throw new Error('Transaction failed. Please ensure you are verified and have sufficient funds.');
    } else if (error.message.includes('EIP-1559')) {
      throw new Error('Network transaction format issue. Please try again.');
    } else {
      throw new Error(`Failed to submit report: ${error.message}`);
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
        expected: '23295',
        matches: network.chainId.toString() === '23295'
      });
      return network.chainId.toString() === '23295'; // Sapphire Testnet
    } catch (error) {
      console.error('🔍 Network check error:', error);
      return false;
    }
  }

  // NEW: Get user reports from blockchain
  async getUserReports(userAddress?: string): Promise<any[]> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const address = userAddress || (this.signer ? await this.signer.getAddress() : null);
      if (!address) {
        throw new Error('No wallet address available');
      }

      console.log('📋 Fetching user reports for:', address);

      // Get contract instance
      const contract = new ethers.Contract(
        REPORT_CONTRACT_ADDRESS,
        [
          {
            "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
            "name": "getUserReports",
            "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
            "stateMutability": "view",
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
          }
        ],
        this.provider
      );

      // Get user's report IDs
      const reportIds = await contract.getUserReports(address);
      console.log('📋 User report IDs:', reportIds.map((id: any) => id.toString()));

      // Fetch detailed info for each report
      const reports = [];
      for (const reportId of reportIds) {
        try {
          const reportInfo = await contract.getReportInfo(reportId);
          reports.push({
            id: Number(reportInfo.id),
            reporter: reportInfo.reporter,
            timestamp: Number(reportInfo.timestamp), // Keep as number for sorting
            status: this.getStatusString(Number(reportInfo.status)),
            verifiedBy: reportInfo.verifiedBy,
            verificationTimestamp: Number(reportInfo.verificationTimestamp),
            contentHash: reportInfo.contentHash,
            rewardClaimed: reportInfo.rewardClaimed,
            title: `Report #${Number(reportInfo.id)}`,
            category: 'general',
            severity: 'medium'
          });
        } catch (error) {
          console.warn(`Failed to fetch report ${reportId}:`, error);
        }
      }

      // Sort by timestamp (newest first)
      reports.sort((a, b) => b.timestamp - a.timestamp);
      
      console.log('📋 Fetched', reports.length, 'reports for user');
      return reports;
    } catch (error: any) {
      console.error('📋 Error fetching user reports:', error);
      throw new Error(`Failed to fetch user reports: ${error.message}`);
    }
  }

  // NEW: Get all reports for admin view
  async getAllReports(limit: number = 50): Promise<any[]> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      console.log('📋 Fetching all reports (admin view)...');

      const contract = new ethers.Contract(
        REPORT_CONTRACT_ADDRESS,
        [
          {
            "inputs": [],
            "name": "getTotalReports",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
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
          }
        ],
        this.provider
      );

      const totalReports = await contract.getTotalReports();
      const totalNum = Number(totalReports);
      console.log('📊 Total reports on blockchain:', totalNum);

      const reports = [];
      const start = Math.max(1, totalNum - limit + 1);
      
      for (let i = totalNum; i >= start; i--) {
        try {
          const reportInfo = await contract.getReportInfo(i);
          reports.push({
            id: Number(reportInfo.id),
            reporter: reportInfo.reporter,
            timestamp: Number(reportInfo.timestamp), // Keep as number for sorting
            status: this.getStatusString(Number(reportInfo.status)),
            verifiedBy: reportInfo.verifiedBy,
            verificationTimestamp: Number(reportInfo.verificationTimestamp),
            contentHash: reportInfo.contentHash,
            rewardClaimed: reportInfo.rewardClaimed,
            title: `Report #${Number(reportInfo.id)}`,
            category: 'general',
            severity: 'medium'
          });
        } catch (error) {
          console.warn(`Failed to fetch report ${i}:`, error);
        }
      }

      console.log('📋 Fetched', reports.length, 'reports (admin view)');
      return reports;
    } catch (error: any) {
      console.error('📋 Error fetching all reports:', error);
      throw new Error(`Failed to fetch reports: ${error.message}`);
    }
  }

  // NEW: Admin function to update report status
  async updateReportStatus(reportId: number, status: number): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('📝 Updating report status:', { reportId, status });

      const contract = new ethers.Contract(
        REPORT_CONTRACT_ADDRESS,
        [
          {
            "inputs": [
              {"internalType": "uint256", "name": "reportId", "type": "uint256"},
              {"internalType": "uint8", "name": "newStatus", "type": "uint8"}
            ],
            "name": "updateReportStatus",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        this.signer
      );

      const tx = await contract.updateReportStatus(reportId, status);
      await tx.wait();
      
      console.log('✅ Report status updated:', tx.hash);
      return tx.hash;
    } catch (error: any) {
      console.error('📝 Error updating report status:', error);
      throw new Error(`Failed to update report status: ${error.message}`);
    }
  }

  // NEW: Claim reward function
  async claimReward(reportId: number): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('💰 Claiming reward for report:', reportId);

      const contract = new ethers.Contract(
        REPORT_CONTRACT_ADDRESS,
        [
          {
            "inputs": [{"internalType": "uint256", "name": "reportId", "type": "uint256"}],
            "name": "claimReward",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        this.signer
      );

      const tx = await contract.claimReward(reportId);
      await tx.wait();
      
      console.log('✅ Reward claimed:', tx.hash);
      return tx.hash;
    } catch (error: any) {
      console.error('💰 Error claiming reward:', error);
      throw new Error(`Failed to claim reward: ${error.message}`);
    }
  }

  // Helper function to convert status number to string
  private getStatusString(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'submitted',    // Pending
      1: 'investigating', // Investigating
      2: 'verified',     // Verified
      3: 'rejected',     // Rejected
      4: 'closed'        // Closed
    };
    return statusMap[status] || 'unknown';
  }

  // Helper function to convert status string to number
  getStatusNumber(status: string): number {
    const statusMap: { [key: string]: number } = {
      'submitted': 0,    // Pending
      'investigating': 1, // Investigating
      'verified': 2,     // Verified
      'rejected': 3,     // Rejected
      'closed': 4        // Closed
    };
    return statusMap[status] ?? 0;
  }

  // Check if user is authorized verifier (admin)
  async isAuthorizedVerifier(address?: string): Promise<boolean> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const userAddress = address || (this.signer ? await this.signer.getAddress() : null);
      if (!userAddress) return false;

      const contract = new ethers.Contract(
        REPORT_CONTRACT_ADDRESS,
        [
          {
            "inputs": [{"internalType": "address", "name": "", "type": "address"}],
            "name": "authorizedVerifiers",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        this.provider
      );

      return await contract.authorizedVerifiers(userAddress);
    } catch (error) {
      console.error('Error checking if user is authorized verifier:', error);
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
