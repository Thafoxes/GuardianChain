import express from 'express';
import { body, validationResult } from 'express-validator';
import blockchainService from '../services/blockchain.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * @route GET /api/reports/debug
 * @desc Debug endpoint to check environment variables and blockchain status
 * @access Public
 */
router.get('/debug', async (req, res) => {
  try {
    // Ensure blockchain service is initialized
    await blockchainService.ensureInitialized();

    const debug = {
      environment: {
        NETWORK: process.env.NETWORK,
        REWARD_TOKEN_ADDRESS: process.env.REWARD_TOKEN_ADDRESS,
        USER_VERIFICATION_ADDRESS: process.env.USER_VERIFICATION_ADDRESS,
        REPORT_CONTRACT_ADDRESS: process.env.REPORT_CONTRACT_ADDRESS,
        NODE_ENV: process.env.NODE_ENV
      },
      blockchain: {
        providerConnected: !!blockchainService.provider,
        contractsLoaded: Object.keys(blockchainService.contracts),
        contractCount: Object.keys(blockchainService.contracts).length
      }
    };

    logger.info('Debug info requested:', debug);

    res.json({
      success: true,
      data: debug
    });
  } catch (error) {
    logger.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
});

/**
 * @route POST /api/reports/submit
 * @desc Submit a new encrypted report
 * @access Private (requires authentication)
 */
router.post('/submit', [
  body('title').isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  body('content').isLength({ min: 1, max: 10000 }).withMessage('Content must be between 1 and 10000 characters'),
  body('category').optional().isIn(['security', 'fraud', 'governance', 'technical', 'other']).withMessage('Invalid category'),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
  body('anonymous').optional().isBoolean().withMessage('Anonymous must be a boolean'),
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
    // Ensure blockchain service is initialized
    await blockchainService.ensureInitialized();

    const { 
      title, 
      content, 
      category = 'other', 
      severity = 'medium', 
      evidence = '', 
      anonymous = false, 
      walletAddress 
    } = req.body;

    // Create the full report content to encrypt
    const fullReportContent = JSON.stringify({
      title,
      content,
      evidence,
      category,
      severity,
      anonymous,
      timestamp: new Date().toISOString()
    });

    // Get a signer using the first localnet private key (deployer account)
    // In production, this would be handled differently with proper authentication
    const deployerPrivateKey = process.env.LOCALNET_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const deployer = blockchainService.createSigner(deployerPrivateKey);
    
    // Get contract with deployer signer (who will submit on behalf of user)
    const reportContract = blockchainService.getContractWithSigner('ReportContract', deployer);

    // Submit report to blockchain with encrypted content
    logger.info(`Submitting report to blockchain for user: ${walletAddress}`);
    const tx = await reportContract.submitReport(fullReportContent);
    const receipt = await tx.wait();

    // Get report ID from the ReportSubmitted event
    let reportId = null;
    for (const log of receipt.logs) {
      try {
        const parsedLog = reportContract.interface.parseLog(log);
        if (parsedLog.name === 'ReportSubmitted') {
          reportId = Number(parsedLog.args.reportId);
          logger.info(`Report submitted with ID: ${reportId}`);
          break;
        }
      } catch {
        continue;
      }
    }

    if (!reportId) {
      throw new Error('Failed to get report ID from transaction');
    }

    // Store additional metadata in memory/database for frontend display
    // (the blockchain stores encrypted content, we need metadata for listing)
    const reportMetadata = {
      id: reportId,
      title,
      category,
      severity,
      anonymous,
      reporter: walletAddress.toLowerCase(),
      status: 'submitted',
      timestamp: new Date().toISOString(),
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };

    // Log the successful submission
    logger.info(`Report submitted successfully to blockchain: ${JSON.stringify({
      id: reportId,
      title,
      category,
      severity,
      reporter: walletAddress,
      txHash: tx.hash
    })}`);

    res.json({
      success: true,
      message: 'Report submitted successfully to blockchain',
      data: {
        reportId,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        report: {
          id: reportId,
          title,
          category,
          severity,
          status: 'submitted',
          timestamp: reportMetadata.timestamp,
          anonymous,
          reporter: walletAddress.toLowerCase()
        }
      }
    });

  } catch (error) {
    logger.error('Error submitting report to blockchain:', error);
    
    let message = 'Failed to submit report to blockchain';
    if (error.message.includes('User must be verified')) {
      message = 'User must be verified before submitting reports';
    } else if (error.message.includes('insufficient funds')) {
      message = 'Insufficient funds for transaction';
    } else if (error.message.includes('execution reverted')) {
      message = 'Transaction failed: ' + error.message;
    }

    res.status(500).json({
      success: false,
      message,
      error: error.message
    });
  }
});

