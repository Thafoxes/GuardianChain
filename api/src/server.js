// Load environment variables FIRST
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the api root directory
const envPath = join(__dirname, '../.env');
console.log('Current __dirname:', __dirname);
console.log('Loading .env from:', envPath);

// Try both explicit path and default
dotenv.config({ path: envPath });
dotenv.config(); // Also try default behavior

// Debug: Print some env vars immediately after loading
console.log('NETWORK after dotenv:', process.env.NETWORK);
console.log('REWARD_TOKEN_ADDRESS after dotenv:', process.env.REWARD_TOKEN_ADDRESS);

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import 'express-async-errors';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import reportRoutes from './routes/report.js';
import adminRoutes from './routes/admin.js';
import healthRoutes from './routes/health.js';
import stakeRoutes from './routes/stake.js';
import faucetRoutes from './routes/faucet.js';
import blockchainRoutes from './routes/blockchain.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { logger } from './utils/logger.js';

// Import blockchain service
import blockchainService from './services/blockchain.js';
import eventMonitorService from './services/eventMonitor.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware with CSP configuration for blockchain connections
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https://testnet.sapphire.oasis.dev",
        "https://*.sapphire.oasis.dev",
        "https://sapphire.oasis.dev",
        "wss://testnet.sapphire.oasis.dev",
        "wss://*.sapphire.oasis.dev"
      ],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));

// CORS configuration for React frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Wallet-Address']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', { 
  stream: { write: message => logger.info(message.trim()) }
}));

// API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stake', stakeRoutes);
app.use('/api/faucet', faucetRoutes);
app.use('/api/blockchain', blockchainRoutes);

// Serve static files from the frontend build (for production)
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '../public');
  
  // Serve static files
  app.use(express.static(frontendBuildPath));
  
  // Handle client-side routing - send index.html for non-API routes
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
} else {
  // Development mode - just show API info
  app.get('/', (req, res) => {
    res.json({
      message: 'GuardianChain API Server',
      version: '1.0.0',
      status: 'running',
      network: process.env.NETWORK || 'localnet',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        users: '/api/users',
        reports: '/api/reports',
        admin: '/api/admin',
        stake: '/api/stake'
      }
    });
  });
}

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  logger.info(`🚀 GuardianChain API Server running on port ${PORT}`);
  logger.info(`📡 Network: ${process.env.NETWORK || 'localnet'}`);
  logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  
  // Initialize blockchain service after server starts
  try {
    await blockchainService.init();
    logger.info('✅ Blockchain service initialized successfully');
    
    // Initialize event monitoring for automated reward distribution
    await eventMonitorService.init();
    logger.info('✅ Event monitoring service initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize services:', error);
  }
});

export default app;
