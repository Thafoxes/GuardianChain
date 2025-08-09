import express from 'express';
import { body, validationResult } from 'express-validator';
import { ethers } from 'ethers';
import blockchainService from '../services/blockchain.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * @route POST /api/admin/verify-user
 * @desc Verify a registered user (admin only)
 * @access Private (Admin)
 */
router.post('/verify-user', [
  body('userAddress').isEthereumAddress().withMessage('Valid user address required'),
  body('adminAddress').isEthereumAddress().withMessage('Valid admin address required'),
  body('privateKey').isLength({ min: 1 }).withMessage('Admin private key required')
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
    const { userAddress, adminAddress, privateKey } = req.body;

    // Create admin signer
    const adminSigner = blockchainService.createSigner(privateKey);
    
    // Verify admin address
    if (adminSigner.address.toLowerCase() !== adminAddress.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Private key does not match admin address'
      });
    }

    // Get contract with admin signer
    const userVerification = blockchainService.getContractWithSigner('UserVerification', adminSigner);

    // Verify user
    const tx = await userVerification.verifyUser(userAddress);
    await tx.wait();

    res.json({
      success: true,
      message: 'User verified successfully',
      data: {
        userAddress,
        verifiedBy: adminAddress,
        transactionHash: tx.hash
      }
    });

    logger.info(`User ${userAddress} verified by admin ${adminAddress}`);

  } catch (error) {
    logger.error('Error verifying user:', error);
    
    let message = 'Failed to verify user';
    if (error.message.includes('Only admin')) {
      message = 'Only admin can verify users';
    } else if (error.message.includes('User not registered')) {
      message = 'User must be registered before verification';
    }

    res.status(500).json({
      success: false,
      message,
      error: error.message
    });
  }
});

/**
 * @route POST /api/admin/add-verifier
 * @desc Add authorized verifier for reports
 * @access Private (Admin)
 */
router.post('/add-verifier', [
  body('verifierAddress').isEthereumAddress().withMessage('Valid verifier address required'),
  body('adminAddress').isEthereumAddress().withMessage('Valid admin address required'),
  body('privateKey').isLength({ min: 1 }).withMessage('Admin private key required')
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
    const { verifierAddress, adminAddress, privateKey } = req.body;

    // Create admin signer
    const adminSigner = blockchainService.createSigner(privateKey);
    
    // Verify admin address
    if (adminSigner.address.toLowerCase() !== adminAddress.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Private key does not match admin address'
      });
    }

    // Get contract with admin signer
    const reportContract = blockchainService.getContractWithSigner('ReportContract', adminSigner);

    // Add verifier
    const tx = await reportContract.addVerifier(verifierAddress);
    await tx.wait();

    res.json({
      success: true,
      message: 'Verifier added successfully',
      data: {
        verifierAddress,
        addedBy: adminAddress,
        transactionHash: tx.hash
      }
    });

    logger.info(`Verifier ${verifierAddress} added by admin ${adminAddress}`);

  } catch (error) {
    logger.error('Error adding verifier:', error);
    
    let message = 'Failed to add verifier';
    if (error.message.includes('Only admin')) {
      message = 'Only admin can add verifiers';
    }

    res.status(500).json({
      success: false,
      message,
      error: error.message
    });
  }
});

/**
 * @route POST /api/admin/update-report-status
 * @desc Update report status (verifiers only)
 * @access Private (Verifier)
 */
router.post('/update-report-status', [
  body('reportId').isInt({ min: 1 }).withMessage('Valid report ID required'),
  body('status').isIn(['0', '1', '2', '3', '4']).withMessage('Valid status required (0-4)'),
  body('verifierAddress').isEthereumAddress().withMessage('Valid verifier address required'),
  body('privateKey').isLength({ min: 1 }).withMessage('Verifier private key required')
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
    const { reportId, status, verifierAddress, privateKey } = req.body;

    // Create verifier signer
    const verifierSigner = blockchainService.createSigner(privateKey);
    
    // Verify verifier address
    if (verifierSigner.address.toLowerCase() !== verifierAddress.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Private key does not match verifier address'
      });
    }

    // Get contract with verifier signer
    const reportContract = blockchainService.getContractWithSigner('ReportContract', verifierSigner);

    // Update status
    const tx = await reportContract.updateReportStatus(reportId, parseInt(status));
    await tx.wait();

    const statusNames = ['Pending', 'Investigating', 'Verified', 'Rejected', 'Closed'];

    res.json({
      success: true,
      message: 'Report status updated successfully',
      data: {
        reportId,
        newStatus: statusNames[parseInt(status)],
        updatedBy: verifierAddress,
        transactionHash: tx.hash
      }
    });

    logger.info(`Report ${reportId} status updated to ${statusNames[parseInt(status)]} by ${verifierAddress}`);

  } catch (error) {
    logger.error('Error updating report status:', error);
    
    let message = 'Failed to update report status';
    if (error.message.includes('Not authorized')) {
      message = 'Not authorized to verify reports';
    } else if (error.message.includes('Report does not exist')) {
      message = 'Report not found';
    }

    res.status(500).json({
      success: false,
      message,
      error: error.message
    });
  }
});

