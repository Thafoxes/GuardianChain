import { ethers } from 'ethers';
import { wrap } from '@oasisprotocol/sapphire-paratime';
import { logger } from '../utils/logger.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import contract ABIs using JSON.parse and readFileSync
const RewardTokenABI = JSON.parse(readFileSync(join(__dirname, '../../contracts/RewardToken.json'), 'utf8'));
const UserVerificationABI = JSON.parse(readFileSync(join(__dirname, '../../contracts/UserVerification.json'), 'utf8'));
const ReportContractABI = JSON.parse(readFileSync(join(__dirname, '../../contracts/ReportContract.json'), 'utf8'));

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contracts = {};
    this.networkConfig = {};
    this.init();
  }

  async init() {
    try {
      // Network configuration
      this.networkConfig = {
        localnet: {
          url: 'http://localhost:8545',
          chainId: 23293,
          name: 'Sapphire Localnet'
        },
        testnet: {
          url: 'https://testnet.sapphire.oasis.dev',
          chainId: 0x5aff,
          name: 'Sapphire Testnet'
        },
        mainnet: {
          url: 'https://sapphire.oasis.io',
          chainId: 0x5afe,
          name: 'Sapphire Mainnet'
        }
      };

      const network = process.env.NETWORK || 'localnet';
      const config = this.networkConfig[network];

      if (!config) {
        throw new Error(`Unsupported network: ${network}`);
      }

      // Create provider
      this.provider = new ethers.JsonRpcProvider(config.url);
      
      // Wrap provider for Sapphire
      this.provider = wrap(this.provider);

      // Load contract addresses from environment
      const contractAddresses = {
        RewardToken: process.env.REWARD_TOKEN_ADDRESS,
        UserVerification: process.env.USER_VERIFICATION_ADDRESS,
        ReportContract: process.env.REPORT_CONTRACT_ADDRESS
      };

      // Initialize contracts
      if (contractAddresses.RewardToken) {
        this.contracts.RewardToken = new ethers.Contract(
          contractAddresses.RewardToken,
          RewardTokenABI.abi,
          this.provider
        );
      }

      if (contractAddresses.UserVerification) {
        this.contracts.UserVerification = new ethers.Contract(
          contractAddresses.UserVerification,
          UserVerificationABI.abi,
          this.provider
        );
      }

      if (contractAddresses.ReportContract) {
        this.contracts.ReportContract = new ethers.Contract(
          contractAddresses.ReportContract,
          ReportContractABI.abi,
          this.provider
        );
      }

      logger.info(`🔗 Connected to ${config.name} at ${config.url}`);
      logger.info(`📋 Contracts loaded: ${Object.keys(this.contracts).join(', ')}`);

    } catch (error) {
      logger.error('Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  // Get provider for creating signers
  getProvider() {
    return this.provider;
  }

  // Get contract instance
  getContract(name) {
    if (!this.contracts[name]) {
      throw new Error(`Contract ${name} not found`);
    }
    return this.contracts[name];
  }

  // Create signer from private key
  createSigner(privateKey) {
    if (!privateKey) {
      throw new Error('Private key is required');
    }
    return new ethers.Wallet(privateKey, this.provider);
  }

  // Get contract with signer
  getContractWithSigner(name, signer) {
    const contract = this.getContract(name);
    return contract.connect(signer);
  }

  // Utility methods for frontend
  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      return {
        name: network.name,
        chainId: Number(network.chainId),
        blockNumber,
        contractAddresses: {
          RewardToken: this.contracts.RewardToken?.target,
          UserVerification: this.contracts.UserVerification?.target,
          ReportContract: this.contracts.ReportContract?.target
        }
      };
    } catch (error) {
      logger.error('Failed to get network info:', error);
      throw error;
    }
  }

  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      return {
        gasPrice: feeData.gasPrice?.toString(),
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString()
      };
    } catch (error) {
      logger.error('Failed to get gas price:', error);
      throw error;
    }
  }

  async getBalance(address) {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error(`Failed to get balance for ${address}:`, error);
      throw error;
    }
  }

  // Token balance
  async getTokenBalance(address) {
    try {
      if (!this.contracts.RewardToken) {
        throw new Error('RewardToken contract not loaded');
      }
      
      const balance = await this.contracts.RewardToken.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error(`Failed to get token balance for ${address}:`, error);
      throw error;
    }
  }

  // Validate address
  isValidAddress(address) {
    return ethers.isAddress(address);
  }

  // Format transaction for frontend
  formatTransaction(tx) {
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value ? ethers.formatEther(tx.value) : '0',
      gasLimit: tx.gasLimit?.toString(),
      gasPrice: tx.gasPrice?.toString(),
      nonce: tx.nonce,
      blockNumber: tx.blockNumber,
      blockHash: tx.blockHash,
      transactionIndex: tx.transactionIndex,
      confirmations: tx.confirmations
    };
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

export default blockchainService;