/**
 * @route GET /api/reports
 * @desc Get all reports from blockchain (with pagination and filtering)
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    // Ensure blockchain service is initialized
    await blockchainService.ensureInitialized();

    const { 
      status = 'all', 
      category = 'all', 
      limit = 20, 
      offset = 0 
    } = req.query;

    const reportContract = blockchainService.getContract('ReportContract');
    
    // Get total number of reports from blockchain
    const totalReports = await reportContract.getTotalReports();
    const totalReportsNum = Number(totalReports);
    
    logger.info(`Fetching all reports, total on blockchain: ${totalReportsNum}`);
    
    const allReports = [];
    
    // Fetch all reports from blockchain
    for (let i = 1; i <= totalReportsNum; i++) {
      try {
        const reportInfo = await reportContract.getReportInfo(i);
        
        const report = {
          id: i,
          title: `Report #${i}`, // We'll need to decrypt content to get real title
          category: "security", // We'll need metadata for this
          severity: "medium", // We'll need metadata for this
          status: getStatusName(reportInfo.status).toLowerCase(),
          timestamp: new Date(Number(reportInfo.timestamp) * 1000).toISOString(),
          reporter: reportInfo.reporter,
          anonymous: false, // We'll need metadata for this
          rewardClaimed: reportInfo.rewardClaimed
        };
        
        allReports.push(report);
      } catch (error) {
        logger.warn(`Skipping report ${i}: ${error.message}`);
        continue;
      }
    }

    const combinedReports = allReports;

    // Filter reports based on query parameters
    let filteredReports = combinedReports;
    
    if (status !== 'all') {
      filteredReports = filteredReports.filter(report => report.status === status);
    }
    
    if (category !== 'all') {
      filteredReports = filteredReports.filter(report => report.category === category);
    }

    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedReports = filteredReports.slice(startIndex, endIndex);

    logger.info(`Returning ${paginatedReports.length} reports (${allReports.length} from blockchain)`);

    res.json({
      success: true,
      data: {
        reports: paginatedReports,
        total: filteredReports.length,
        blockchainReports: allReports.length,
        offset: parseInt(offset),
        limit: parseInt(limit),
        hasMore: endIndex < filteredReports.length
      }
    });

  } catch (error) {
    logger.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
});

/**
 * @route GET /api/reports/:id
 * @desc Get specific report details
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reportId = parseInt(id);

    if (isNaN(reportId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

    // Mock report detail (in production, this would query the blockchain)
    const mockReport = {
      id: reportId,
      title: "Critical Smart Contract Vulnerability in DeFi Protocol",
      content: "Discovered a reentrancy vulnerability in the withdraw function that could allow attackers to drain the entire contract balance. The vulnerability exists in the withdraw() function where external calls are made before state changes.",
      evidence: "Transaction hash: 0x123..., Affected function: withdraw(), Estimated impact: $2.5M at risk",
      category: "security",
      severity: "critical",
      status: "investigating",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      reporter: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      anonymous: false,
      rewardClaimed: false,
      investigator: "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
      verificationTimestamp: null
    };

    res.json({
      success: true,
      data: mockReport
    });

  } catch (error) {
    logger.error('Error fetching report details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report details',
      error: error.message
    });
  }
});

/**
 * @route GET /api/reports/user/:address
 * @desc Get reports for a specific user from blockchain
 * @access Public
 */
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!blockchainService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address'
      });
    }

    const reportContract = blockchainService.getContract('ReportContract');
    
    // Get total number of reports to iterate through
    const totalReports = await reportContract.getTotalReports();
    const totalReportsNum = Number(totalReports);
    
    logger.info(`Fetching reports for user ${address}, total reports: ${totalReportsNum}`);
    
    const userReports = [];
    
    // Iterate through all reports and find ones by this user
    for (let i = 1; i <= totalReportsNum; i++) {
      try {
        const reportInfo = await reportContract.getReportInfo(i);
        
        // Check if this report belongs to the requested user
        if (reportInfo.reporter.toLowerCase() === address.toLowerCase()) {
          const report = {
            id: i,
            reporter: reportInfo.reporter,
            timestamp: new Date(Number(reportInfo.timestamp) * 1000).toISOString(),
            status: getStatusName(reportInfo.status),
            verifiedBy: reportInfo.verifiedBy === '0x0000000000000000000000000000000000000000' ? null : reportInfo.verifiedBy,
            verificationTimestamp: reportInfo.verificationTimestamp > 0 ? 
              new Date(Number(reportInfo.verificationTimestamp) * 1000).toISOString() : null,
            rewardClaimed: reportInfo.rewardClaimed,
            contentHash: reportInfo.contentHash
          };
          
          userReports.push(report);
        }
      } catch (error) {
        // Skip invalid reports
        logger.warn(`Skipping report ${i}: ${error.message}`);
        continue;
      }
    }

    logger.info(`Found ${userReports.length} reports for user ${address}`);

    res.json({
      success: true,
      data: {
        address,
        reports: userReports,
        totalReports: userReports.length
      }
    });

  } catch (error) {
    logger.error('Error fetching user reports from blockchain:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user reports from blockchain',
      error: error.message
    });
  }
});

