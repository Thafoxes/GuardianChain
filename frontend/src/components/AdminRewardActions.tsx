import React, { useState } from 'react';
import { Award, X, Ban, AlertTriangle, CheckCircle } from 'lucide-react';
import { blockchainService } from '../services/blockchain';
import { Report } from '../types';
import toast from 'react-hot-toast';

interface AdminRewardActionsProps {
  report: Report;
  onReportUpdated: (updatedReport: Report) => void;
}

const AdminRewardActions: React.FC<AdminRewardActionsProps> = ({ report, onReportUpdated }) => {
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [verifyReason, setVerifyReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [closeReason, setCloseReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Don't show actions if report is already closed or rejected
  if (report.status === 'closed' || report.status === 'rejected') {
    return null;
  }

  const handleVerifyReport = async () => {
    try {
      setLoading(true);
      
      // Use blockchain service to update status directly
      const txHash = await blockchainService.updateReportStatus(
        report.id, 
        blockchainService.getStatusNumber('verified')
      );

      toast.success(`Report verified! Transaction: ${txHash.slice(0, 10)}...`);
      
      // Update report status
      const updatedReport: Report = {
        ...report,
        status: 'verified'
      };
      
      onReportUpdated(updatedReport);
      setShowVerifyModal(false);
      setVerifyReason('');
    } catch (error: any) {
      console.error('Error verifying report:', error);
      
      if (error.message.includes('user rejected')) {
        toast.error('Transaction was cancelled by user');
      } else if (error.message.includes('Not authorized')) {
        toast.error('You are not authorized to verify reports');
      } else {
        toast.error(error.message || 'Failed to verify report');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRejectReport = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setLoading(true);
      
      // Use blockchain service to update status directly
      const txHash = await blockchainService.updateReportStatus(
        report.id, 
        blockchainService.getStatusNumber('rejected')
      );

      toast.success(`Report rejected! Transaction: ${txHash.slice(0, 10)}...`);
      
      // Update report status
      const updatedReport: Report = {
        ...report,
        status: 'rejected'
      };
      
      onReportUpdated(updatedReport);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (error: any) {
      console.error('Error rejecting report:', error);
      
      if (error.message.includes('user rejected')) {
        toast.error('Transaction was cancelled by user');
      } else if (error.message.includes('Not authorized')) {
        toast.error('You are not authorized to update reports');
      } else {
        toast.error(error.message || 'Failed to reject report');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseReport = async () => {
    try {
      setLoading(true);
      
      // Use blockchain service to update status directly
      const txHash = await blockchainService.updateReportStatus(
        report.id, 
        blockchainService.getStatusNumber('closed')
      );

      toast.success(`Case closed! Transaction: ${txHash.slice(0, 10)}...`);
      
      // Update report status
      const updatedReport: Report = {
        ...report,
        status: 'closed'
      };
      
      onReportUpdated(updatedReport);
      setShowCloseModal(false);
      setCloseReason('');
    } catch (error: any) {
      console.error('Error closing case:', error);
      
      if (error.message.includes('user rejected')) {
        toast.error('Transaction was cancelled by user');
      } else if (error.message.includes('Not authorized')) {
        toast.error('You are not authorized to close reports');
      } else {
        toast.error(error.message || 'Failed to close case');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
          <h3 className="text-lg font-semibold text-yellow-800">Admin Actions</h3>
        </div>
      </div>
      
      <p className="text-yellow-700 mb-4">
        {report.status === 'verified' 
          ? "This report has been verified. You can close the case when the investigation is complete."
          : "Review this report and take appropriate action. Verified reports allow reporters to claim their stake as reward."
        }
      </p>

      <div className="flex gap-3">
        {report.status === 'verified' && (
          <button
            onClick={() => setShowCloseModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Close Case
          </button>
        )}
        
        {(report.status === 'submitted' || report.status === 'investigating') && (
          <>
            <button
              onClick={() => setShowVerifyModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Award className="h-4 w-4 mr-2" />
              Verify Report
            </button>
            
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <Ban className="h-4 w-4 mr-2" />
              Reject Report
            </button>
          </>
        )}
      </div>

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Verify Report</h3>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Notes (Optional)
                </label>
                <textarea
                  value={verifyReason}
                  onChange={(e) => setVerifyReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Add any notes about the verification..."
                />
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800">
                  <strong>Action:</strong> This will mark the report as verified and allow the reporter 
                  to claim their staked tokens as a reward. The reporter will need to claim the reward themselves.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleVerifyReport}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Report'}
              </button>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reject Report</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Explain why this report is being rejected (e.g., not relevant, duplicate, false information)..."
                  required
                />
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This will mark the report as rejected and the reporter's 
                  stake will be forfeited. This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleRejectReport}
                disabled={loading || !rejectReason.trim()}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Rejecting...' : 'Reject Report'}
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Close Case</h3>
              <button
                onClick={() => setShowCloseModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Closure Notes (Optional)
                </label>
                <textarea
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any final notes about closing this case..."
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Action:</strong> This will mark the case as closed. The investigation is complete 
                  and no further action is needed. This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseReport}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Closing...' : 'Close Case'}
              </button>
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRewardActions;
