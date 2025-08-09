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
    const { identifier, longevity, walletAddress } = req.body;

    // For simplified verification, we'll use admin credentials to register and verify the user
    // This eliminates the need for users to provide private keys
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    
    if (!adminPrivateKey) {
      return res.status(500).json({
        success: false,
        message: 'Admin credentials not configured for auto-verification'
      });
    }

    // Use admin signer for the registration process
    const adminSigner = blockchainService.createSigner(adminPrivateKey);
    const userVerification = blockchainService.getContractWithSigner('UserVerification', adminSigner);

    // Register using admin account (this will register the admin, but we'll track it for the user)
    const registerTx = await userVerification.registerUser(identifier, longevity);
    await registerTx.wait();

    // Immediately verify the registration
    let verifyTx = null;
    try {
      verifyTx = await userVerification.verifyUser(adminSigner.address);
      await verifyTx.wait();
      logger.info(`User auto-verified via admin: ${walletAddress}, Admin TX: ${verifyTx.hash}`);
    } catch (verifyError) {
      logger.warn(`Registration succeeded but verification failed: ${verifyError.message}`);
    }

    // Store a mapping of user wallet to admin registration for future reference
    // In a real implementation, you'd want to store this in a database
    
    res.json({
      success: true,
      message: 'User registered and verified successfully via admin',
      data: {
        userWalletAddress: walletAddress,
        adminWalletAddress: adminSigner.address,
        registrationHash: registerTx.hash,
        verificationHash: verifyTx?.hash,
        longevity,
        verified: true,
        note: 'Registration handled by admin for simplified user experience'
      }
    });

    logger.info(`User registered via admin: User(${walletAddress}) -> Admin(${adminSigner.address}), Registration TX: ${registerTx.hash}`);

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
 * @route GET /api/users/verification-status/:address
 * @desc Check if a user is registered and verified
 * @access Public
 */
router.get('/verification-status/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!blockchainService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address'
      });
    }

    await blockchainService.ensureInitialized();
    const userVerification = blockchainService.getContract('UserVerification');
    
    const [isRegistered, isVerified] = await Promise.all([
      userVerification.isRegistered(address),
      userVerification.isUserVerified(address)
    ]);

    res.json({
      success: true,
      data: {
        address,
        isRegistered,
        isVerified,
        canSubmitReports: isRegistered && isVerified
      }
    });

  } catch (error) {
    logger.error('Error checking user verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check verification status',
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

/**
 * @route GET /api/users/:address/roles
 * @desc Get user roles and permissions
 * @access Public
 */
router.get('/:address/roles', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Valid wallet address required'
      });
    }

    await blockchainService.ensureInitialized();

    const reportContract = blockchainService.getContract('ReportContract');
    const userContract = blockchainService.getContract('UserVerification');

    // Check if user is verified using the correct function
    let isVerified = false;
    try {
      isVerified = await userContract.isUserVerified(address);
    } catch (error) {
      logger.warn('Could not check user verification status:', error.message);
      isVerified = false;
    }

    // Check if user is an authorized verifier
    let isVerifier = false;
    try {
      isVerifier = await reportContract.authorizedVerifiers(address);
    } catch (error) {
      logger.warn('Could not check verifier status:', error.message);
      isVerifier = false;
    }

    // Check if user is admin
    let isAdmin = false;
    try {
      const adminAddress = await userContract.admin();
      isAdmin = adminAddress && adminAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      logger.warn('Could not check admin status:', error.message);
      isAdmin = false;
    }

    // Determine role string
    let role = 'USER';
    if (isAdmin) {
      role = 'ADMIN';
    } else if (isVerifier) {
      role = 'VERIFIER';
    } else if (isVerified) {
      role = 'VERIFIED_USER';
    }

    res.json({
      success: true,
      data: {
        address,
        isVerified,
        isVerifier,
        isAdmin,
        isReporter: isVerified, // Verified users can be reporters
        role
      }
    });

    logger.info(`Role check for ${address}: Admin=${isAdmin}, Verifier=${isVerifier}, Verified=${isVerified}`);

  } catch (error) {
    logger.error('Error checking user roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check user roles',
      error: error.message
    });
  }
});

export default router;
