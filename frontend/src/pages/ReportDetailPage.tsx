import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, AlertTriangle, CheckCircle, FileText, Clock, Award, Lock } from 'lucide-react';
import { reportApi } from '../services/api';
import { blockchainService } from '../services/blockchain';
import { Report } from '../types';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';

const ReportDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { wallet } = useWallet();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [decryptedContent, setDecryptedContent] = useState<any | null>(null);
  const [decrypting, setDecrypting] = useState(false);

  const statusIcons = {
    submitted: Clock,
    investigating: AlertTriangle,
    verified: CheckCircle,
    rejected: FileText
  };

  const statusColors = {
    submitted: 'text-blue-600 bg-blue-50',
    investigating: 'text-yellow-600 bg-yellow-50',
    verified: 'text-green-600 bg-green-50',
    rejected: 'text-red-600 bg-red-50'
  };

  const severityColors = {
    low: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    high: 'text-orange-600 bg-orange-50',
    critical: 'text-red-600 bg-red-50'
  };

  useEffect(() => {
    if (id) {
      fetchReport(id);
    }
  }, [id]);

  const fetchReport = async (reportId: string) => {
    try {
      setLoading(true);
      const response = await reportApi.getReport(reportId);
      if (response.data) {
        setReport(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch report:', error);
      toast.error('Failed to load report details');
    } finally {
      setLoading(false);
    }
  };

  const handleDecryptContent = async () => {
    if (!wallet.isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setDecrypting(true);
      
      // Connect to blockchain service first to get current network info
      if (!blockchainService.isConnected()) {
        await blockchainService.connectWallet();
      }

      // Check if we're on the correct network
      const isCorrectNetwork = await blockchainService.isCorrectNetwork();
      if (!isCorrectNetwork) {
        // Try to switch to the correct network
        try {
          await blockchainService.switchToSapphireLocalnet();
          // Recheck after switching
          const recheckNetwork = await blockchainService.isCorrectNetwork();
          if (!recheckNetwork) {
            toast.error('Failed to switch to Sapphire Localnet. Please switch manually in MetaMask.');
            return;
          }
        } catch (switchError: any) {
          toast.error(`Failed to switch network: ${switchError.message}`);
          return;
        }
      }

      // Decrypt the report content
      const decryptedData = await blockchainService.getReportContent(parseInt(id!));
      setDecryptedContent(decryptedData);
      toast.success('Report content decrypted successfully');

    } catch (error: any) {
      console.error('Failed to decrypt content:', error);
      toast.error(error.message || 'Failed to decrypt report content');
    } finally {
      setDecrypting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const IconComponent = statusIcons[status as keyof typeof statusIcons] || FileText;
    return IconComponent;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/reports"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
          <div className="text-center">
            <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Report Not Found</h2>
            <p className="text-gray-600">The report you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(report.status || 'submitted');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/reports"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{report.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(report.timestamp || new Date().toISOString())}
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {report.anonymous ? 'Anonymous' : formatAddress(report.reporter || '')}
                </div>
              </div>
              {!report.anonymous && report.reporter && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center text-blue-700">
                    <User className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Submitted by wallet:</span>
                    <span className="ml-2 font-mono text-xs">{report.reporter}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${severityColors[report.severity as keyof typeof severityColors] || 'text-gray-600 bg-gray-50'}`}>
                <AlertTriangle className="w-4 h-4 mr-1" />
                {(report.severity || 'unknown').charAt(0).toUpperCase() + (report.severity || 'unknown').slice(1)}
              </span>
              
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[report.status as keyof typeof statusColors] || 'text-gray-600 bg-gray-50'}`}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {report.status?.charAt(0).toUpperCase() + report.status?.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Report Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Report Details</h2>
                {!decryptedContent && (
                  <button
                    onClick={handleDecryptContent}
                    disabled={decrypting}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {decrypting ? 'Decrypting...' : 'Decrypt with MetaMask'}
                  </button>
                )}
              </div>
              
              <div className="prose max-w-none">
                {decryptedContent ? (
                  <div>
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center text-green-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Content decrypted successfully</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{decryptedContent.title}</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {decryptedContent.content}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Lock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      This report content is encrypted. Only the reporter and authorized verifiers can view the full content.
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Public summary: {report.content || 'No public summary available.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Evidence */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Evidence</h2>
              {decryptedContent?.evidence ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed font-mono text-sm">
                    {decryptedContent.evidence}
                  </p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Lock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    Evidence is encrypted and requires content decryption to view.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Report Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-gray-900 capitalize">{report.category}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Report ID</label>
                  <p className="text-gray-900">#{report.id}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Reporter</label>
                  <p className="text-gray-900">
                    {report.anonymous ? 'Anonymous Reporter' : formatAddress(report.reporter || '')}
                  </p>
                  {!report.anonymous && report.reporter && (
                    <p className="text-xs text-gray-500 font-mono mt-1 break-all">
                      {report.reporter}
                    </p>
                  )}
                </div>

                {report.investigator && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Investigator</label>
                    <p className="text-gray-900">{formatAddress(report.investigator)}</p>
                  </div>
                )}

                {report.verificationTimestamp && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Verified</label>
                    <p className="text-gray-900">{formatDate(report.verificationTimestamp)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reward Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reward Status</h3>
              <div className="flex items-center">
                <Award className={`w-5 h-5 mr-2 ${report.rewardClaimed ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${report.rewardClaimed ? 'text-green-700' : 'text-gray-500'}`}>
                  {report.rewardClaimed ? 'Reward Claimed' : 'Reward Pending'}
                </span>
              </div>
              {report.status === 'verified' && !report.rewardClaimed && (
                <p className="text-sm text-gray-600 mt-2">
                  This report has been verified and is eligible for reward claiming.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailPage;
