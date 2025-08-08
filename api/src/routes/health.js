import express from 'express';
import blockchainService from '../services/blockchain.js';

const router = express.Router();

/**
 * @route GET /api/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const networkInfo = await blockchainService.getNetworkInfo();
    const gasPrice = await blockchainService.getGasPrice();

    res.json({
      success: true,
      message: 'GuardianChain API is healthy',
      data: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        network: networkInfo,
        gasPrice,
        environment: process.env.NODE_ENV || 'development'
      }
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service unavailable',
      error: error.message
    });
  }
});

/**
 * @route GET /api/health/contracts
 * @desc Check contract connectivity
 * @access Public
 */
router.get('/contracts', async (req, res) => {
  try {
    const networkInfo = await blockchainService.getNetworkInfo();
    
    const contractStatus = {
      RewardToken: !!networkInfo.contractAddresses.RewardToken,
      UserVerification: !!networkInfo.contractAddresses.UserVerification,
      ReportContract: !!networkInfo.contractAddresses.ReportContract
    };

    const allContractsLoaded = Object.values(contractStatus).every(status => status);

    res.json({
      success: allContractsLoaded,
      message: allContractsLoaded ? 'All contracts connected' : 'Some contracts not loaded',
      data: {
        contracts: contractStatus,
        addresses: networkInfo.contractAddresses,
        network: networkInfo.name,
        chainId: networkInfo.chainId,
        blockNumber: networkInfo.blockNumber
      }
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Failed to check contract status',
      error: error.message
    });
  }
});

export default router;