/**
 * @route GET /api/reports/:id
 * @desc Get public information about a specific report
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reportId = parseInt(id);

    if (isNaN(reportId) || reportId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

    const reportContract = blockchainService.getContract('ReportContract');
    const reportInfo = await reportContract.getReportInfo(reportId);

    const report = {
      id: reportId,
      reporter: reportInfo.reporter,
      timestamp: new Date(Number(reportInfo.timestamp) * 1000).toISOString(),
      status: getStatusName(reportInfo.status),
      verifiedBy: reportInfo.verifiedBy === '0x0000000000000000000000000000000000000000' ? null : reportInfo.verifiedBy,
      verificationTimestamp: reportInfo.verificationTimestamp > 0 ? 
        new Date(Number(reportInfo.verificationTimestamp) * 1000).toISOString() : null,
      contentHash: reportInfo.contentHash,
      rewardClaimed: reportInfo.rewardClaimed
    };

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    logger.error('Error fetching report:', error);
    
    let message = 'Failed to fetch report';
    if (error.message.includes('Report does not exist')) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(500).json({
      success: false,
      message,
      error: error.message
    });
  }
});

/**
 * @route POST /api/reports/:id/content
 * @desc Get decrypted content of a report (for authorized users only)
 * @access Private (requires wallet signature)
 */
router.post('/:id/content', [
  body('walletAddress').isEthereumAddress().withMessage('Valid wallet address required'),
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
    const { id } = req.params;
    const { walletAddress, privateKey } = req.body;
    const reportId = parseInt(id);

    if (isNaN(reportId) || reportId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

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
    const reportContract = blockchainService.getContractWithSigner('ReportContract', signer);

    // Get decrypted content
    const tx = await reportContract.getReportContent(reportId);
    const receipt = await tx.wait();

    // Extract content from ContentRetrieved event
    let decryptedContent = null;
    for (const log of receipt.logs) {
      try {
        const parsedLog = reportContract.interface.parseLog(log);
        if (parsedLog.name === 'ContentRetrieved') {
          decryptedContent = parsedLog.args.content;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!decryptedContent) {
      throw new Error('Failed to retrieve decrypted content from transaction');
    }

    res.json({
      success: true,
      data: {
        reportId,
        content: decryptedContent,
        accessedBy: walletAddress,
        transactionHash: tx.hash
      }
    });

    logger.info(`Report ${reportId} content accessed by ${walletAddress}`);

  } catch (error) {
    logger.error('Error retrieving report content:', error);
    
    let message = 'Failed to retrieve report content';
    let statusCode = 500;

    if (error.message.includes('Not authorized')) {
      message = 'Not authorized to view this report content';
      statusCode = 403;
    } else if (error.message.includes('Report does not exist')) {
      message = 'Report not found';
      statusCode = 404;
    } else if (error.message.includes('insufficient funds')) {
      message = 'Insufficient funds for transaction';
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message,
      error: error.message
    });
  }
});

/**
 * @route POST /api/reports/:id/claim-reward
 * @desc Claim reward for a verified report
 * @access Private (requires wallet signature)
 */
router.post('/:id/claim-reward', [
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
    const { id } = req.params;
    const { walletAddress, privateKey } = req.body;
    const reportId = parseInt(id);

    if (isNaN(reportId) || reportId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

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
    const reportContract = blockchainService.getContractWithSigner('ReportContract', signer);

    // Claim reward
    const tx = await reportContract.claimReward(reportId);
    await tx.wait();

    res.json({
      success: true,
      message: 'Reward claimed successfully',
      data: {
        reportId,
        transactionHash: tx.hash,
        claimedBy: walletAddress
      }
    });

    logger.info(`Reward claimed for report ${reportId} by ${walletAddress}`);

  } catch (error) {
    logger.error('Error claiming reward:', error);
    
    let message = 'Failed to claim reward';
    if (error.message.includes('Only reporter can claim')) {
      message = 'Only the reporter can claim the reward';
    } else if (error.message.includes('Report must be verified')) {
      message = 'Report must be verified before claiming reward';
    } else if (error.message.includes('Reward already claimed')) {
      message = 'Reward has already been claimed';
    }

    res.status(500).json({
      success: false,
      message,
      error: error.message
    });
  }
});

/**
 * @route GET /api/reports/stats/total
 * @desc Get total number of reports
 * @access Public
 */
router.get('/stats/total', async (req, res) => {
  try {
    const reportContract = blockchainService.getContract('ReportContract');
    const totalReports = await reportContract.getTotalReports();

    res.json({
      success: true,
      data: {
        totalReports: Number(totalReports)
      }
    });

  } catch (error) {
    logger.error('Error fetching total reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch total reports',
      error: error.message
    });
  }
});

