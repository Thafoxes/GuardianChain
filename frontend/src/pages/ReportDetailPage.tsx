import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, AlertTriangle, CheckCircle, FileText, Clock, Award, Lock } from 'lucide-react';
import { reportApi } from '../services/api';
import { blockchainService } from '../services/blockchain';
import { Report } from '../types';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import AdminRewardActions from '../components/AdminRewardActions';
import toast from 'react-hot-toast';

const ReportDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { wallet } = useWallet();
  const { isAdmin } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [decryptedContent, setDecryptedContent] = useState<any | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [isBlockchainAdmin, setIsBlockchainAdmin] = useState(false);

  // Check if user is admin (either via auth context or blockchain)
  const isUserAdmin = () => {
    return isAdmin() || isBlockchainAdmin;
  };

  const statusIcons = {
    submitted: Clock,
    investigating: AlertTriangle,
    verified: CheckCircle,
    rejected: FileText,
    closed: Award,
    cancelled: AlertTriangle
  };

  const statusColors = {
    submitted: 'text-blue-600 bg-blue-50',
    investigating: 'text-yellow-600 bg-yellow-50',
    verified: 'text-green-600 bg-green-50',
    rejected: 'text-red-600 bg-red-50',
    closed: 'text-purple-600 bg-purple-50',
    cancelled: 'text-gray-600 bg-gray-50'
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

  // Check blockchain admin status when wallet connects
  useEffect(() => {
    const checkBlockchainAdmin = async () => {
      if (wallet.isConnected && wallet.address) {
        try {
          if (!blockchainService.isConnected()) {
            await blockchainService.initializeFromExistingProvider();
          }
          const roles = await blockchainService.getUserRoles(wallet.address);
          setIsBlockchainAdmin(roles.isAdmin || roles.isVerifier);
        } catch (error) {
          console.error('Failed to check blockchain admin status:', error);
          setIsBlockchainAdmin(false);
        }
      } else {
        setIsBlockchainAdmin(false);
      }
    };

    checkBlockchainAdmin();
  }, [wallet.isConnected, wallet.address]);

  const fetchReport = async (reportId: string) => {
    try {
      setLoading(true);
      
      // Initialize blockchain service if needed
      if (!blockchainService.isConnected()) {
        await blockchainService.initializeFromExistingProvider();
      }
      
      // Get report info from blockchain
      const reportNumber = parseInt(reportId);
      console.log('📄 Fetching report from blockchain:', reportNumber);
      
      // Create contract instance to get report info
      const ethers = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        import.meta.env.VITE_CONTRACT_ADDRESS_REPORT_CONTRACT,
        [
          {
            "inputs": [{"internalType": "uint256", "name": "reportId", "type": "uint256"}],
            "name": "getReportInfo",
            "outputs": [
              {"internalType": "uint256", "name": "id", "type": "uint256"},
              {"internalType": "address", "name": "reporter", "type": "address"},
              {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
              {"internalType": "uint8", "name": "status", "type": "uint8"},
              {"internalType": "address", "name": "verifiedBy", "type": "address"},
              {"internalType": "uint256", "name": "verificationTimestamp", "type": "uint256"},
              {"internalType": "bytes32", "name": "contentHash", "type": "bytes32"},
              {"internalType": "bool", "name": "rewardClaimed", "type": "bool"}
            ],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        provider
      );
      
      // Fetch actual report data from blockchain
      const reportInfo = await contract.getReportInfo(reportNumber);
      console.log('📄 Report info from blockchain:', reportInfo);
      
      // Convert status number to string
      const statusMap: { [key: number]: string } = {
        0: 'submitted',    // Pending
        1: 'investigating', // Investigating
        2: 'verified',     // Verified
        3: 'rejected',     // Rejected
        4: 'closed'        // Closed
      };
      
      const status = statusMap[Number(reportInfo.status)] || 'submitted';
      
      // Create properly formatted report object
      const blockchainReport: Report = {
        id: Number(reportInfo.id),
        reporter: reportInfo.reporter,
        timestamp: new Date(Number(reportInfo.timestamp) * 1000).toISOString(), // Convert from seconds to milliseconds
        status: status as any,
        verifiedBy: reportInfo.verifiedBy !== '0x0000000000000000000000000000000000000000' ? reportInfo.verifiedBy : undefined,
        verificationTimestamp: Number(reportInfo.verificationTimestamp) > 0 ? 
          new Date(Number(reportInfo.verificationTimestamp) * 1000).toISOString() : undefined,
        contentHash: reportInfo.contentHash,
        rewardClaimed: reportInfo.rewardClaimed,
        title: `Report #${Number(reportInfo.id)}`,
        category: 'Unknown', // Will be updated when content is decrypted
        content: 'Content is encrypted. Click "Decrypt with MetaMask" to view.',
        anonymous: false // Will be updated when content is decrypted
      };
      
      console.log('📄 Formatted report:', blockchainReport);
      setReport(blockchainReport);
      
    } catch (error: any) {
      console.error('❌ Failed to fetch report:', error);
      toast.error(`Failed to load report details: ${error.message}`);
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
          await blockchainService.switchToSapphireTestnet();
          // Recheck after switching
          const recheckNetwork = await blockchainService.isCorrectNetwork();
          if (!recheckNetwork) {
            toast.error('Failed to switch to Sapphire Testnet. Please switch manually in MetaMask.');
            return;
          }
        } catch (switchError: any) {
          toast.error(`Failed to switch network: ${switchError.message}`);
          return;
        }
      }

      // Check if user is authorized to view this report
      if (!wallet.address) {
        toast.error('Please connect your wallet to view report content');
        return;
      }

      // Use blockchain service directly instead of API for better reliability
      try {
        console.log('🔓 Decrypting content directly from blockchain...');
        const decryptedData = await blockchainService.getReportContent(Number(id!));
        
        if (decryptedData) {
          setDecryptedContent(decryptedData);
          
          // Update report object with decrypted metadata
          if (report) {
            const categoryMap: { [key: string]: string } = {
              'security': 'Security',
              'fraud': 'Fraud',
              'corruption': 'Corruption',
              'safety': 'Safety',
              'environmental': 'Environmental',
              'financial': 'Financial',
              'general': 'General',
              'other': 'Other'
            };
            
            const severityMap: { [key: string]: 'low' | 'medium' | 'high' | 'critical' } = {
              'low': 'low',
              'medium': 'medium',
              'high': 'high',
              'critical': 'critical'
            };
            
            const updatedReport = {
              ...report,
              title: decryptedData.title || report.title,
              category: categoryMap[decryptedData.category?.toLowerCase() || 'general'] || 'General',
              anonymous: decryptedData.anonymous || false,
              severity: severityMap[decryptedData.severity?.toLowerCase() || 'medium'] || 'medium'
            };
            setReport(updatedReport);
          }
          
          toast.success('Content decrypted successfully');
        } else {
          throw new Error('No content returned from blockchain');
        }
      } catch (blockchainError: any) {
        console.log('⚠️ Blockchain decryption failed, trying API fallback...');
        
        // Fallback to API if blockchain fails
        try {
          const response = await reportApi.getReportContent(id!, wallet.address);
          if (response.success && response.data) {
            setDecryptedContent(response.data);
            toast.success('Report content decrypted successfully');
          } else {
            throw new Error(response.message || 'Unauthorized to view this report');
          }
        } catch (apiError: any) {
          // If API also fails, show appropriate message
          if (apiError.message?.includes('authorized') || apiError.response?.status === 403) {
            toast.error('You are not authorized to view this report content. Only the reporter or authorized verifiers can access it.');
          } else {
            toast.error(apiError.message || 'Failed to decrypt report content');
          }
          throw apiError;
        }
      }

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
        
        {/* Admin Actions - Only show when content is decrypted and user is admin */}
        {isUserAdmin() && decryptedContent && (
          <div className="mt-6">
            <AdminRewardActions 
              report={report} 
              onReportUpdated={setReport}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDetailPage;
