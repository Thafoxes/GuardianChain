const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("📄 === Report Retrieval Demo ===");
    
    // Get signers
    const [deployer, reporter, verifier] = await ethers.getSigners();
    
    console.log("👤 Demo Participants:");
    console.log("   Admin/Owner:", await deployer.getAddress());
    console.log("   Reporter:", await reporter.getAddress());
    console.log("   Verifier:", await verifier.getAddress());
    
    // Deploy contracts
    console.log("\n📝 Deploying contracts...");
    
    // Deploy RewardToken
    const RewardToken = await ethers.getContractFactory("RewardToken");
    const rewardToken = await RewardToken.deploy(ethers.parseEther("1000000")); // 1M tokens
    await rewardToken.waitForDeployment();
    
    // Deploy UserVerification
    const UserVerification = await ethers.getContractFactory("UserVerification");
    const userVerification = await UserVerification.deploy();
    await userVerification.waitForDeployment();
    
    // Deploy ReportContract
    const ReportContract = await ethers.getContractFactory("ReportContract");
    const reportContract = await ReportContract.deploy(
        await userVerification.getAddress(),
        await rewardToken.getAddress()
    );
    await reportContract.waitForDeployment();
    
    console.log("   ✅ All contracts deployed");
    
    // Setup permissions
    await rewardToken.addMinter(await reportContract.getAddress());
    await reportContract.addVerifier(await verifier.getAddress());
    
    console.log("\n📝 Setting up users...");
    
    // Register and verify reporter
    await userVerification.connect(reporter).registerUser("reporter@example.com", 100);
    await userVerification.connect(deployer).verifyUser(await reporter.getAddress());
    console.log("   ✅ Reporter registered and verified");
    
    // Submit a test report
    console.log("\n📄 Submitting encrypted report...");
    const reportContent = `CONFIDENTIAL SECURITY REPORT
Date: ${new Date().toISOString()}
Classification: SECRET
Report ID: TEST-${Math.random().toString(36).substr(2, 9).toUpperCase()}

INCIDENT SUMMARY:
Suspicious activity detected in DeFi protocol XYZ.
Potential smart contract vulnerability identified.

TECHNICAL DETAILS:
- Contract Address: 0x1234567890123456789012345678901234567890
- Vulnerability Type: Reentrancy in withdrawal function
- Risk Level: HIGH
- Potential Impact: $5M at risk

RECOMMENDED ACTIONS:
1. Immediate contract pause
2. Security audit
3. Community notification

This report contains sensitive information and should only be accessible to authorized personnel.`;

    const submitTx = await reportContract.connect(reporter).submitReport(reportContent);
    await submitTx.wait();
    console.log("   ✅ Report submitted with encryption");
    
    const totalReports = await reportContract.getTotalReports();
    console.log("   📊 Total reports:", totalReports.toString());
    
    // Now demonstrate retrieval by different parties
    console.log("\n🔍 === Testing Report Retrieval Access ===");
    
    const reportId = 1; // First report
    
    // 1. Reporter accessing their own report
    console.log("\n1️⃣ REPORTER accessing their own report:");
    try {
        const reporterTx = await reportContract.connect(reporter).getReportContent(reportId);
        const reporterReceipt = await reporterTx.wait();
        console.log("   ✅ SUCCESS - Reporter can access their own report");
        console.log("   📝 Transaction hash:", reporterReceipt.hash);
    } catch (error) {
        console.log("   ❌ FAILED - Reporter cannot access their own report");
        console.log("   Error:", error.message);
    }
    
    // 2. Admin/Owner accessing the report
    console.log("\n2️⃣ ADMIN/OWNER accessing the report:");
    try {
        const adminTx = await reportContract.connect(deployer).getReportContent(reportId);
        const adminReceipt = await adminTx.wait();
        console.log("   ✅ SUCCESS - Admin can access reports");
        console.log("   📝 Transaction hash:", adminReceipt.hash);
    } catch (error) {
        console.log("   ❌ FAILED - Admin cannot access reports");
        console.log("   Error:", error.message);
    }
    
    // 3. Authorized verifier accessing the report
    console.log("\n3️⃣ AUTHORIZED VERIFIER accessing the report:");
    try {
        const verifierTx = await reportContract.connect(verifier).getReportContent(reportId);
        const verifierReceipt = await verifierTx.wait();
        console.log("   ✅ SUCCESS - Verifier can access reports");
        console.log("   📝 Transaction hash:", verifierReceipt.hash);
    } catch (error) {
        console.log("   ❌ FAILED - Verifier cannot access reports");
        console.log("   Error:", error.message);
    }
    
    // 4. Check who is authorized
    console.log("\n🔍 Authorization Status:");
    console.log("   Admin is authorized verifier:", await reportContract.authorizedVerifiers(await deployer.getAddress()));
    console.log("   Verifier is authorized:", await reportContract.authorizedVerifiers(await verifier.getAddress()));
    console.log("   Reporter is authorized verifier:", await reportContract.authorizedVerifiers(await reporter.getAddress()));
    
    // 5. Get report info (non-encrypted metadata)
    console.log("\n📋 Report Metadata:");
    try {
        const reportInfo = await reportContract.getReportInfo(reportId);
        console.log("   Report ID:", reportInfo.id.toString());
        console.log("   Reporter:", reportInfo.reporter);
        console.log("   Status:", reportInfo.status);
        console.log("   Timestamp:", new Date(Number(reportInfo.timestamp) * 1000).toISOString());
        console.log("   Verified by:", reportInfo.verifiedBy);
    } catch (error) {
        console.log("   ❌ Could not get report info:", error.message);
    }
    
    console.log("\n🎉 === DEMO COMPLETE ===");
    console.log("📝 Summary:");
    console.log("   • Reports are encrypted using Sapphire's confidential computing");
    console.log("   • Only the reporter, admin, and authorized verifiers can decrypt content");
    console.log("   • Access control is enforced at the smart contract level");
    console.log("   • Report metadata is available to check status without decryption");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Demo failed:", error);
        process.exit(1);
    });
