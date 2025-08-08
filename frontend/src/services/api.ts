import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, User, Report, UserStats, AdminStats, NetworkInfo } from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

// Auth API
export const authApi = {
  getNonce: (address: string): Promise<ApiResponse<{ nonce: string }>> =>
    api.get(`/auth/nonce/${address}`),

  login: (data: {
    address: string;
    signature: string;
    message: string;
    nonce: string;
  }): Promise<ApiResponse<{ user: User; token?: string }>> =>
    api.post('/auth/login', data),

  register: (data: {
    address: string;
    signature: string;
    message: string;
    nonce: string;
    metadata?: any;
  }): Promise<ApiResponse<{ user: User; token?: string }>> =>
    api.post('/auth/register', data),

  getProfile: (): Promise<ApiResponse<User>> =>
    api.get('/auth/profile'),

  updateProfile: (data: { metadata?: any }): Promise<ApiResponse<User>> =>
    api.put('/auth/profile', data),
};

// User API
export const userApi = {
  getStats: (): Promise<ApiResponse<UserStats>> =>
    api.get('/users/stats'),

  getUserReports: (): Promise<ApiResponse<Report[]>> =>
    api.get('/users/reports'),

  claimReward: (reportId: number): Promise<ApiResponse<{ txHash: string }>> =>
    api.post('/users/claim-reward', { reportId }),

  getBalance: (): Promise<ApiResponse<{ balance: string; tokenBalance: string }>> =>
    api.get('/users/balance'),
};

// Report API
export const reportApi = {
  submitReport: (data: {
    title: string;
    content: string;
    category?: string;
    evidence?: string;
    severity?: string;
    anonymous?: boolean;
    walletAddress?: string;
  }): Promise<ApiResponse<{ reportId: number; txHash: string }>> =>
    api.post('/reports/submit', data),

  getReports: (params?: {
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ reports: Report[]; total: number; hasMore: boolean }>> =>
    api.get('/reports', { params }),

  getReport: (id: string): Promise<ApiResponse<Report>> =>
    api.get(`/reports/${id}`),

  getReportContent: (id: string): Promise<ApiResponse<{ content: string }>> =>
    api.get(`/reports/${id}/content`),

  verifyReport: (id: string, status: number): Promise<ApiResponse<{ txHash: string }>> =>
    api.post(`/reports/${id}/verify`, { status }),

  getMyReports: (): Promise<ApiResponse<Report[]>> =>
    api.get('/reports/my-reports'),
};

// Admin API
export const adminApi = {
  getStats: (): Promise<ApiResponse<AdminStats>> =>
    api.get('/admin/stats'),

  getAllUsers: (params?: {
    limit?: number;
    offset?: number;
    role?: string;
  }): Promise<ApiResponse<{ users: User[]; total: number }>> =>
    api.get('/admin/users', { params }),

  updateUserRole: (userId: string, role: string): Promise<ApiResponse<User>> =>
    api.put(`/admin/users/${userId}/role`, { role }),

  verifyUser: (userId: string): Promise<ApiResponse<{ txHash: string }>> =>
    api.post(`/admin/users/${userId}/verify`),

  getAllReports: (params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ reports: Report[]; total: number }>> =>
    api.get('/admin/reports', { params }),

  addVerifier: (address: string): Promise<ApiResponse<{ txHash: string }>> =>
    api.post('/admin/verifiers', { address }),

  removeVerifier: (address: string): Promise<ApiResponse<{ txHash: string }>> =>
    api.delete(`/admin/verifiers/${address}`),
};

// Health API
export const healthApi = {
  getStatus: (): Promise<ApiResponse<{
    timestamp: string;
    uptime: number;
    version: string;
    network: NetworkInfo;
    gasPrice: any;
    environment: string;
  }>> =>
    api.get('/health'),
};

// Blockchain API (for network info)
export const blockchainApi = {
  getNetworkInfo: (): Promise<ApiResponse<NetworkInfo>> =>
    api.get('/blockchain/network'),

  getGasPrice: (): Promise<ApiResponse<{
    gasPrice: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  }>> =>
    api.get('/blockchain/gas-price'),

  getBalance: (address: string): Promise<ApiResponse<{ balance: string }>> =>
    api.get(`/blockchain/balance/${address}`),

  getTokenBalance: (address: string): Promise<ApiResponse<{ balance: string }>> =>
    api.get(`/blockchain/token-balance/${address}`),
};

export default api;
