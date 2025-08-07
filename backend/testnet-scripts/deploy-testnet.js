const { ethers } = require("hardhat");

async function main() {
  console.log("=== GuardianChain: Sapphire Testnet Deployment ===\n");

  // Check network
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network Information:");
  console.log("   Network Name:", network.name);
  console.log("   Chain ID:", network.chainId.toString());
  
  if (network.chainId !== 23295n) {
    console.log("⚠️  WARNING: Expected Sapphire Testnet (Chain ID: 23295)");
    console.log("   Use: npx hardhat run testnet-scripts/deploy-testnet.js --network sapphire-testnet");
    return;
  }

  // Get deployer
  const signers = await ethers.getSigners();
  console.log("Available signers:", signers.length);
  
  if (signers.length === 0) {
    console.log("❌ No signers available! Check your private key configuration.");
    console.log("💡 Make sure PRIVATE_KEY is set in your .env file");
    return;
  }
  
  const [deployer] = signers;
  const deployerAddress = await deployer.getAddress();
  console.log("🔑 Deployer:", deployerAddress);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log("💰 Balance:", ethers.formatEther(balance), "TEST");
  
  if (balance < ethers.parseEther("0.1")) {
    console.log("❌ Insufficient balance for deployment!");
    console.log("💡 Get TEST tokens from: https://faucet.testnet.oasis.dev/");
    return;
  }
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
    
    console.log("\n🔗 Verification Links:");
    console.log(`   RewardToken: https://testnet.explorer.sapphire.oasis.dev/address/${rewardTokenAddress}`);
    console.log(`   UserVerification: https://testnet.explorer.sapphire.oasis.dev/address/${userVerificationAddress}`);
    console.log(`   ReportContract: https://testnet.explorer.sapphire.oasis.dev/address/${reportContractAddress}`);

    // Save deployment info
    const deploymentInfo = {
      network: "sapphire-testnet",
      chainId: network.chainId.toString(),
      deployer: deployerAddress,
      timestamp: new Date().toISOString(),
      contracts: {
        RewardToken: rewardTokenAddress,
        UserVerification: userVerificationAddress,
        ReportContract: reportContractAddress,
      },
      explorerUrls: {
        RewardToken: `https://testnet.explorer.sapphire.oasis.dev/address/${rewardTokenAddress}`,
        UserVerification: `https://testnet.explorer.sapphire.oasis.dev/address/${userVerificationAddress}`,
        ReportContract: `https://testnet.explorer.sapphire.oasis.dev/address/${reportContractAddress}`,
      }
    };

    const fs = require('fs');
    const path = require('path');
    
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, 'sapphire-testnet-deployment.json');
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

    console.log("\n🎯 Next Steps:");
    console.log("   1. Run the testnet demo:");
    console.log("      npm run testnet-demo");
    console.log("   2. Integrate with frontend using contract addresses above");
    console.log("   3. Test full workflow on Sapphire Testnet");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Get more TEST tokens: https://faucet.testnet.oasis.dev/");
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