/**
 * @route GET /api/admin/reports/status/:status
 * @desc Get reports by status (for verifiers)
 * @access Private (Verifier)
 */
router.post('/reports/status/:status', [
  body('verifierAddress').isEthereumAddress().withMessage('Valid verifier address required'),
  body('privateKey').isLength({ min: 1 }).withMessage('Verifier private key required'),
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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
    const { status } = req.params;
    const { verifierAddress, privateKey, limit = 10 } = req.body;

    const statusInt = parseInt(status);
    if (isNaN(statusInt) || statusInt < 0 || statusInt > 4) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be 0-4'
      });
    }

    // Create verifier signer
    const verifierSigner = blockchainService.createSigner(privateKey);
    
    // Verify verifier address
    if (verifierSigner.address.toLowerCase() !== verifierAddress.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Private key does not match verifier address'
      });
    }

    // Get contract with verifier signer
    const reportContract = blockchainService.getContractWithSigner('ReportContract', verifierSigner);

    // Get reports by status
    const reportIds = await reportContract.getReportsByStatus(statusInt, limit);

    // Get detailed info for each report
    const reports = await Promise.all(
      reportIds.map(async (id) => {
        if (Number(id) === 0) return null; // Skip empty slots
        
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

    // Filter out null entries
    const validReports = reports.filter(report => report !== null);

    const statusNames = ['Pending', 'Investigating', 'Verified', 'Rejected', 'Closed'];

    res.json({
      success: true,
      data: {
        status: statusNames[statusInt],
        reports: validReports,
        totalFound: validReports.length,
        requestedBy: verifierAddress
      }
    });

  } catch (error) {
    logger.error('Error fetching reports by status:', error);
    
    let message = 'Failed to fetch reports';
    if (error.message.includes('Not authorized')) {
      message = 'Not authorized to access reports';
    }

    res.status(500).json({
      success: false,
      message,
      error: error.message
    });
  }
});

/**
 * @route GET /api/admin/stats
 * @desc Get admin dashboard statistics
 * @access Public
 */
