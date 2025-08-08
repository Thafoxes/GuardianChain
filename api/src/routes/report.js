import express from 'express';
import { body, validationResult } from 'express-validator';
import blockchainService from '../services/blockchain.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

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
    const { 
      title, 
      content, 
      category = 'other', 
      severity = 'medium', 
      evidence = '', 
      anonymous = false, 
      walletAddress 
    } = req.body;

    // For now, we'll simulate the report submission since we can't access MetaMask private keys
    // In production, this would integrate with a proper signature verification system
    
    // Generate a mock transaction hash and report ID for testing
    const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
    const mockReportId = Math.floor(Math.random() * 10000) + 1;

    // Store report data (in production, this would be in a database)
    const reportData = {
      id: mockReportId,
      title,
      content,
      category,
      severity,
      evidence,
      anonymous,
      walletAddress: walletAddress.toLowerCase(),
      status: 'submitted',
      timestamp: new Date().toISOString(),
      txHash: mockTxHash
    };

    // Log the submission
    logger.info(`Report submitted: ${JSON.stringify({
      id: mockReportId,
      title,
      category,
      severity,
      walletAddress,
      anonymous
    })}`);

    res.json({
      success: true,
      message: 'Report submitted successfully',
      data: {
        reportId: mockReportId,
        txHash: mockTxHash,
        report: {
          id: mockReportId,
          title,
          category,
          severity,
          status: 'submitted',
          timestamp: reportData.timestamp,
          anonymous
        }
      }
    });

  } catch (error) {
    logger.error('Error submitting report:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: error.message
    });
  }
});

/**
 * @route GET /api/reports
 * @desc Get all reports (with pagination and filtering)
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const { 
      status = 'all', 
      category = 'all', 
      limit = 20, 
      offset = 0 
    } = req.query;

    // Mock reports for testing (in production, this would query the blockchain and database)
    const mockReports = [
      {
        id: 1,
        title: "Critical Smart Contract Vulnerability in DeFi Protocol",
        category: "security",
        severity: "critical",
        status: "investigating",
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        reporter: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        anonymous: false,
        rewardClaimed: false
      },
      {
        id: 2,
        title: "Fraudulent Token Sale Scheme",
        category: "fraud",
        severity: "high",
        status: "verified",
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        reporter: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
        anonymous: true,
        rewardClaimed: true
      },
      {
        id: 3,
        title: "Governance Proposal Manipulation",
        category: "governance",
        severity: "medium",
        status: "submitted",
        timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        reporter: "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
        anonymous: false,
        rewardClaimed: false
      }
    ];

    // Filter reports based on query parameters
    let filteredReports = mockReports;
    
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

    res.json({
      success: true,
      data: {
        reports: paginatedReports,
        total: filteredReports.length,
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
 * @desc Get reports for a specific user
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
    const reportIds = await reportContract.getUserReports(address);

    // Get detailed info for each report
    const reports = await Promise.all(
      reportIds.map(async (id) => {
        const reportInfo = await reportContract.getReportInfo(id);
        return {
          id: Number(id),
          reporter: reportInfo.reporter,
          timestamp: new Date(Number(reportInfo.timestamp) * 1000).toISOString(),
          status: getStatusName(reportInfo.status),
          verifiedBy: reportInfo.verifiedBy === '0x0000000000000000000000000000000000000000' ? null : reportInfo.verifiedBy,
          verificationTimestamp: reportInfo.verificationTimestamp > 0 ? 
            new Date(Number(reportInfo.verificationTimestamp) * 1000).toISOString() : null,
          rewardClaimed: reportInfo.rewardClaimed
        };
      })
    );

    res.json({
      success: true,
      data: {
        address,
        reports,
        totalReports: reports.length
      }
    });

  } catch (error) {
    logger.error('Error fetching user reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user reports',
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

// Helper function to convert status enum to string
function getStatusName(status) {
  const statusNames = ['Pending', 'Investigating', 'Verified', 'Rejected', 'Closed'];
  return statusNames[status] || 'Unknown';
}

export default router;
