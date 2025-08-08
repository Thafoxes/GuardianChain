import express from 'express';
import { body, validationResult } from 'express-validator';
import blockchainService from '../services/blockchain.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * @route POST /api/reports/submit
 * @desc Submit a new encrypted report
 * @access Private (requires wallet signature)
 */
router.post('/submit', [
  body('content').isLength({ min: 1, max: 10000 }).withMessage('Content must be between 1 and 10000 characters'),
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
    const { content, walletAddress, privateKey } = req.body;

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

    // Submit report
    const tx = await reportContract.submitReport(content);
    await tx.wait();

    // Get report ID from events
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => {
      try {
        const parsedLog = reportContract.interface.parseLog(log);
        return parsedLog.name === 'ReportSubmitted';
      } catch {
        return false;
      }
    });

    let reportId = null;
    if (event) {
      const parsedLog = reportContract.interface.parseLog(event);
      reportId = Number(parsedLog.args.reportId);
    }

    res.json({
      success: true,
      message: 'Report submitted successfully',
      data: {
        reportId,
        transactionHash: tx.hash,
        from: walletAddress
      }
    });

    logger.info(`Report submitted by ${walletAddress}, TX: ${tx.hash}`);

  } catch (error) {
    logger.error('Error submitting report:', error);
    
    let message = 'Failed to submit report';
    if (error.message.includes('User must be verified')) {
      message = 'User must be verified before submitting reports';
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
