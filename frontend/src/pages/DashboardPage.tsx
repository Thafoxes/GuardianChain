import React, { useState, useEffect } from 'react';
import { BarChart3, Users, FileText, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { blockchainService } from '../services/blockchain';
import VerifierManagement from '../components/VerifierManagement';
import toast from 'react-hot-toast';

interface ReportStats {
  total: number;
  submitted: number;
  investigating: number;
  verified: number;
  rejected: number;
  closed: number;
}

interface CircularProgressProps {
  percentage: number;
  size: number;
  strokeWidth: number;
  color: string;
  children: React.ReactNode;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ 
  percentage, 
  size, 
  strokeWidth, 
  color, 
  children 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  total: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  total, 
  icon, 
  color, 
  bgColor, 
  description 
}) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-center mb-4">
        <CircularProgress
          percentage={percentage}
          size={120}
          strokeWidth={8}
          color={color}
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{percentage}%</div>
            <div className="text-xs text-gray-500">of total</div>
          </div>
        </CircularProgress>
      </div>
      
      <p className="text-sm text-gray-600 text-center">{description}</p>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { auth } = useAuth();
  const { wallet } = useWallet();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [wallet.address, auth.user]);

  useEffect(() => {
    if (isAdmin) {
      fetchReportStats();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      // Check both auth admin and blockchain admin
      const authAdmin = auth.user?.role === 'ADMIN';
      
      let blockchainAdmin = false;
      if (wallet.address && blockchainService.isConnected()) {
        const roles = await blockchainService.getUserRoles(wallet.address);
        blockchainAdmin = roles.isAdmin;
      }

      setIsAdmin(authAdmin || blockchainAdmin);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(auth.user?.role === 'ADMIN');
    }
  };

  const fetchReportStats = async () => {
    try {
      setLoading(true);
      
      if (!blockchainService.isConnected()) {
        await blockchainService.initializeFromExistingProvider();
      }

      // Get all reports from blockchain
      const reports = await blockchainService.getAllReports();
      
      // Calculate statistics
      const stats: ReportStats = {
        total: reports.length,
        submitted: reports.filter(r => r.status === 'submitted').length,
        investigating: reports.filter(r => r.status === 'investigating').length,
        verified: reports.filter(r => r.status === 'verified').length,
        rejected: reports.filter(r => r.status === 'rejected').length,
        closed: reports.filter(r => r.status === 'closed').length,
      };

      setStats(stats);
    } catch (error: any) {
      console.error('Error fetching report stats:', error);
      toast.error('Failed to load report statistics');
    } finally {
      setLoading(false);
    }
  };

  // Show restricted access message for non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Restricted</h1>
            <p className="text-lg text-gray-600 mb-8">
              Dashboard statistics are only available to administrators.
            </p>
            <p className="text-sm text-gray-500">
              If you are an administrator, please ensure you are properly authenticated and have admin privileges.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Overview of all reports and system statistics
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="text-blue-900 font-medium">Administrator View</span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Reports */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-100">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{stats?.total || 0}</p>
                  <p className="text-sm text-gray-500">Total Reports</p>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                All reports in the system
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats?.verified || 0}</div>
                <div className="text-sm text-gray-500">Verified</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats?.investigating || 0}</div>
                <div className="text-sm text-gray-500">Under Investigation</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats?.rejected || 0}</div>
                <div className="text-sm text-gray-500">Rejected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Statistics with Circular Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Submitted Reports"
            value={stats?.submitted || 0}
            total={stats?.total || 0}
            icon={<Clock className="w-6 h-6 text-yellow-600" />}
            color="#EAB308"
            bgColor="bg-yellow-100"
            description="Reports awaiting review"
          />

          <StatCard
            title="Under Investigation"
            value={stats?.investigating || 0}
            total={stats?.total || 0}
            icon={<Users className="w-6 h-6 text-blue-600" />}
            color="#2563EB"
            bgColor="bg-blue-100"
            description="Reports being investigated"
          />

          <StatCard
            title="Verified Reports"
            value={stats?.verified || 0}
            total={stats?.total || 0}
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
            color="#16A34A"
            bgColor="bg-green-100"
            description="Successfully verified reports"
          />

          <StatCard
            title="Rejected Reports"
            value={stats?.rejected || 0}
            total={stats?.total || 0}
            icon={<XCircle className="w-6 h-6 text-red-600" />}
            color="#DC2626"
            bgColor="bg-red-100"
            description="Reports marked as invalid"
          />
        </div>

        {/* Additional Information */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {stats ? Math.round(((stats.verified + stats.investigating) / stats.total) * 100) || 0 : 0}%
              </div>
              <div className="text-sm text-gray-600">Active Reports</div>
              <div className="text-xs text-gray-500 mt-1">Reports being processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {stats ? Math.round((stats.verified / stats.total) * 100) || 0 : 0}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
              <div className="text-xs text-gray-500 mt-1">Verified vs total reports</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {stats?.closed || 0}
              </div>
              <div className="text-sm text-gray-600">Closed Cases</div>
              <div className="text-xs text-gray-500 mt-1">Completed investigations</div>
            </div>
          </div>
        </div>
        
        {/* Verifier Management Section */}
        <VerifierManagement />
      </div>
    </div>
  );
};

export default DashboardPage;