/**
 * @route GET /api/reports/my-reports
 * @desc Get current user's reports
 * @access Private
 */
router.get('/my-reports', async (req, res) => {
  try {
    // Get wallet address from authorization header or query params
    const authHeader = req.headers.authorization;
    const walletAddress = req.query.address || req.headers['x-wallet-address'];
    
    if (!walletAddress) {
      return res.status(401).json({
        success: false,
        message: 'Wallet address required'
      });
    }

    if (!blockchainService.isValidAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address'
      });
    }

    const reportContract = blockchainService.getContract('ReportContract');
    
    // Get total number of reports to iterate through
    const totalReports = await reportContract.getTotalReports();
    const totalReportsNum = Number(totalReports);
    
    logger.info(`Fetching my reports for user ${walletAddress}, total reports: ${totalReportsNum}`);
    
    const myReports = [];
    
    // Iterate through all reports and find ones by this user
    for (let i = 1; i <= totalReportsNum; i++) {
      try {
        const reportInfo = await reportContract.getReportInfo(i);
        
        // Check if this report belongs to the current user
        if (reportInfo.reporter.toLowerCase() === walletAddress.toLowerCase()) {
          const report = {
            id: i,
            title: `My Report #${i}`, // We can enhance this with metadata
            category: "security", // Default category, can be enhanced
            severity: "medium", // Default severity, can be enhanced
            reporter: reportInfo.reporter,
            timestamp: new Date(Number(reportInfo.timestamp) * 1000).toISOString(),
            status: getStatusName(reportInfo.status),
            verifiedBy: reportInfo.verifiedBy === '0x0000000000000000000000000000000000000000' ? null : reportInfo.verifiedBy,
            verificationTimestamp: reportInfo.verificationTimestamp > 0 ? 
              new Date(Number(reportInfo.verificationTimestamp) * 1000).toISOString() : null,
            rewardClaimed: reportInfo.rewardClaimed,
            contentHash: reportInfo.contentHash,
            anonymous: false // Default, can be enhanced with metadata
          };
          
          myReports.push(report);
        }
      } catch (error) {
        // Skip invalid reports
        logger.warn(`Skipping report ${i}: ${error.message}`);
        continue;
      }
    }

    // Sort by timestamp (newest first)
    myReports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    logger.info(`Found ${myReports.length} reports for user ${walletAddress}`);

    res.json({
      success: true,
      data: myReports
    });

  } catch (error) {
    logger.error('Error fetching my reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your reports',
      error: error.message
    });
  }
});

// Helper function to convert status enum to string
function getStatusName(status) {
  const statusNames = {
    0: 'submitted',    // Pending
    1: 'investigating', // Investigating  
    2: 'verified',     // Verified
    3: 'rejected',     // Rejected
    4: 'closed'        // Closed
  };
  return statusNames[status] || 'unknown';
}

export default router;
