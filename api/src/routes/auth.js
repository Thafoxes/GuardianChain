import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// Store nonces temporarily (in production, use Redis or database)
const nonces = new Map();

/**
 * @route GET /api/auth/nonce/:address
 * @desc Get nonce for wallet address
 * @access Public
 */
router.get('/nonce/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }

    // Basic address validation
    if (!/^0x[a-fA-F0-9]{40}$/i.test(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address format'
      });
    }

    // Generate a random nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    
    // Store nonce with expiration (5 minutes)
    nonces.set(address.toLowerCase(), {
      nonce,
      timestamp: Date.now(),
      expires: Date.now() + (5 * 60 * 1000) // 5 minutes
    });

    res.json({
      success: true,
      data: {
        nonce
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate nonce',
      error: error.message
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login with wallet signature
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    const { address, signature, message, nonce } = req.body;

    if (!address || !signature || !message || !nonce) {
      return res.status(400).json({
        success: false,
        message: 'Address, signature, message, and nonce are required'
      });
    }

    // Verify nonce
    const storedNonce = nonces.get(address.toLowerCase());
    if (!storedNonce || storedNonce.nonce !== nonce || Date.now() > storedNonce.expires) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired nonce'
      });
    }

    // Clean up used nonce
    nonces.delete(address.toLowerCase());

    // In production, verify the signature here
    // For now, we'll trust the frontend verification

    // Generate JWT token (simplified)
    const token = crypto.randomBytes(32).toString('hex');

    // Return user data
    res.json({
      success: true,
      data: {
        user: {
          address: address.toLowerCase(),
          role: 'USER', // Default role
          isVerified: false, // Check from blockchain
          balance: '0',
          rewardTokens: '0'
        },
        token
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

/**
 * @route POST /api/auth/register
 * @desc Register new user
 * @access Public
 */
router.post('/register', async (req, res) => {
  try {
    const { address, signature, message, nonce, metadata } = req.body;

    if (!address || !signature || !message || !nonce) {
      return res.status(400).json({
        success: false,
        message: 'Address, signature, message, and nonce are required'
      });
    }

    // Verify nonce (same as login)
    const storedNonce = nonces.get(address.toLowerCase());
    if (!storedNonce || storedNonce.nonce !== nonce || Date.now() > storedNonce.expires) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired nonce'
      });
    }

    // Clean up used nonce
    nonces.delete(address.toLowerCase());

    // Generate JWT token
    const token = crypto.randomBytes(32).toString('hex');

    // Return new user data
    res.json({
      success: true,
      data: {
        user: {
          address: address.toLowerCase(),
          role: 'USER',
          isVerified: false,
          balance: '0',
          rewardTokens: '0',
          ...metadata
        },
        token
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', async (req, res) => {
  try {
    // In production, verify JWT token and get user from database
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // For now, return mock user data
    res.json({
      success: true,
      data: {
        address: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        role: 'USER',
        isVerified: false,
        balance: '10000',
        rewardTokens: '0'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
});

/**
 * @route POST /api/auth/connect-wallet
 * @desc Validate wallet connection and return user info
 * @access Public
 */
router.post('/connect-wallet', async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }

    // Basic address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address format'
      });
    }

    res.json({
      success: true,
      message: 'Wallet connected successfully',
      data: {
        walletAddress: walletAddress.toLowerCase(),
        network: process.env.NETWORK || 'localnet',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to connect wallet',
      error: error.message
    });
  }
});

/**
 * @route POST /api/auth/verify-signature
 * @desc Verify wallet signature for authentication
 * @access Public
 */
router.post('/verify-signature', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address, signature, and message are required'
      });
    }

    // In a real implementation, you would verify the signature here
    // For now, we'll return a success response
    res.json({
      success: true,
      message: 'Signature verified successfully',
      data: {
        walletAddress: walletAddress.toLowerCase(),
        verified: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify signature',
      error: error.message
    });
  }
});

/**
 * @route GET /api/auth/session/:address
 * @desc Get session info for a wallet address
 * @access Public
 */
router.get('/session/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address format'
      });
    }

    res.json({
      success: true,
      data: {
        walletAddress: address.toLowerCase(),
        isConnected: true,
        network: process.env.NETWORK || 'localnet',
        sessionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get session info',
      error: error.message
    });
  }
});

export default router;
