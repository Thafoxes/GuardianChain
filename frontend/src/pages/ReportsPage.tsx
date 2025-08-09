import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, Clock, CheckCircle, AlertTriangle, Eye, Plus } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { blockchainService } from '../services/blockchain';
import toast from 'react-hot-toast';

interface BlockchainReport {
  id: number;
  reporter: string;
  timestamp: number;
  status: string;
  verifiedBy: string;
  verificationTimestamp: number;
  contentHash: string;
  rewardClaimed: boolean;
  title?: string; // Will be available after decryption
  category?: string;
  severity?: string;
  anonymous?: boolean;
  content?: string; // For content preview
}

const ReportsPage = () => {
  const { wallet } = useWallet();
  const [reports, setReports] = useState<BlockchainReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Status', color: 'text-gray-600' },
    { value: 'submitted', label: 'Submitted', color: 'text-blue-600' },
    { value: 'investigating', label: 'Investigating', color: 'text-yellow-600' },
    { value: 'verified', label: 'Verified', color: 'text-green-600' },
    { value: 'rejected', label: 'Rejected', color: 'text-red-600' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'security', label: 'Security' },
    { value: 'fraud', label: 'Fraud' },
    { value: 'governance', label: 'Governance' },
    { value: 'technical', label: 'Technical' },
    { value: 'other', label: 'Other' }
  ];

  const severityColors = {
    low: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    high: 'text-orange-600 bg-orange-50',
    critical: 'text-red-600 bg-red-50'
  };

  const statusIcons = {
    submitted: Clock,
    investigating: AlertTriangle,
    verified: CheckCircle,
    rejected: FileText
  };

  useEffect(() => {
    fetchReports();
  }, [wallet.address, statusFilter, categoryFilter]);

  const fetchReports = async () => {
    if (!wallet.isConnected || !wallet.address) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📋 Fetching reports from blockchain...');

      // Initialize blockchain service if needed
      if (!blockchainService.isConnected()) {
        await blockchainService.initializeFromExistingProvider();
      }

      // Check if user is admin to determine which reports to fetch
      const userIsAdmin = await blockchainService.isAuthorizedVerifier(wallet.address);
      setIsAdmin(userIsAdmin);
      
      let blockchainReports: any[] = [];
      
      if (userIsAdmin) {
        // Admin: fetch all reports
        console.log('👑 Fetching all reports (admin view)');
        blockchainReports = await blockchainService.getAllReports(100);
      } else {
        // Regular user: fetch only their own reports
        console.log('👤 Fetching user reports for:', wallet.address);
        blockchainReports = await blockchainService.getUserReports(wallet.address);
      }

      console.log('📋 Fetched reports:', blockchainReports.length);
      
      // Apply filters
      let filteredReports = blockchainReports;
      
      if (statusFilter !== 'all') {
        filteredReports = filteredReports.filter(report => report.status === statusFilter);
      }
      
      if (categoryFilter !== 'all') {
        filteredReports = filteredReports.filter(report => 
          report.category && report.category === categoryFilter
        );
      }

      console.log('📋 Filtered reports:', filteredReports.length);
      setReports(filteredReports);
      
    } catch (error: any) {
      console.error('❌ Failed to fetch reports:', error);
      toast.error('Failed to load reports from blockchain');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report =>
    searchTerm === '' || 
    report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption?.color || 'text-gray-600';
  };

  const getStatusIcon = (status: string) => {
    const IconComponent = statusIcons[status as keyof typeof statusIcons] || FileText;
    return IconComponent;
  };

  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-1">
              Browse and track all submitted reports in the system
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              to="/submit-report"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Submit Report
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading reports...</span>
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No reports have been submitted yet'
              }
            </p>
            <Link
              to="/submit-report"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Submit First Report
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const StatusIcon = getStatusIcon(report.status);
              return (
                <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {report.title || `Report #${report.id}`}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityColors[report.severity as keyof typeof severityColors] || 'text-gray-600 bg-gray-50'}`}>
                          {report.severity ? report.severity.charAt(0).toUpperCase() + report.severity.slice(1) : 'Medium'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <StatusIcon className={`w-4 h-4 mr-1 ${getStatusColor(report.status)}`} />
                          <span className={getStatusColor(report.status)}>
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </span>
                        </div>
                        <span>#{report.id}</span>
                        <span className="capitalize">{report.category}</span>
                        <span>{formatDate(report.timestamp)}</span>
                        {!report.anonymous && (
                          <span>Reporter: {formatAddress(report.reporter)}</span>
                        )}
                        {report.anonymous && (
                          <span className="text-gray-400">Anonymous</span>
                        )}
                      </div>

                      {report.content && (
                        <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                          {report.content.length > 150 
                            ? `${report.content.substring(0, 150)}...` 
                            : report.content
                          }
                        </p>
                      )}
                    </div>

                    <div className="ml-4 flex-shrink-0">
                      <Link
                        to={`/reports/${report.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{reports.length}</div>
              <div className="text-sm text-gray-600">Total Reports</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {reports.filter(r => r.status === 'investigating').length}
              </div>
              <div className="text-sm text-gray-600">Under Investigation</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {reports.filter(r => r.status === 'verified').length}
              </div>
              <div className="text-sm text-gray-600">Verified</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {reports.filter(r => r.rewardClaimed).length}
              </div>
              <div className="text-sm text-gray-600">Rewards Claimed</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
