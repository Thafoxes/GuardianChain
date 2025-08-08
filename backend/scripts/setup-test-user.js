import { ethers } from 'ethers';
import { wrap } from '@oasisprotocol/sapphire-paratime';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../api/.env') });

// Import contract ABIs
const UserVerificationABI = JSON.parse(readFileSync(join(__dirname, '../../api/contracts/UserVerification.json'), 'utf8'));

async function setupUserForTesting() {
  try {
    console.log('🔧 Setting up user for testing...');

    // Connect to localnet
    const provider = wrap(new ethers.JsonRpcProvider('http://localhost:8545'));
    
    // Test user (the same one used in frontend)
    const testUserPrivateKey = '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6'; // Second Hardhat account
    const testUser = new ethers.Wallet(testUserPrivateKey, provider);
    
    // Admin (deployer) - has admin rights (first Hardhat account)
    const adminPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // First Hardhat account
    const admin = new ethers.Wallet(adminPrivateKey, provider);
    
    console.log(`👤 Test User Address: ${testUser.address}`);
    console.log(`👑 Admin Address: ${admin.address}`);
    
    // Get contract addresses
    const userVerificationAddress = process.env.USER_VERIFICATION_ADDRESS;
    
    if (!userVerificationAddress) {
      throw new Error('USER_VERIFICATION_ADDRESS not found in environment');
    }
    
    console.log(`📄 UserVerification Contract: ${userVerificationAddress}`);
    
    // Connect to contracts
    const userVerificationWithUser = new ethers.Contract(userVerificationAddress, UserVerificationABI.abi, testUser);
    const userVerificationWithAdmin = new ethers.Contract(userVerificationAddress, UserVerificationABI.abi, admin);
    
    // Check if user is already registered
    const isRegistered = await userVerificationWithUser.isRegistered(testUser.address);
    console.log(`📋 User registration status: ${isRegistered}`);
    
    if (!isRegistered) {
      console.log('📝 Registering user...');
      const registerTx = await userVerificationWithUser.registerUser("test_user_001", 30);
      await registerTx.wait();
      console.log('✅ User registered successfully');
    } else {
      console.log('ℹ️  User already registered');
    }
    
    // Check if user is verified
    const isVerified = await userVerificationWithUser.isUserVerified(testUser.address);
    console.log(`✓ User verification status: ${isVerified}`);
    
    if (!isVerified) {
      console.log('🔐 Verifying user (admin action)...');
      const verifyTx = await userVerificationWithAdmin.verifyUser(testUser.address);
      await verifyTx.wait();
      console.log('✅ User verified successfully');
    } else {
      console.log('ℹ️  User already verified');
    }
    
    // Final verification check
    const finalVerified = await userVerificationWithUser.isUserVerified(testUser.address);
    console.log(`🎉 Final verification status: ${finalVerified}`);
    
    if (finalVerified) {
      console.log('✅ User is now ready to submit reports!');
      console.log('🚀 You can now test report submission from the frontend');
    } else {
      console.log('❌ Something went wrong with user verification');
    }
    
  } catch (error) {
    console.error('❌ Error setting up user:', error);
    process.exit(1);
  }
}

setupUserForTesting();
