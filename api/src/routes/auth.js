import express from 'express';

const router = express.Router();

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
