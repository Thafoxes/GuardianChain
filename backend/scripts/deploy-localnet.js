const { ethers } = require("hardhat");

async function main() {
  console.log("=== GuardianChain: Sapphire Localnet Deployment ===\n");

  // Check network
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network Information:");
  console.log("   Network Name:", network.name);
  console.log("   Chain ID:", network.chainId.toString());
  
  if (network.chainId !== 23293n) {
    console.log("⚠️  WARNING: Expected Sapphire Localnet (Chain ID: 23293)");
    console.log("   Use: npx hardhat run scripts/deploy-localnet.js --network sapphire-localnet");
    return;
  }

  // Get signers
  const signers = await ethers.getSigners();
  console.log("Available signers:", signers.length);
  
  if (signers.length === 0) {
    console.log("❌ No signers available! Check your localnet configuration.");
    return;
  }
  
  const [deployer] = signers;
  const deployerAddress = await deployer.getAddress();
  console.log("🔑 Deployer:", deployerAddress);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log("💰 Balance:", ethers.formatEther(balance), "TEST");
  console.log();

  console.log("=== Deploying Contracts ===");
  
  try {
    // Deploy RewardToken
    console.log("1️⃣ Deploying RewardToken...");
    const RewardToken = await ethers.getContractFactory("RewardToken");
    const rewardToken = await RewardToken.deploy(1000000); // 1M tokens
    await rewardToken.waitForDeployment();
    const rewardTokenAddress = await rewardToken.getAddress();
    console.log("   ✅ RewardToken:", rewardTokenAddress);

    // Deploy UserVerification
    console.log("2️⃣ Deploying UserVerification...");
    const UserVerification = await ethers.getContractFactory("UserVerification");
    const userVerification = await UserVerification.deploy();
    await userVerification.waitForDeployment();
    const userVerificationAddress = await userVerification.getAddress();
    console.log("   ✅ UserVerification:", userVerificationAddress);

    // Deploy ReportContract
    console.log("3️⃣ Deploying ReportContract...");
    const ReportContract = await ethers.getContractFactory("ReportContract");
    const reportContract = await ReportContract.deploy(userVerificationAddress, rewardTokenAddress);
    await reportContract.waitForDeployment();
    const reportContractAddress = await reportContract.getAddress();
    console.log("   ✅ ReportContract:", reportContractAddress);

    // Setup permissions
    console.log("4️⃣ Setting up permissions...");
    const addMinterTx = await rewardToken.addMinter(reportContractAddress);
    await addMinterTx.wait();
    console.log("   ✅ ReportContract authorized as token minter");

    console.log("\n=== Deployment Complete ===");
    console.log("📋 Contract Addresses:");
    console.log("   RewardToken:", rewardTokenAddress);
    console.log("   UserVerification:", userVerificationAddress);
    console.log("   ReportContract:", reportContractAddress);
    
    console.log("\n🔗 Localnet Explorer:");
    console.log("   Since this is localnet, use Hardhat console or frontend to interact");

    // Save deployment info
    const deploymentInfo = {
      network: "sapphire-localnet",
      chainId: network.chainId.toString(),
      deployer: deployerAddress,
      timestamp: new Date().toISOString(),
      contracts: {
        RewardToken: rewardTokenAddress,
        UserVerification: userVerificationAddress,
        ReportContract: reportContractAddress,
      }
    };

    const fs = require('fs');
    const path = require('path');
    
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, 'sapphire-localnet-deployment.json');
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

    console.log("\n🎯 Next Steps:");
    console.log("   1. Run the localnet demo:");
    console.log("      npm run localnet-demo");
    console.log("   2. All accounts are pre-funded with 10,000 TEST tokens!");
    console.log("   3. Test full encrypted workflow on Sapphire Localnet");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
