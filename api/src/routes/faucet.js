import express from 'express';
import { body, validationResult } from 'express-validator';
import blockchainService from '../services/blockchain.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * @route POST /api/faucet/claim
 * @desc Claim 100 GCR tokens for testing purposes
 * @access Public
 */
router.post('/claim', [
  body('walletAddress').isEthereumAddress().withMessage('Valid wallet address required')
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
    const { walletAddress } = req.body;
    
    // Ensure blockchain service is initialized
    await blockchainService.ensureInitialized();
    
    // Check if user has already claimed tokens recently (anti-spam)
    const lastClaimKey = `faucet_claim_${walletAddress.toLowerCase()}`;
    if (!global.faucetClaims) {
      global.faucetClaims = new Map();
    }
    
    const lastClaim = global.faucetClaims.get(lastClaimKey);
    const now = Date.now();
    const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours
    
    if (lastClaim && (now - lastClaim) < cooldownPeriod) {
      const timeLeft = Math.ceil((cooldownPeriod - (now - lastClaim)) / (60 * 60 * 1000));
      return res.status(429).json({
        success: false,
        message: `You can only claim tokens once every 24 hours. Please try again in ${timeLeft} hours.`
      });
    }
    
    // Get deployer signer (faucet admin)
    const deployerPrivateKey = process.env.BACKEND_PRIVATE_KEY;
    if (!deployerPrivateKey) {
      throw new Error('Faucet private key not configured');
    }
    
    const faucetSigner = blockchainService.createSigner(deployerPrivateKey);
    const rewardToken = blockchainService.getContractWithSigner('RewardToken', faucetSigner);
    
    // Amount: 100 GCR tokens (with 18 decimals)
    const faucetAmount = '100000000000000000000'; // 100 * 10^18
    
    logger.info(`Faucet: Sending 100 GCR tokens to ${walletAddress}`);
    
    // Transfer tokens from faucet to user
    const tx = await rewardToken.transfer(walletAddress, faucetAmount);
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      // Record the claim
      global.faucetClaims.set(lastClaimKey, now);
      
      logger.info(`Faucet: Successfully sent 100 GCR tokens to ${walletAddress}, tx: ${tx.hash}`);
      
      res.json({
        success: true,
        message: 'Successfully claimed 100 GCR tokens!',
        data: {
          amount: '100',
          transactionHash: tx.hash,
          walletAddress
        }
      });
    } else {
      throw new Error('Transaction failed');
    }
    
  } catch (error) {
    logger.error('Faucet claim error:', error);
    
    // Handle specific error cases
    if (error.message.includes('insufficient funds')) {
      return res.status(500).json({
        success: false,
        message: 'Faucet is empty. Please contact administrator.'
      });
    } else if (error.message.includes('transfer amount exceeds balance')) {
      return res.status(500).json({
        success: false,
        message: 'Faucet has insufficient tokens. Please contact administrator.'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to claim tokens. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

/**
 * @route GET /api/faucet/status/:address
 * @desc Check if user can claim tokens (cooldown status)
 * @access Public
 */
router.get('/status/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!global.faucetClaims) {
      global.faucetClaims = new Map();
    }
    
    const lastClaimKey = `faucet_claim_${address.toLowerCase()}`;
    const lastClaim = global.faucetClaims.get(lastClaimKey);
    const now = Date.now();
    const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours
    
    let canClaim = true;
    let timeLeft = 0;
    
    if (lastClaim && (now - lastClaim) < cooldownPeriod) {
      canClaim = false;
      timeLeft = Math.ceil((cooldownPeriod - (now - lastClaim)) / (60 * 60 * 1000));
    }
    
    res.json({
      success: true,
      data: {
        canClaim,
        timeLeft,
        amount: '100',
        cooldownHours: 24
      }
    });
    
  } catch (error) {
    logger.error('Faucet status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check faucet status'
    });
  }
});

/**
 * @route GET /api/faucet/info
 * @desc Get faucet information
 * @access Public
 */
router.get('/info', async (req, res) => {
  try {
    await blockchainService.ensureInitialized();
    
    const deployerPrivateKey = process.env.BACKEND_PRIVATE_KEY;
    const faucetSigner = blockchainService.createSigner(deployerPrivateKey);
    const rewardToken = blockchainService.getContractWithSigner('RewardToken', faucetSigner);
    
    // Get faucet balance
    const faucetAddress = await faucetSigner.getAddress();
    const balance = await rewardToken.balanceOf(faucetAddress);
    const balanceFormatted = parseFloat(balance.toString()) / Math.pow(10, 18);
    
    res.json({
      success: true,
      data: {
        faucetAddress,
        balance: balanceFormatted.toFixed(2),
        faucetAmount: '100',
        cooldownHours: 24,
        tokenSymbol: 'GCR',
        tokenName: 'GuardianChain Reward Token'
      }
    });
    
  } catch (error) {
    logger.error('Faucet info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get faucet information'
    });
  }
});

export default router;
