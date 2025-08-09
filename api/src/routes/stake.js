import express from 'express';
import { body, validationResult } from 'express-validator';
import blockchainService from '../services/blockchain.js';
import { logger } from '../utils/logger.js';
import { ethers } from 'ethers';

const router = express.Router();

/**
 * @route POST /api/stake/register-and-stake
 * @desc Register user and stake 10 GCR for instant verification
 * @access Public
 */
router.post('/register-and-stake', [
  body('identifier').isLength({ min: 1, max: 500 }).withMessage('Identifier must be between 1 and 500 characters'),
  body('longevity').isInt({ min: 1, max: 100 }).withMessage('Longevity must be between 1 and 100 years'),
  body('privateKey').isLength({ min: 64, max: 66 }).withMessage('Valid private key required'),
  body('treasuryAddress').isEthereumAddress().withMessage('Valid treasury address required')
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
    const { identifier, longevity, privateKey, treasuryAddress } = req.body;

    // Create user signer
    const userSigner = blockchainService.createSigner(privateKey);
    const userAddress = userSigner.address;

    // Check if user is already registered
    const userVerification = blockchainService.getContractWithSigner('UserVerification', userSigner);
    const isRegistered = await userVerification.isRegistered(userAddress);
    
    if (isRegistered) {
      // If already registered, check if verified
      const isVerified = await userVerification.isUserVerified(userAddress);
      if (isVerified) {
        return res.json({
          success: true,
          message: 'User is already registered and verified',
          data: {
            userAddress,
            verified: true,
            note: 'No staking needed - already verified'
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'User is already registered but not verified. Please contact support.',
          data: {
            userAddress,
            isRegistered: true,
            isVerified: false
          }
        });
      }
    }

    // Step 1: Register user
    logger.info(`🔄 Registering user: ${userAddress}`);
    const registerTx = await userVerification.registerUser(identifier, longevity);
    await registerTx.wait();
    logger.info(`✅ User registered: ${registerTx.hash}`);

    // Step 2: Stake 10 GCR tokens to treasury
    const rewardToken = blockchainService.getContractWithSigner('RewardToken', userSigner);
    const stakeAmount = ethers.parseEther('10'); // 10 GCR

    // Check user balance first
    const userBalance = await rewardToken.balanceOf(userAddress);
    if (userBalance < stakeAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Need 10 GCR, have ${ethers.formatEther(userBalance)} GCR`
      });
    }

    logger.info(`🔄 Staking 10 GCR to treasury: ${treasuryAddress}`);
    const stakeTx = await rewardToken.transfer(treasuryAddress, stakeAmount);
    await stakeTx.wait();
    logger.info(`✅ Stake transferred: ${stakeTx.hash}`);

    // Step 3: Auto-verify user (backend service)
    const backendPrivateKey = process.env.BACKEND_PRIVATE_KEY || process.env.LOCALNET_PRIVATE_KEY_VERIFIER;
    if (!backendPrivateKey) {
      return res.status(500).json({
        success: false,
        message: 'Backend service not configured for auto-verification'
      });
    }

    const backendSigner = blockchainService.createSigner(backendPrivateKey);
    const userVerificationAsBackend = blockchainService.getContractWithSigner('UserVerification', backendSigner);

    // Check if user is already verified before attempting verification
    const isAlreadyVerified = await userVerification.isUserVerified(userAddress);
    if (isAlreadyVerified) {
      return res.json({
        success: true,
        message: 'User is already verified',
        data: {
          userAddress,
          stakeAmount: '10 GCR',
          treasuryAddress,
          verified: true,
          note: 'User was already verified'
        }
      });
    }

    logger.info(`🔄 Auto-verifying user: ${userAddress} using backend: ${backendSigner.address}`);
    
    let verifyTx = null;
    try {
      verifyTx = await userVerificationAsBackend.verifyUser(userAddress);
      await verifyTx.wait();
      logger.info(`✅ User auto-verified: ${verifyTx.hash}`);
    } catch (verifyError) {
      logger.error(`❌ Verification failed:`, verifyError);
      
      // Check if it's because user is already verified
      const isVerifiedNow = await userVerification.isUserVerified(userAddress);
      if (isVerifiedNow) {
        logger.info(`ℹ️ User was already verified during the process`);
      } else {
        return res.status(500).json({
          success: false,
          message: 'Registration and staking succeeded, but auto-verification failed',
          data: {
            userAddress,
            stakeAmount: '10 GCR',
            treasuryAddress,
            verified: false,
            transactions: {
              registration: registerTx.hash,
              stake: stakeTx.hash
            },
            error: verifyError.message
          }
        });
      }
    }

    // Step 4: Verify the user is now verified
    const isVerified = await userVerification.isUserVerified(userAddress);

    res.json({
      success: true,
      message: 'User registered, staked, and verified successfully',
      data: {
        userAddress,
        stakeAmount: '10 GCR',
        treasuryAddress,
        verified: isVerified,
        transactions: {
          registration: registerTx.hash,
          stake: stakeTx.hash,
          verification: verifyTx?.hash || 'already_verified'
        }
      }
    });

    logger.info(`🎉 Complete stake-based verification for user: ${userAddress}`);

  } catch (error) {
    logger.error('Error in stake-based registration:', error);
    
    let message = 'Failed to register and stake';
    if (error.message.includes('User already registered')) {
      message = 'User is already registered';
    } else if (error.message.includes('Insufficient balance')) {
      message = 'Insufficient GCR balance for staking';
    } else if (error.message.includes('Only admin')) {
      message = 'Backend service not authorized for verification';
    }

    res.status(500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/stake/balance/:address
 * @desc Get GCR token balance for address
 * @access Public
 */
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!blockchainService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address'
      });
    }

    const balance = await blockchainService.getTokenBalance(address);

    res.json({
      success: true,
      data: {
        address,
        balance: `${balance} GCR`,
        canStake: parseFloat(balance) >= 10
      }
    });

  } catch (error) {
    logger.error('Error getting token balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get token balance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/stake/status/:address
 * @desc Get user registration and verification status
 * @access Public
 */
router.get('/status/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!blockchainService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address'
      });
    }

    const userVerification = blockchainService.getContract('UserVerification');
    
    const isRegistered = await userVerification.isRegistered(address);
    let isVerified = false;
    let userStatus = null;

    if (isRegistered) {
      isVerified = await userVerification.isUserVerified(address);
      userStatus = await userVerification.getUserStatus(address);
    }

    const balance = await blockchainService.getTokenBalance(address);

    res.json({
      success: true,
      data: {
        address,
        isRegistered,
        isVerified,
        balance: `${balance} GCR`,
        canStake: parseFloat(balance) >= 10,
        userStatus: userStatus ? {
          createdAt: userStatus.createdAt.toString(),
          longevity: userStatus.longevity.toString()
        } : null
      }
    });

  } catch (error) {
    logger.error('Error getting user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/stake/debug/backend-info
 * @desc Get backend service information for debugging
 * @access Public
 */
router.get('/debug/backend-info', async (req, res) => {
  try {
    const backendPrivateKey = process.env.BACKEND_PRIVATE_KEY || process.env.LOCALNET_PRIVATE_KEY_VERIFIER;
    
    if (!backendPrivateKey) {
      return res.json({
        success: false,
        message: 'Backend private key not configured',
        config: {
          BACKEND_PRIVATE_KEY: !!process.env.BACKEND_PRIVATE_KEY,
          LOCALNET_PRIVATE_KEY_VERIFIER: !!process.env.LOCALNET_PRIVATE_KEY_VERIFIER
        }
      });
    }

    const backendSigner = blockchainService.createSigner(backendPrivateKey);
    const backendAddress = backendSigner.address;

    // Check if backend is admin of UserVerification contract
    const userVerification = blockchainService.getContract('UserVerification');
    const adminAddress = await userVerification.admin();

    res.json({
      success: true,
      data: {
        backendAddress,
        adminAddress,
        isBackendAdmin: backendAddress.toLowerCase() === adminAddress.toLowerCase(),
        treasuryAddress: process.env.TREASURY_ADDRESS
      }
    });

  } catch (error) {
    logger.error('Error getting backend info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backend info',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/stake/verify-and-reward
 * @desc Verify a registered user and distribute rewards
 * @access Public
 */
router.post('/verify-and-reward', [
  body('address').isEthereumAddress().withMessage('Valid wallet address required')
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
    const { address } = req.body;

    // Check if user is registered first
    const userVerification = blockchainService.getContract('UserVerification');
    const isRegistered = await userVerification.isRegistered(address);
    
    if (!isRegistered) {
      return res.status(400).json({
        success: false,
        message: 'User is not registered. Please register first.',
        data: { address, isRegistered: false }
      });
    }

    // Check if user is already verified
    const isAlreadyVerified = await userVerification.isUserVerified(address);
    if (isAlreadyVerified) {
      return res.json({
        success: true,
        message: 'User is already verified',
        data: { address, isVerified: true, note: 'No action needed' }
      });
    }

    // Use backend service to verify user
    const backendPrivateKey = process.env.BACKEND_PRIVATE_KEY || process.env.TESTNET_PRIVATE_KEY;
    if (!backendPrivateKey) {
      return res.status(500).json({
        success: false,
        message: 'Backend service not configured for verification'
      });
    }

    const backendSigner = blockchainService.createSigner(backendPrivateKey);
    const userVerificationAsBackend = blockchainService.getContractWithSigner('UserVerification', backendSigner);

    logger.info(`🔄 Verifying user: ${address} using backend: ${backendSigner.address}`);
    
    const verifyTx = await userVerificationAsBackend.verifyUser(address);
    await verifyTx.wait();
    logger.info(`✅ User verified: ${verifyTx.hash}`);

    // Verify the user is now verified
    const isVerified = await userVerification.isUserVerified(address);

    res.json({
      success: true,
      message: 'User verified successfully',
      data: {
        address,
        isVerified,
        txHash: verifyTx.hash
      }
    });

    logger.info(`🎉 User verification completed for: ${address}`);

  } catch (error) {
    logger.error('Error in verify-and-reward:', error);
    
    let message = 'Failed to verify user';
    if (error.message.includes('Only admin')) {
      message = 'Backend service not authorized for verification';
    } else if (error.message.includes('User already verified')) {
      message = 'User is already verified';
    }

    res.status(500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/stake/mint-tokens
 * @desc Mint test tokens for development/testing
 * @access Public
 */
router.post('/mint-tokens', [
  body('address').isEthereumAddress().withMessage('Valid wallet address required'),
  body('amount').isNumeric().withMessage('Valid amount required')
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
    const { address, amount } = req.body;

    // Use backend signer to mint tokens
    const backendPrivateKey = process.env.BACKEND_PRIVATE_KEY || process.env.TESTNET_PRIVATE_KEY;
    if (!backendPrivateKey) {
      return res.status(500).json({
        success: false,
        message: 'Backend service not configured for token minting'
      });
    }

    const backendSigner = blockchainService.createSigner(backendPrivateKey);
    const rewardToken = blockchainService.getContractWithSigner('RewardToken', backendSigner);

    // Check if backend is owner/has minting rights
    const owner = await rewardToken.owner();
    if (backendSigner.address.toLowerCase() !== owner.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Backend service not authorized to mint tokens',
        data: {
          backendAddress: backendSigner.address,
          tokenOwner: owner
        }
      });
    }

    const mintAmount = ethers.parseEther(amount.toString());
    
    logger.info(`🔄 Minting ${amount} GCR tokens to ${address}`);
    const mintTx = await rewardToken.mint(address, mintAmount);
    await mintTx.wait();
    logger.info(`✅ Tokens minted: ${mintTx.hash}`);

    // Get new balance
    const newBalance = await rewardToken.balanceOf(address);

    res.json({
      success: true,
      message: `Successfully minted ${amount} GCR tokens`,
      data: {
        address,
        amountMinted: `${amount} GCR`,
        newBalance: `${ethers.formatEther(newBalance)} GCR`,
        txHash: mintTx.hash
      }
    });

  } catch (error) {
    logger.error('Error minting tokens:', error);
    
    let message = 'Failed to mint tokens';
    if (error.message.includes('Ownable: caller is not the owner')) {
      message = 'Not authorized to mint tokens';
    }

    res.status(500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/stake/allocate-tokens
 * @desc Allocate initial tokens to new users (20 GCR for staking and testing)
 * @access Public
 */
router.post('/allocate-tokens', [
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

    // Get the admin signer (who can mint tokens)
    const adminSigner = blockchainService.getSigner();
    const rewardToken = blockchainService.getContractWithSigner('RewardToken', adminSigner);
    
    // Check current balance
    const currentBalance = await rewardToken.balanceOf(walletAddress);
    logger.info(`Current balance for ${walletAddress}: ${ethers.formatEther(currentBalance)} GCR`);
    
    // If user already has sufficient tokens (>= 15 GCR), don't allocate more
    const minimumBalance = ethers.parseEther('15');
    if (currentBalance >= minimumBalance) {
      return res.json({
        success: true,
        message: 'User already has sufficient tokens',
        data: {
          walletAddress,
          currentBalance: `${ethers.formatEther(currentBalance)} GCR`,
          note: 'No additional tokens allocated'
        }
      });
    }
    
    // Allocate 20 GCR tokens (enough for staking 10 and having some extra)
    const allocationAmount = ethers.parseEther('20');
    
    logger.info(`Allocating ${ethers.formatEther(allocationAmount)} GCR to ${walletAddress}`);
    
    const mintTx = await rewardToken.mint(walletAddress, allocationAmount);
    await mintTx.wait();
    
    const newBalance = await rewardToken.balanceOf(walletAddress);
    
    logger.info(`Successfully allocated tokens. New balance: ${ethers.formatEther(newBalance)} GCR`);
    
    res.json({
      success: true,
      message: `Successfully allocated ${ethers.formatEther(allocationAmount)} GCR tokens`,
      data: {
        walletAddress,
        allocated: `${ethers.formatEther(allocationAmount)} GCR`,
        newBalance: `${ethers.formatEther(newBalance)} GCR`,
        txHash: mintTx.hash
      }
    });

  } catch (error) {
    logger.error('Error allocating tokens:', error);
    
    let message = 'Failed to allocate tokens';
    if (error.message.includes('Ownable: caller is not the owner')) {
      message = 'Not authorized to allocate tokens';
    } else if (error.message.includes('insufficient funds')) {
      message = 'Insufficient gas fees for token allocation';
    }

    res.status(500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
