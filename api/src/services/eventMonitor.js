import { ethers } from 'ethers';
import blockchainService from './blockchain.js';
import { logger } from '../utils/logger.js';

class EventMonitorService {
  constructor() {
    this.monitoring = false;
    this.eventListeners = new Map();
    this.backendSigner = null;
  }

  async init() {
    try {
      // Initialize backend signer for automated operations
      const backendPrivateKey = process.env.BACKEND_PRIVATE_KEY || process.env.LOCALNET_PRIVATE_KEY_VERIFIER;
      if (!backendPrivateKey) {
        logger.warn('⚠️ Backend private key not configured - automated reward distribution disabled');
        return;
      }

      this.backendSigner = blockchainService.createSigner(backendPrivateKey);
      logger.info(`🤖 Backend service initialized: ${this.backendSigner.address}`);

      await this.startMonitoring();
    } catch (error) {
      logger.error('❌ Failed to initialize event monitor:', error);
    }
  }

  async startMonitoring() {
    if (this.monitoring) {
      logger.info('🔄 Event monitoring already active');
      return;
    }

    try {
      const reportContract = blockchainService.getContract('ReportContract');
      const rewardToken = blockchainService.getContract('RewardToken');

      if (!reportContract || !rewardToken) {
        logger.error('❌ Contracts not loaded for event monitoring');
        return;
      }

      this.monitoring = true;
      logger.info('👁️ Starting blockchain event monitoring...');

      // Monitor Report Status Updates for reward distribution
      const reportStatusListener = reportContract.on('ReportStatusUpdated', async (reportId, status, verifier, event) => {
        try {
          logger.info(`📋 Report status updated: ID ${reportId}, Status: ${status}, Verifier: ${verifier}`);
          
          // Status 2 = Verified, Status 3 = Rejected
          if (status === 2) {
            await this.handleReportApproved(reportId);
          } else if (status === 3) {
            await this.handleReportRejected(reportId);
          }
        } catch (error) {
          logger.error(`❌ Error handling report status update:`, error);
        }
      });

      // Monitor Report Verified events specifically  
      const reportVerifiedListener = reportContract.on('ReportVerified', async (reportId, reporter, verifier, event) => {
        try {
          logger.info(`✅ Report verified: ID ${reportId}, Reporter: ${reporter}, Verifier: ${verifier}`);
          await this.handleReportApproved(reportId);
        } catch (error) {
          logger.error(`❌ Error handling report verification:`, error);
        }
      });

      // Store listeners for cleanup
      this.eventListeners.set('ReportStatusUpdated', reportStatusListener);
      this.eventListeners.set('ReportVerified', reportVerifiedListener);

      logger.info('✅ Event monitoring started successfully');

    } catch (error) {
      logger.error('❌ Failed to start event monitoring:', error);
      this.monitoring = false;
    }
  }

