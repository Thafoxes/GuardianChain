import express from 'express';
import { ethers } from 'ethers';
import { param, validationResult } from 'express-validator';
import blockchainService from '../services/blockchain.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * @route GET /api/blockchain/balance/:address
 * @desc Get native token balance for an address
 * @access Public
 */
router.get('/balance/:address', [
  param('address').isEthereumAddress().withMessage('Valid wallet address required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const { address } = req.params;
    
    // Get ETH balance
    const provider = blockchainService.getProvider();
    const balance = await provider.getBalance(address);
    const balanceInEther = ethers.formatEther(balance);

    res.json({
      success: true,
      message: 'Balance retrieved successfully',
      data: {
        balance: balanceInEther
      }
    });

  } catch (error) {
    logger.error('Balance retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve balance',
      error: error.message
    });
  }
});

/**
 * @route GET /api/blockchain/token-balance/:address
 * @desc Get GCR token balance for an address
 * @access Public
 */
router.get('/token-balance/:address', [
  param('address').isEthereumAddress().withMessage('Valid wallet address required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const { address } = req.params;
    
    // Get token balance
    const rewardToken = blockchainService.getContract('RewardToken');
    const balance = await rewardToken.balanceOf(address);
    const balanceFormatted = ethers.formatEther(balance);

    res.json({
      success: true,
      message: 'Token balance retrieved successfully',
      data: {
        balance: balanceFormatted
      }
    });

  } catch (error) {
    logger.error('Token balance retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve token balance',
      error: error.message
    });
  }
});

/**
 * @route GET /api/blockchain/network-info
 * @desc Get network information
 * @access Public
 */
router.get('/network-info', async (req, res) => {
  try {
    const provider = blockchainService.getProvider();
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();

    res.json({
      success: true,
      message: 'Network info retrieved successfully',
      data: {
        chainId: Number(network.chainId),
        name: network.name,
        blockNumber: blockNumber
      }
    });

  } catch (error) {
    logger.error('Network info retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve network info',
      error: error.message
    });
  }
});

export default router;
