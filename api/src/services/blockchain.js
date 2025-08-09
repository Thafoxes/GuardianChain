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
    this.initialized = false;
    // Don't auto-initialize, wait for manual call
  }

  async init() {
    try {
      if (this.initialized) {
        logger.info('🔄 Blockchain service already initialized');
        return;
      }

      // Network configuration
      this.networkConfig = {
        localnet: {
          url: 'http://localhost:8545',
          chainId: 23293,
          name: 'Sapphire Localnet'
        },
        testnet: {
          url: 'https://testnet.sapphire.oasis.io',
          chainId: 23295,
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

      // Use custom RPC URL if provided, otherwise use default network config
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || config.url;
      logger.info(`🌐 Using RPC URL: ${rpcUrl} (network: ${network})`);

      // Create provider
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Wrap provider for Sapphire
      this.provider = wrap(this.provider);

      // Load contract addresses from environment
      const contractAddresses = {
        RewardToken: process.env.REWARD_TOKEN_ADDRESS,
        UserVerification: process.env.USER_VERIFICATION_ADDRESS,
        ReportContract: process.env.REPORT_CONTRACT_ADDRESS
      };

      // Debug logging
      logger.info('🔍 Environment variables:');
      logger.info(`NETWORK: ${process.env.NETWORK}`);
      logger.info(`REWARD_TOKEN_ADDRESS: ${process.env.REWARD_TOKEN_ADDRESS}`);
      logger.info(`USER_VERIFICATION_ADDRESS: ${process.env.USER_VERIFICATION_ADDRESS}`);
      logger.info(`REPORT_CONTRACT_ADDRESS: ${process.env.REPORT_CONTRACT_ADDRESS}`);

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

      this.initialized = true;

    } catch (error) {
      logger.error('Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  // Ensure service is initialized before operations
  async ensureInitialized() {
    if (!this.initialized) {
      await this.init();
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

  async checkUserRegisteration(address){
    try{
      await this.ensureInitialized();
      const contract = this.getContract('UserVerification');

      const isRegistered = await contract.isRegistered(address);
      const isVerified = await contract.isUserVerified(address);

      return {
        isRegistered,
        isVerified,
        address
      };
    }catch (error){
      logger.error(`failed to check user registration for ${address}: `, error);
      throw error;
    }
  }

  async registerUser(address, privateKey){
    try{
      await this.ensureInitialized();
      const signer = this.createSigner(privateKey);
      const contract = this.getContractWithSigner('UserVerification', signer);

      const tx = await contract.registerUser(
        `user_${Date.now()}`, //identifier
        `1_year` //longevity
      );
      const receipt = await tx.wait();

      return this.formatTransaction(receipt);
    }catch (error){
      logger.error(`failed to register user as verified ${address}: `, error);
      throw error;
    }
  }

  async verifyUser(userAddress, adminPrivateKey){
    try{
      await this.ensureInitialized();
      const adminSigner = this.createSigner(adminPrivateKey);
      const contract = this.getContractWithSigner('UserVerification', adminSigner);

      const tx = await contract.verifyUser(userAddress);
      const receipt = await tx.wait();

      return this.formatTransaction(receipt);
    }catch (error){
      logger.error(`failed to verify user ${address}: `, error);
      throw error;
    }
  }

  async transferTokens(fromPrivateKey, toAddress, amount){
    try{
      await this.ensureInitialized();
      const signer = this.createSigner(fromPrivateKey);
      const contract = this.getContractWithSigner(`RewardToken`, signer);

      const amountWei = ethers.parseEther(amount.toString());
      const tx = await contract.transfer(toAddress, amountWei);
      const receipt = await tx.wait();

      return this.formatTransaction(receipt);
    }catch(error){
      logger.error(`failed to transfer token: `, error);
      throw error;
    }
  }

  //monitor transfer events for auto-verification
  async monitorStakeTransfers(treasuryAddress, callback){
    try{
        await this.ensureInitialized();
        const contract = this.getContract('RewardToken');
        
        // Listen for Transfer events TO the treasury
        const filter = contract.filters.Transfer(null, treasuryAddress);

        contract.on(filter, async (from, to, amount, event) => {
        try {
            const amountEther = ethers.formatEther(amount);
            logger.info(`💰 Stake detected: ${from} → ${to} (${amountEther} GCR)`);
            
            // Call callback with stake information
            if (callback) {
              await callback({
                from,
                to,
                amount: amountEther,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber
              });
            }
          } catch (error) {
            logger.error('Error processing stake transfer:', error);
          }
        });

        logger.info(`👂 Monitoring stake transfers to treasury: ${treasuryAddress}`);

    }catch(error){
      logger.error('Error processing stake transfer:', error);
    }
  }



}



// Create singleton instance
const blockchainService = new BlockchainService();

export default blockchainService;
