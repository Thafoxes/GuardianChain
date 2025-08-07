const { ethers } = require("hardhat");

async function main() {
  console.log("=== GuardianChain: Testnet Interaction Script ===\n");

  // Load deployment info
  const deploymentPath = '../deployments/sapphire-testnet-deployment.json';
  let deployment;
  
  try {
    deployment = require(deploymentPath);
    console.log("📋 Using deployed contracts from:", deployment.timestamp);
  } catch (error) {
    console.log("❌ No deployment found. Please run deployment first:");
    console.log("   npm run deploy:testnet");
    return;
  }

  // Get signer
  const [user] = await ethers.getSigners();
  const userAddress = await user.getAddress();
  console.log("🔑 User:", userAddress);
  
  // Check balance
  const balance = await ethers.provider.getBalance(userAddress);
  console.log("💰 Balance:", ethers.formatEther(balance), "TEST");
  console.log();

  // Connect to contracts
  const RewardToken = await ethers.getContractFactory("RewardToken");
  const UserVerification = await ethers.getContractFactory("UserVerification");
  const ReportContract = await ethers.getContractFactory("ReportContract");
  
  const rewardToken = RewardToken.attach(deployment.contracts.RewardToken);
  const userVerification = UserVerification.attach(deployment.contracts.UserVerification);
  const reportContract = ReportContract.attach(deployment.contracts.ReportContract);

  console.log("📝 Contract Addresses:");
  console.log("   RewardToken:", deployment.contracts.RewardToken);
  console.log("   UserVerification:", deployment.contracts.UserVerification);
  console.log("   ReportContract:", deployment.contracts.ReportContract);
  console.log();

  // Check if user is registered
  const isRegistered = await userVerification.isRegistered(userAddress);
  console.log("👤 User Registration Status:", isRegistered);

  if (!isRegistered) {
    console.log("📝 Registering user...");
    const registerTx = await userVerification.registerUser("testnet_user_" + Date.now(), 100);
    await registerTx.wait();
    console.log("   ✅ User registered");
  }

  // Check verification status
  const isVerified = await userVerification.isUserVerified(userAddress);
  console.log("✅ User Verification Status:", isVerified);

  if (!isVerified) {
    console.log("⚠️  User not verified. Contact admin for verification.");
    console.log("   Admin can verify using:");
    console.log(`   userVerification.verifyUser("${userAddress}")`);
  } else {
    console.log("🎯 User is verified and can submit reports!");
    
    // Example: Submit a test report
    console.log("\n📝 Submitting test report...");
    const testReport = `Test report from testnet interaction script
Timestamp: ${new Date().toISOString()}
Content: This is a test report to verify encryption works on Sapphire Testnet
Reporter: ${userAddress}`;

    try {
      const submitTx = await reportContract.submitReport(testReport);
      await submitTx.wait();
      console.log("   ✅ Report submitted successfully");
      
      const totalReports = await reportContract.getTotalReports();
      console.log("   📊 Total reports:", totalReports.toString());
      
      const userReports = await reportContract.getUserReports(userAddress);
      console.log("   📋 User's reports:", userReports.map(id => id.toString()));
      
      if (userReports.length > 0) {
        const latestReportId = userReports[userReports.length - 1];
        console.log("\n🔍 Testing content retrieval...");
        try {
          const retrievedContent = await reportContract.getReportContent(latestReportId);
          console.log("   ✅ Content retrieved successfully");
          console.log("   📄 Content preview:", retrievedContent.substring(0, 100) + "...");
          
          if (retrievedContent === testReport) {
            console.log("   ✅ Content integrity verified");
          } else {
            console.log("   ⚠️  Content differs (encryption/decryption in progress)");
          }
        } catch (error) {
          console.log("   ❌ Content retrieval failed:", error.message);
        }
      }
    } catch (error) {
      console.log("   ❌ Report submission failed:", error.message);
      if (error.message.includes("User must be verified")) {
        console.log("   💡 User needs verification from admin first");
      }
    }
  }

  // Check token balance
  const tokenBalance = await rewardToken.balanceOf(userAddress);
  console.log("\n💰 Token Balance:", ethers.formatEther(tokenBalance), "GCR");

  console.log("\n=== Interaction Complete ===");
  console.log("🔗 View on explorer:");
  console.log("   User:", `https://testnet.explorer.sapphire.oasis.dev/address/${userAddress}`);
  console.log("   Contracts:", deployment.explorerUrls);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Interaction failed:", error);
    process.exit(1);
  });
