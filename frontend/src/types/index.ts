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
  id: string;
  reportId: number;
  reporter: string;
  timestamp: string;
  status: ReportStatus;
  verifiedBy?: string;
  verificationTimestamp?: string;
  contentHash: string;
  rewardClaimed: boolean;
  content?: string; // Decrypted content if accessible
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

// Error Types
export interface AppError {
  message: string;
  code?: string;
  details?: any;
}
