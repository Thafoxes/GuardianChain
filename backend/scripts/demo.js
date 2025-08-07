const { ethers } = require("hardhat");

async function main() {
  console.log("=== GuardianChain Contract Interaction Demo ===\n");

  // Get signers
  const [deployer, user1, verifier] = await ethers.getSigners();
  
  console.log("Accounts:");
  console.log("Deployer:", await deployer.getAddress());
  console.log("User1:", await user1.getAddress());
  console.log("Verifier:", await verifier.getAddress());
  console.log();

  // Load deployed contracts (you'll need to update these addresses after deployment)
  const deploymentFile = require('../deployments/hardhat-deployment.json');
  
  const RewardToken = await ethers.getContractFactory("RewardToken");
  const UserVerification = await ethers.getContractFactory("UserVerification");
  const ReportContract = await ethers.getContractFactory("ReportContract");
  
  const rewardToken = RewardToken.attach(deploymentFile.contracts.RewardToken);
  const userVerification = UserVerification.attach(deploymentFile.contracts.UserVerification);
  const reportContract = ReportContract.attach(deploymentFile.contracts.ReportContract);

  console.log("=== Step 1: User Registration ===");
  try {
    const tx1 = await userVerification.connect(user1).registerUser("john_doe_2024", 365);
    await tx1.wait();
    console.log("✓ User1 registered successfully");
    
    const isRegistered = await userVerification.isRegistered(await user1.getAddress());
    console.log("Registration status:", isRegistered);
    
    const [isVerified, createdAt, longevity] = await userVerification.getUserStatus(await user1.getAddress());
    console.log("Verification status:", isVerified);
    console.log("Longevity score:", longevity.toString());
  } catch (error) {
    console.log("Registration failed:", error.message);
  }
  console.log();

  console.log("=== Step 2: Admin Verification ===");
  try {
    const tx2 = await userVerification.connect(deployer).verifyUser(await user1.getAddress());
    await tx2.wait();
    console.log("✓ User1 verified by admin");
    
    const isVerified = await userVerification.isUserVerified(await user1.getAddress());
    console.log("User verification status:", isVerified);
  } catch (error) {
    console.log("Verification failed:", error.message);
  }
  console.log();

  console.log("=== Step 3: Add Verifier Authority ===");
  try {
    const tx3 = await reportContract.connect(deployer).addVerifier(await verifier.getAddress());
    await tx3.wait();
    console.log("✓ Verifier authority added");
    
    const isAuthorized = await reportContract.authorizedVerifiers(await verifier.getAddress());
    console.log("Verifier authorization status:", isAuthorized);
  } catch (error) {
    console.log("Adding verifier failed:", error.message);
  }
  console.log();

  console.log("=== Step 4: Submit Encrypted Report ===");
  try {
    const reportContent = "Suspicious activity observed at location XYZ. Immediate attention required.";
    const tx4 = await reportContract.connect(user1).submitReport(reportContent);
    await tx4.wait();
    console.log("✓ Report submitted successfully");
    
    const totalReports = await reportContract.getTotalReports();
    console.log("Total reports in system:", totalReports.toString());
    
    const userReports = await reportContract.getUserReports(await user1.getAddress());
    console.log("User's report IDs:", userReports.map(id => id.toString()));
  } catch (error) {
    console.log("Report submission failed:", error.message);
  }
  console.log();

  console.log("=== Step 5: Verify Report ===");
  try {
    // Get report info before verification
    const [id, reporter, timestamp, status] = await reportContract.getReportInfo(1);
    console.log("Report status before verification:", status.toString()); // 0 = Pending
    
    // Verifier updates status to Verified (status = 2)
    const tx5 = await reportContract.connect(verifier).updateReportStatus(1, 2);
    await tx5.wait();
    console.log("✓ Report verified by authority");
    
    // Check status after verification
    const [, , , newStatus, verifiedBy] = await reportContract.getReportInfo(1);
    console.log("Report status after verification:", newStatus.toString()); // 2 = Verified
    console.log("Verified by:", verifiedBy);
    
    // Check verifier reward
    const verifierBalance = await rewardToken.balanceOf(await verifier.getAddress());
    console.log("Verifier reward balance:", ethers.formatEther(verifierBalance), "GCR");
  } catch (error) {
    console.log("Report verification failed:", error.message);
  }
  console.log();

  console.log("=== Step 6: Claim Reward ===");
  try {
    const initialBalance = await rewardToken.balanceOf(await user1.getAddress());
    console.log("User balance before claiming:", ethers.formatEther(initialBalance), "GCR");
    
    const tx6 = await reportContract.connect(user1).claimReward(1);
    await tx6.wait();
    console.log("✓ Reward claimed successfully");
    
    const finalBalance = await rewardToken.balanceOf(await user1.getAddress());
    console.log("User balance after claiming:", ethers.formatEther(finalBalance), "GCR");
    
    const rewardAmount = finalBalance - initialBalance;
    console.log("Reward received:", ethers.formatEther(rewardAmount), "GCR");
  } catch (error) {
    console.log("Reward claiming failed:", error.message);
  }
  console.log();

  console.log("=== Step 7: Final System Status ===");
  try {
    const totalUsers = await userVerification.getTotalUsers();
    const totalReports = await reportContract.getTotalReports();
    const tokenSupply = await rewardToken.totalSupply();
    
    console.log("Total registered users:", totalUsers.toString());
    console.log("Total reports submitted:", totalReports.toString());
    console.log("Total token supply:", ethers.formatEther(tokenSupply), "GCR");
    
    // Check report final status
    const [, , , status, , , , rewardClaimed] = await reportContract.getReportInfo(1);
    console.log("Report 1 final status:", status.toString());
    console.log("Report 1 reward claimed:", rewardClaimed);
  } catch (error) {
    console.log("Status check failed:", error.message);
  }

  console.log("\n=== Demo Complete ===");
  console.log("The GuardianChain system is fully operational!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Demo failed:", error);
    process.exit(1);
  });