router.get('/stats', async (req, res) => {
  try {
    const reportContract = blockchainService.getContract('ReportContract');
    const userVerification = blockchainService.getContract('UserVerification');

    const [totalReports, totalUsers] = await Promise.all([
      reportContract.getTotalReports(),
      userVerification.getTotalUsers()
    ]);

    res.json({
      success: true,
      data: {
        totalReports: Number(totalReports),
        totalUsers: Number(totalUsers),
        network: process.env.NETWORK || 'localnet'
      }
    });

  } catch (error) {
    logger.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * @route POST /api/admin/reports/reward
 * @desc Verify a report so reporter can claim reward (admin only)
 * @access Private (Admin)
 */
router.post('/reports/reward', [
  body('reportId').isInt({ min: 1 }).withMessage('Valid report ID required'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
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
    const { reportId, reason } = req.body;

    // Use admin credentials from environment
    const adminPrivateKey = process.env.BACKEND_PRIVATE_KEY || process.env.TESTNET_PRIVATE_KEY;
    if (!adminPrivateKey) {
      return res.status(500).json({
        success: false,
        message: 'Admin service not configured'
      });
    }

    const adminSigner = blockchainService.createSigner(adminPrivateKey);
    const reportContract = blockchainService.getContractWithSigner('ReportContract', adminSigner);

    // Get report details
    const reportData = await reportContract.getReport(reportId);
    const reporterAddress = reportData.reporter;

    // Check if report exists and is in valid state
    if (reportData.status === 4) { // Already closed
      return res.status(400).json({
        success: false,
        message: 'Report is already closed'
      });
    }

    if (reportData.status === 2) { // Already verified
      return res.status(400).json({
        success: false,
        message: 'Report is already verified. Reporter can claim reward.',
        data: {
          reportId,
          status: 'verified',
          reporterAddress,
          canClaimReward: !reportData.rewardClaimed
        }
      });
    }

    // Step 1: Update report status to Verified (status = 2)
    // This will automatically mint VERIFICATION_REWARD to the admin who verified it
    logger.info(`🔄 Verifying report ${reportId} by admin ${adminSigner.address}`);
    const verifyTx = await reportContract.updateReportStatus(reportId, 2); // 2 = Verified
    await verifyTx.wait();
    logger.info(`✅ Report ${reportId} verified: ${verifyTx.hash}`);

    res.json({
      success: true,
      message: `Report ${reportId} verified successfully. Reporter can now claim their reward.`,
      data: {
        reportId,
        status: 'verified',
        reporterAddress,
        verifyTxHash: verifyTx.hash,
        reason: reason || 'Report validated by admin',
        note: 'Reporter must call claimReward() function to receive tokens'
      }
    });

    logger.info(`🎉 Report ${reportId} verified by admin: ${adminSigner.address}`);

  } catch (error) {
    logger.error('Error verifying report:', error);
    
    let message = 'Failed to verify report';
    if (error.message.includes('Report not found')) {
      message = 'Report not found';
    } else if (error.message.includes('Only admin') || error.message.includes('Only authorized')) {
      message = 'Not authorized to verify reports';
    } else if (error.message.includes('Cannot update closed report')) {
      message = 'Cannot update a closed report';
    }

    res.status(500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/admin/reports/cancel
 * @desc Reject a report and mark it as invalid (admin only)
 * @access Private (Admin)
 */
router.post('/reports/cancel', [
  body('reportId').isInt({ min: 1 }).withMessage('Valid report ID required'),
  body('reason').isLength({ min: 1, max: 500 }).withMessage('Rejection reason is required (max 500 characters)')
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
    const { reportId, reason } = req.body;

    // Use admin credentials from environment
    const adminPrivateKey = process.env.BACKEND_PRIVATE_KEY || process.env.TESTNET_PRIVATE_KEY;
    if (!adminPrivateKey) {
      return res.status(500).json({
        success: false,
        message: 'Admin service not configured'
      });
    }

    const adminSigner = blockchainService.createSigner(adminPrivateKey);
    const reportContract = blockchainService.getContractWithSigner('ReportContract', adminSigner);

    // Get report details
    const reportData = await reportContract.getReport(reportId);

    // Check if report exists and is in valid state
    if (reportData.status === 4) { // Already closed
      return res.status(400).json({
        success: false,
        message: 'Report is already closed'
      });
    }

    if (reportData.status === 3) { // Already rejected
      return res.status(400).json({
        success: false,
        message: 'Report is already rejected'
      });
    }

    // Update report status to rejected (status = 3)
    logger.info(`🔄 Rejecting report ${reportId} - Reason: ${reason}`);
    const updateTx = await reportContract.updateReportStatus(reportId, 3); // 3 = REJECTED
    await updateTx.wait();
    logger.info(`✅ Report ${reportId} marked as rejected: ${updateTx.hash}`);

    res.json({
      success: true,
      message: `Report ${reportId} rejected successfully`,
      data: {
        reportId,
        status: 'rejected',
        reason,
        txHash: updateTx.hash
      }
    });

    logger.info(`🚫 Report ${reportId} rejected by admin: ${adminSigner.address} - Reason: ${reason}`);

  } catch (error) {
    logger.error('Error rejecting report:', error);
    
    let message = 'Failed to reject report';
    if (error.message.includes('Report not found')) {
      message = 'Report not found';
    } else if (error.message.includes('Only admin') || error.message.includes('Only authorized')) {
      message = 'Not authorized to reject reports';
    } else if (error.message.includes('Cannot update closed report')) {
      message = 'Cannot update a closed report';
    }

    res.status(500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/admin/reports/close
 * @desc Close a verified report case (admin only)
 * @access Private (Admin)
 */
router.post('/reports/close', [
  body('reportId').isInt({ min: 1 }).withMessage('Valid report ID required'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
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
    const { reportId, reason } = req.body;

    // Use admin credentials from environment
    const adminPrivateKey = process.env.BACKEND_PRIVATE_KEY || process.env.TESTNET_PRIVATE_KEY;
    if (!adminPrivateKey) {
      return res.status(500).json({
        success: false,
        message: 'Admin service not configured'
      });
    }

    const adminSigner = blockchainService.createSigner(adminPrivateKey);
    const reportContract = blockchainService.getContractWithSigner('ReportContract', adminSigner);

    // Get report details
    const reportData = await reportContract.getReport(reportId);

    // Check if report exists and is in valid state
    if (reportData.status === 4) { // Already closed
      return res.status(400).json({
        success: false,
        message: 'Report is already closed'
      });
    }

    // Update report status to closed (status = 4)
    logger.info(`🔄 Closing report ${reportId} - Reason: ${reason || 'Case resolved'}`);
    const updateTx = await reportContract.updateReportStatus(reportId, 4); // 4 = CLOSED
    await updateTx.wait();
    logger.info(`✅ Report ${reportId} marked as closed: ${updateTx.hash}`);

    res.json({
      success: true,
      message: `Report ${reportId} closed successfully`,
      data: {
        reportId,
        status: 'closed',
        reason: reason || 'Case resolved',
        txHash: updateTx.hash
      }
    });

    logger.info(`🔒 Report ${reportId} closed by admin: ${adminSigner.address}`);

  } catch (error) {
    logger.error('Error closing report:', error);
    
    let message = 'Failed to close report';
    if (error.message.includes('Report not found')) {
      message = 'Report not found';
    } else if (error.message.includes('Only admin') || error.message.includes('Only authorized')) {
      message = 'Not authorized to close reports';
    } else if (error.message.includes('Cannot update closed report')) {
      message = 'Report is already closed';
    }

    res.status(500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function
function getStatusName(status) {
  const statusNames = ['Pending', 'Investigating', 'Verified', 'Rejected', 'Closed'];
  return statusNames[status] || 'Unknown';
}

export default router;
