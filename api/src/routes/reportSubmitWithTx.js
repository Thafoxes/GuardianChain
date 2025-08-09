const express = require('express');
const { body, validationResult } = require('express-validator');
const blockchainService = require('../services/blockchain');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route POST /api/reports/submit-with-tx
 * @desc Record a report that was already submitted to blockchain via MetaMask
 * @access Public
 */
router.post('/submit-with-tx', [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('walletAddress').isEthereumAddress().withMessage('Valid wallet address is required'),
  body('transactionHash').matches(/^0x[a-fA-F0-9]{64}$/).withMessage('Valid transaction hash is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { 
      title, 
      content, 
      category = 'General', 
      severity = 'Medium',
      evidence = '', 
      anonymous = false, 
      walletAddress,
      transactionHash
    } = req.body;

    // Verify the transaction exists and was successful
    const provider = blockchainService.getProvider();
    const receipt = await provider.getTransactionReceipt(transactionHash);
    
    if (!receipt) {
      return res.status(400).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (receipt.status !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Transaction failed'
      });
    }

    // Verify the transaction was sent to the ReportContract
    const reportContractAddress = blockchainService.getContractAddress('ReportContract');
    if (receipt.to.toLowerCase() !== reportContractAddress.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Transaction was not sent to the report contract'
      });
    }

    // Verify the transaction was sent by the claimed wallet address
    if (receipt.from.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Transaction was not sent by the claimed wallet address'
      });
    }

    // Get report ID from the transaction logs
    const reportContract = blockchainService.getContract('ReportContract');
    let reportId = null;
    
    for (const log of receipt.logs) {
      try {
        const parsedLog = reportContract.interface.parseLog(log);
        if (parsedLog.name === 'ReportSubmitted') {
          reportId = parsedLog.args.reportId.toString();
          logger.info(`Found report ID: ${reportId} in transaction ${transactionHash}`);
          break;
        }
      } catch (error) {
        // Skip logs that can't be parsed
        continue;
      }
    }

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: 'Could not find ReportSubmitted event in transaction'
      });
    }

    // Create the report record for tracking
    const reportRecord = {
      id: parseInt(reportId),
      title,
      content,
      category,
      severity,
      evidence,
      anonymous,
      submitter: walletAddress,
      transactionHash,
      blockNumber: receipt.blockNumber,
      timestamp: new Date().toISOString(),
      status: 'submitted',
      gasUsed: receipt.gasUsed.toString()
    };

    logger.info(`Report submitted successfully via MetaMask: ${JSON.stringify({
      reportId,
      submitter: walletAddress,
      txHash: transactionHash,
      blockNumber: receipt.blockNumber,
      title: title.substring(0, 50) + '...'
    })}`);

    res.json({
      success: true,
      message: 'Report recorded successfully',
      data: {
        reportId: parseInt(reportId),
        txHash: transactionHash,
        blockNumber: receipt.blockNumber,
        report: reportRecord
      }
    });

  } catch (error) {
    logger.error('Error recording report from transaction:', error);
    
    let message = 'Failed to record report';
    if (error.message.includes('Transaction not found')) {
      message = 'Transaction not found on blockchain';
    } else if (error.message.includes('network')) {
      message = 'Network error while verifying transaction';
    }

    res.status(500).json({
      success: false,
      message,
      error: error.message
    });
  }
});

module.exports = router;
