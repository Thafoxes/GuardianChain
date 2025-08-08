import express from 'express';
import { body, validationResult } from 'express-validator';
import blockchainService from '../services/blockchain.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * @route POST /api/users/register
 * @desc Register a new user with encrypted identifier
 * @access Public
 */
router.post('/register', [
  body('identifier').isLength({ min: 1, max: 500 }).withMessage('Identifier must be between 1 and 500 characters'),
  body('longevity').isInt({ min: 1, max: 100 }).withMessage('Longevity must be between 1 and 100 years'),
  body('walletAddress').isEthereumAddress().withMessage('Valid wallet address required'),
  body('privateKey').isLength({ min: 1 }).withMessage('Private key required for signing')
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
    const { identifier, longevity, walletAddress, privateKey } = req.body;

    // Create signer
    const signer = blockchainService.createSigner(privateKey);
    
    // Verify signer address matches provided address
    if (signer.address.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Private key does not match wallet address'
      });
    }

    // Get contract with signer
    const userVerification = blockchainService.getContractWithSigner('UserVerification', signer);

    // Register user
    const tx = await userVerification.registerUser(identifier, longevity);
    await tx.wait();

    res.json({
      success: true,
      message: 'User registered successfully',
      data: {
        walletAddress,
        transactionHash: tx.hash,
        longevity
      }
    });

    logger.info(`User registered: ${walletAddress}, TX: ${tx.hash}`);

  } catch (error) {
    logger.error('Error registering user:', error);
    
    let message = 'Failed to register user';
    if (error.message.includes('User already registered')) {
      message = 'User is already registered';
    } else if (error.message.includes('insufficient funds')) {
      message = 'Insufficient funds for transaction';
    }

    res.status(500).json({
      success: false,
      message,
      error: error.message
    });
  }
});

/**
 * @route GET /api/users/:address/status
 * @desc Check if user is registered and verified
 * @access Public
 */
router.get('/:address/status', async (req, res) => {
  try {
    const { address } = req.params;

    if (!blockchainService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address'
      });
    }

    const userVerification = blockchainService.getContract('UserVerification');
    
    const [isRegistered, isVerified] = await Promise.all([
      userVerification.isUserRegistered(address),
      userVerification.isUserVerified(address)
    ]);

    res.json({
      success: true,
      data: {
        address,
        isRegistered,
        isVerified,
        canSubmitReports: isVerified
      }
    });

  } catch (error) {
    logger.error('Error checking user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check user status',
      error: error.message
    });
  }
});

/**
 * @route POST /api/users/:address/identifier
 * @desc Get user's encrypted identifier (only for the user themselves)
 * @access Private
 */
router.post('/:address/identifier', [
  body('privateKey').isLength({ min: 1 }).withMessage('Private key required for authorization')
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
    const { privateKey } = req.body;

    if (!blockchainService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address'
      });
    }

    // Create signer
    const signer = blockchainService.createSigner(privateKey);
    
    // Verify signer address matches the requested address
    if (signer.address.toLowerCase() !== address.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Can only access your own identifier'
      });
    }

    // Get contract with signer
    const userVerification = blockchainService.getContractWithSigner('UserVerification', signer);

    // Get encrypted identifier
    const identifier = await userVerification.getMyIdentifier();

    res.json({
      success: true,
      data: {
        address,
        identifier
      }
    });

  } catch (error) {
    logger.error('Error retrieving user identifier:', error);
    
    let message = 'Failed to retrieve identifier';
    if (error.message.includes('User not registered')) {
      message = 'User is not registered';
    }

    res.status(500).json({
      success: false,
      message,
      error: error.message
    });
  }
});

/**
 * @route GET /api/users/:address/balance
 * @desc Get user's native token and GCR token balance
 * @access Public
 */
router.get('/:address/balance', async (req, res) => {
  try {
    const { address } = req.params;

    if (!blockchainService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address'
      });
    }

    const [nativeBalance, tokenBalance] = await Promise.all([
      blockchainService.getBalance(address),
      blockchainService.getTokenBalance(address)
    ]);

    res.json({
      success: true,
      data: {
        address,
        nativeBalance: nativeBalance, // TEST/ROSE tokens
        gcrBalance: tokenBalance, // GCR tokens
        nativeSymbol: process.env.NETWORK === 'mainnet' ? 'ROSE' : 'TEST',
        tokenSymbol: 'GCR'
      }
    });

  } catch (error) {
    logger.error('Error fetching user balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance',
      error: error.message
    });
  }
});

/**
 * @route GET /api/users/stats/total
 * @desc Get total number of registered users
 * @access Public
 */
router.get('/stats/total', async (req, res) => {
  try {
    const userVerification = blockchainService.getContract('UserVerification');
    const totalUsers = await userVerification.getTotalUsers();

    res.json({
      success: true,
      data: {
        totalUsers: Number(totalUsers)
      }
    });

  } catch (error) {
    logger.error('Error fetching total users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch total users',
      error: error.message
    });
  }
});

export default router;
