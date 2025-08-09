// API Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// User Types
export interface User {
  id: string;
  address: string;
  role: 'USER' | 'ADMIN' | 'VERIFIER';
  isVerified: boolean;
  registrationDate: string;
  metadata?: {
    publicKey?: string;
    encryptedData?: string;
  };
}

export interface UserStats {
  totalReports: number;
  verifiedReports: number;
  pendingReports: number;
  totalRewards: string;
  unclaimedRewards: string;
}

// Report Types
export interface Report {
  id: number;
  reportId?: number; // For compatibility
  title?: string;
  content?: string;
  evidence?: string;
  category?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  reporter: string;
  timestamp: string;
  status: 'submitted' | 'investigating' | 'verified' | 'rejected';
  verifiedBy?: string;
  verificationTimestamp?: string;
  contentHash?: string;
  rewardClaimed: boolean;
  anonymous?: boolean;
  investigator?: string;
}

export enum ReportStatus {
  PENDING = 0,
  VERIFIED = 1,
  REJECTED = 2,
  INVESTIGATING = 3
}

export interface ReportSubmission {
  content: string;
  category?: string;
  anonymous?: boolean;
}

// Wallet Types
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
  tokenBalance: string | null;
}

// Auth Types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

// Contract Types
export interface ContractAddresses {
  RewardToken?: string;
  UserVerification?: string;
  ReportContract?: string;
}

export interface NetworkInfo {
  name: string;
  chainId: number;
  blockNumber: number;
  contractAddresses: ContractAddresses;
}

// Transaction Types
export interface TransactionResult {
  hash: string;
  success: boolean;
  error?: string;
}

// Component Props Types
export interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

// Form Types
export interface LoginFormData {
  address: string;
  signature: string;
}

export interface RegisterFormData {
  metadata?: {
    publicKey?: string;
    encryptedData?: string;
  };
}

// Admin Types
export interface AdminStats {
  totalUsers: number;
  totalReports: number;
  pendingReports: number;
  totalRewards: string;
}

// Staking Types
export interface StakeStatus {
  isRegistered: boolean;
  isVerified: boolean;
  hasStaked: boolean;
  stakeAmount?: string;
  registrationTx?: string;
  stakeTx?: string;
}

export interface StakeBalance {
  balance: string;
  formatted: string;
}

export interface StakeRegistrationRequest {
  identifier: string;
  longevity: number;
  walletAddress: string;
  stakeTransactionHash: string;
}

export interface StakeRegistrationResponse {
  user: User;
  txHash: string;
  stakeAmount: string;
  verified: boolean;
}

export interface UserStakeInfo {
  isRegistered: boolean;
  identifier: string;
  longevity: number;
  registrationTime: string;
}

// Error Types
export interface AppError {
  message: string;
  code?: string;
  details?: any;
}