  async handleReportApproved(reportId) {
    try {
      logger.info(`🎉 Processing approved report: ${reportId}`);

      // Get report info to find the reporter
      const reportContract = blockchainService.getContract('ReportContract');
      const reportInfo = await reportContract.getReportInfo(reportId);
      const reporterAddress = reportInfo[1]; // Second element is reporter address

      // Get treasury address (should be signer[1] based on our plan)
      const treasuryAddress = process.env.TREASURY_ADDRESS || process.env.LOCALNET_PRIVATE_KEY_TREASURY;
      if (!treasuryAddress) {
        logger.error('❌ Treasury address not configured');
        return;
      }

      // Resolve treasury address if it's a private key
      let treasuryAddr = treasuryAddress;
      if (treasuryAddress.startsWith('0x') && treasuryAddress.length === 66) {
        // It's a private key, derive address
        const treasuryWallet = new ethers.Wallet(treasuryAddress);
        treasuryAddr = treasuryWallet.address;
      }

      logger.info(`💰 Distributing rewards to reporter: ${reporterAddress}`);

      // Mint reward tokens (1 GCR as per contract)
      const rewardTokenWithBackend = blockchainService.getContractWithSigner('RewardToken', this.backendSigner);
      const rewardAmount = ethers.parseEther('1'); // 1 GCR reward

      const mintTx = await rewardTokenWithBackend.mint(reporterAddress, rewardAmount);
      await mintTx.wait();
      logger.info(`✅ Reward minted: ${mintTx.hash}`);

      // Return original stake (10 GCR) from treasury
      const stakeAmount = ethers.parseEther('10'); // Original stake amount
      
      // Create treasury signer to return stake
      const treasuryPrivateKey = process.env.TREASURY_PRIVATE_KEY || process.env.LOCALNET_PRIVATE_KEY_TREASURY;
      if (treasuryPrivateKey && treasuryPrivateKey.startsWith('0x') && treasuryPrivateKey.length === 66) {
        const treasurySigner = blockchainService.createSigner(treasuryPrivateKey);
        const rewardTokenWithTreasury = blockchainService.getContractWithSigner('RewardToken', treasurySigner);
        
        const returnTx = await rewardTokenWithTreasury.transfer(reporterAddress, stakeAmount);
        await returnTx.wait();
        logger.info(`✅ Stake returned: ${returnTx.hash}`);
      } else {
        logger.warn('⚠️ Treasury private key not configured - cannot return stake automatically');
      }

      logger.info(`🎉 Reward distribution complete for report ${reportId}`);

    } catch (error) {
      logger.error(`❌ Failed to distribute rewards for report ${reportId}:`, error);
    }
  }

  async handleReportRejected(reportId) {
    try {
      logger.info(`❌ Processing rejected report: ${reportId}`);

      // Get report info to find the reporter
      const reportContract = blockchainService.getContract('ReportContract');
      const reportInfo = await reportContract.getReportInfo(reportId);
      const reporterAddress = reportInfo[1]; // Second element is reporter address

      // Return original stake only (no reward for rejected reports)
      const stakeAmount = ethers.parseEther('10'); // Original stake amount

      const treasuryPrivateKey = process.env.TREASURY_PRIVATE_KEY || process.env.LOCALNET_PRIVATE_KEY_TREASURY;
      if (treasuryPrivateKey && treasuryPrivateKey.startsWith('0x') && treasuryPrivateKey.length === 66) {
        const treasurySigner = blockchainService.createSigner(treasuryPrivateKey);
        const rewardTokenWithTreasury = blockchainService.getContractWithSigner('RewardToken', treasurySigner);
        
        const returnTx = await rewardTokenWithTreasury.transfer(reporterAddress, stakeAmount);
        await returnTx.wait();
        logger.info(`✅ Stake returned (rejected): ${returnTx.hash}`);
      } else {
        logger.warn('⚠️ Treasury private key not configured - cannot return stake automatically');
      }

      logger.info(`💔 Stake return complete for rejected report ${reportId}`);

    } catch (error) {
      logger.error(`❌ Failed to return stake for rejected report ${reportId}:`, error);
    }
  }

  async stopMonitoring() {
    if (!this.monitoring) {
      return;
    }

    logger.info('🛑 Stopping event monitoring...');

    // Remove all event listeners
    for (const [eventName, listener] of this.eventListeners) {
      try {
        const reportContract = blockchainService.getContract('ReportContract');
        reportContract.off(eventName, listener);
        logger.info(`✅ Removed listener for ${eventName}`);
      } catch (error) {
        logger.error(`❌ Error removing listener for ${eventName}:`, error);
      }
    }

    this.eventListeners.clear();
    this.monitoring = false;
    logger.info('✅ Event monitoring stopped');
  }

  isMonitoring() {
    return this.monitoring;
  }

  getStatus() {
    return {
      monitoring: this.monitoring,
      backendAddress: this.backendSigner?.address || null,
      listenersCount: this.eventListeners.size
    };
  }
}

export default new EventMonitorService();
