const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 === Deploying GuardianChain to Sapphire Testnet === 🚀\n");

  // Check network
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network Information:");
  console.log("   Network Name:", network.name);
  console.log("   Chain ID:", network.chainId.toString());
  
  if (network.chainId !== 23295n) {
    throw new Error(`❌ Wrong network! Expected Sapphire Testnet (23295), got ${network.chainId}`);
  }
  
  console.log("✅ Connected to Sapphire Testnet\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "TEST");

  if (balance < ethers.parseEther("0.05")) {
    console.log("❌ Insufficient balance!");
    console.log("🔗 Get TEST tokens from: https://faucet.testnet.oasis.dev/");
    console.log("📋 Your address:", deployer.address);
    console.log("💰 Current balance:", ethers.formatEther(balance), "TEST");
    console.log("💰 Required balance: at least 0.05 TEST");
    throw new Error("Insufficient balance for deployment");
  }

  console.log("✅ Sufficient balance for deployment\n");

  // Deploy RewardToken with initial supply
  console.log("🪙 Deploying RewardToken...");
  const RewardToken = await ethers.getContractFactory("RewardToken");
  const initialSupply = ethers.parseUnits("1000000", 18); // 1 million tokens
  const rewardToken = await RewardToken.deploy(initialSupply);
  await rewardToken.waitForDeployment();
  const rewardTokenAddress = await rewardToken.getAddress();
  console.log("✅ RewardToken deployed to:", rewardTokenAddress);

  // Deploy UserVerification (no constructor arguments)
  console.log("👤 Deploying UserVerification...");
  const UserVerification = await ethers.getContractFactory("UserVerification");
  const userVerification = await UserVerification.deploy();
  await userVerification.waitForDeployment();
  const userVerificationAddress = await userVerification.getAddress();
  console.log("✅ UserVerification deployed to:", userVerificationAddress);

  // Deploy ReportContract
  console.log("📝 Deploying ReportContract...");
  const ReportContract = await ethers.getContractFactory("ReportContract");
  const reportContract = await ReportContract.deploy(userVerificationAddress, rewardTokenAddress);
  await reportContract.waitForDeployment();
  const reportContractAddress = await reportContract.getAddress();
  console.log("✅ ReportContract deployed to:", reportContractAddress);

  console.log("\n🔧 Setting up permissions...");
  
  // Add UserVerification as authorized minter
  await rewardToken.addMinter(userVerificationAddress);
  console.log("✅ Added UserVerification as authorized minter");

  // Add ReportContract as authorized minter
  await rewardToken.addMinter(reportContractAddress);
  console.log("✅ Added ReportContract as authorized minter");

  // UserVerification automatically sets deployer as admin in constructor
  console.log("✅ Deployer is already set as admin for UserVerification");

  // Save deployment info
  const deploymentInfo = {
    network: "sapphire-testnet",
    chainId: "23295",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      RewardToken: rewardTokenAddress,
      UserVerification: userVerificationAddress,
      ReportContract: reportContractAddress
    }
  };

  const deploymentPath = path.join(__dirname, '..', 'deployments', 'sapphire-testnet-deployment.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentPath);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Contract Addresses:");
  console.log("   RewardToken:", rewardTokenAddress);
  console.log("   UserVerification:", userVerificationAddress);
  console.log("   ReportContract:", reportContractAddress);
  console.log("   Deployer/Admin:", deployer.address);

  console.log("\n📝 Update your environment files:");
  console.log("\n🎯 Frontend .env:");
  console.log(`VITE_CONTRACT_ADDRESS_REWARD_TOKEN=${rewardTokenAddress}`);
  console.log(`VITE_CONTRACT_ADDRESS_USER_VERIFICATION=${userVerificationAddress}`);
  console.log(`VITE_CONTRACT_ADDRESS_REPORT_CONTRACT=${reportContractAddress}`);
  console.log(`VITE_TREASURY_ADDRESS=${deployer.address}`);
  
  console.log("\n🎯 API .env:");
  console.log(`REWARD_TOKEN_ADDRESS=${rewardTokenAddress}`);
  console.log(`USER_VERIFICATION_ADDRESS=${userVerificationAddress}`);
  console.log(`REPORT_CONTRACT_ADDRESS=${reportContractAddress}`);
  console.log(`TESTNET_PRIVATE_KEY=${process.env.TESTNET_PRIVATE_KEY}`);
  console.log(`BACKEND_PRIVATE_KEY=${process.env.TESTNET_PRIVATE_KEY}`);

  console.log("\n🔗 Testnet Explorer:");
  console.log(`   View contracts: https://testnet.explorer.sapphire.oasis.io/address/${reportContractAddress}`);
  
  console.log("\n📋 Next Steps:");
  console.log("1. Copy the environment variables above to your .env files");
  console.log("2. Restart your API and frontend services");
  console.log("3. Connect MetaMask to Sapphire Testnet");
  console.log("4. Register your wallet via the API");
  console.log("5. Test report submission!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
