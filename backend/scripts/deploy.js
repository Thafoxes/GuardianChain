const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment to Oasis Sapphire...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deploying contracts with account:", deployerAddress);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log("Account balance:", ethers.formatEther(balance), "ROSE");
  
  // Deploy RewardToken first
  console.log("\n1. Deploying RewardToken...");
  const RewardToken = await ethers.getContractFactory("RewardToken");
  const initialSupply = 1000000; // 1 million tokens
  const rewardToken = await RewardToken.deploy(initialSupply);
  await rewardToken.waitForDeployment();
  const rewardTokenAddress = await rewardToken.getAddress();
  console.log("RewardToken deployed to:", rewardTokenAddress);
  
  // Deploy UserVerification
  console.log("\n2. Deploying UserVerification...");
  const UserVerification = await ethers.getContractFactory("UserVerification");
  const userVerification = await UserVerification.deploy();
  await userVerification.waitForDeployment();
  const userVerificationAddress = await userVerification.getAddress();
  console.log("UserVerification deployed to:", userVerificationAddress);
  
  // Deploy ReportContract
  console.log("\n3. Deploying ReportContract...");
  const ReportContract = await ethers.getContractFactory("ReportContract");
  const reportContract = await ReportContract.deploy(
    userVerificationAddress,
    rewardTokenAddress
  );
  await reportContract.waitForDeployment();
  const reportContractAddress = await reportContract.getAddress();
  console.log("ReportContract deployed to:", reportContractAddress);
  
  // Set ReportContract as authorized minter for RewardToken
  console.log("\n4. Setting up permissions...");
  console.log("Adding ReportContract as authorized minter for RewardToken...");
  const addMinterTx = await rewardToken.addMinter(reportContractAddress);
  await addMinterTx.wait();
  console.log("✓ ReportContract authorized as minter");
  
  // Verify the setup
  console.log("\n5. Verifying deployment...");
  
  // Check token details
  const tokenName = await rewardToken.name();
  const tokenSymbol = await rewardToken.symbol();
  const tokenTotalSupply = await rewardToken.totalSupply();
  console.log(`Token: ${tokenName} (${tokenSymbol})`);
  console.log(`Total Supply: ${ethers.formatEther(tokenTotalSupply)} tokens`);
  
  // Check if contracts are properly linked
  const linkedUserVerification = await reportContract.userVerification();
  const linkedRewardToken = await reportContract.rewardToken();
  console.log("Linked UserVerification:", linkedUserVerification);
  console.log("Linked RewardToken:", linkedRewardToken);
  
  // Summary
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployerAddress}`);
  console.log(`RewardToken: ${rewardTokenAddress}`);
  console.log(`UserVerification: ${userVerificationAddress}`);
  console.log(`ReportContract: ${reportContractAddress}`);
  console.log("\n=== NEXT STEPS ===");
  console.log("1. Users can register in UserVerification contract");
  console.log("2. Admin can verify users");
  console.log("3. Verified users can submit encrypted reports");
  console.log("4. Authorized verifiers can investigate and verify reports");
  console.log("5. Users can claim rewards for verified reports");
  
  // Save deployment info to file
  const deploymentInfo = {
    network: network.name,
    deployer: deployerAddress,
    timestamp: new Date().toISOString(),
    contracts: {
      RewardToken: rewardTokenAddress,
      UserVerification: userVerificationAddress,
      ReportContract: reportContractAddress,
    },
    configuration: {
      tokenSupply: initialSupply,
      reportReward: "1 GCR",
      verificationReward: "0.5 GCR",
    }
  };
  
  const fs = require('fs');
  const path = require('path');
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save deployment info
  const deploymentFile = path.join(deploymentsDir, `${network.name}-deployment.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${deploymentFile}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
