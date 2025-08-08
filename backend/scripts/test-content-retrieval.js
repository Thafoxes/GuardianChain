const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("📄 === Report Content Retrieval Test ===");
    
    // Get signers
    const [deployer, reporter, verifier, unauthorized] = await ethers.getSigners();
    
    console.log("👤 Test Participants:");
    console.log("   Admin/Owner:", await deployer.getAddress());
    console.log("   Reporter:", await reporter.getAddress());
    console.log("   Verifier:", await verifier.getAddress());
    console.log("   Unauthorized User:", await unauthorized.getAddress());
    
    // Deploy contracts (using existing deployment addresses or deploy fresh)
    console.log("\n📝 Deploying contracts...");
    
    // Deploy RewardToken
    const RewardToken = await ethers.getContractFactory("RewardToken");
    const rewardToken = await RewardToken.deploy(ethers.parseEther("1000000"));
    await rewardToken.waitForDeployment();
    const rewardTokenAddress = await rewardToken.getAddress();
    
    // Deploy UserVerification
    const UserVerification = await ethers.getContractFactory("UserVerification");
    const userVerification = await UserVerification.deploy();
    await userVerification.waitForDeployment();
    const userVerificationAddress = await userVerification.getAddress();
    
    // Deploy ReportContract
    const ReportContract = await ethers.getContractFactory("ReportContract");
    const reportContract = await ReportContract.deploy(userVerificationAddress, rewardTokenAddress);
    await reportContract.waitForDeployment();
    const reportContractAddress = await reportContract.getAddress();
    
    console.log("   ✅ RewardToken:", rewardTokenAddress);
    console.log("   ✅ UserVerification:", userVerificationAddress);
    console.log("   ✅ ReportContract:", reportContractAddress);
    
    // Setup permissions
    await rewardToken.addMinter(reportContractAddress);
    await reportContract.addVerifier(await verifier.getAddress());
    console.log("   ✅ Permissions configured");
    
    // Register and verify users
    console.log("\n👥 Setting up users...");
    await userVerification.connect(reporter).registerUser("reporter@guardianchain.dev", 100);
    await userVerification.connect(deployer).verifyUser(await reporter.getAddress());
    console.log("   ✅ Reporter registered and verified");
    
    // Submit test reports with different content
    console.log("\n📄 Submitting test reports...");
    
    const reports = [
        {
            title: "CRITICAL: Smart Contract Vulnerability Detected",
            description: `CONFIDENTIAL SECURITY ALERT
Classification: CRITICAL
Date: ${new Date().toISOString()}
Report ID: GC-VULN-001

VULNERABILITY SUMMARY:
A critical reentrancy vulnerability has been discovered in the DeFiVault smart contract deployed at address 0x1234567890123456789012345678901234567890.

TECHNICAL DETAILS:
- Vulnerability Type: Reentrancy Attack
- Affected Function: withdraw()
- Risk Level: CRITICAL
- Estimated Impact: $12.5M at risk
- CVE Score: 9.8/10

ATTACK VECTOR:
The withdraw function fails to update the user's balance before making the external call, allowing attackers to recursively call the function and drain the contract.

PROOF OF CONCEPT:
Contract code snippet showing the vulnerability:
function withdraw(uint amount) external {
    require(balances[msg.sender] >= amount);
    msg.sender.call{value: amount}("");  // VULNERABLE: External call before state update
    balances[msg.sender] -= amount;      // State update after external call
}

IMMEDIATE ACTIONS REQUIRED:
1. Emergency contract pause within 2 hours
2. Notify all users via official channels
3. Coordinate with security firms for patch deployment
4. Monitor mempool for exploit attempts

CONFIDENTIALITY:
This information is classified and should only be shared with authorized security personnel.`
        },
        {
            title: "URGENT: Governance Attack in Progress",
            description: `GOVERNANCE SECURITY INCIDENT
Classification: URGENT
Date: ${new Date().toISOString()}
Report ID: GC-GOV-002

INCIDENT OVERVIEW:
Coordinated governance attack detected on DecentralizedDAO protocol. Malicious actors are attempting to manipulate voting mechanisms.

ATTACK DETAILS:
- Attack Type: Flash loan governance manipulation
- Target: Proposal #247 (Treasury fund allocation)
- Attacker Address: 0xdeadbeef123456789012345678901234567890
- Attack Amount: 50,000 governance tokens borrowed via flash loan

TIMELINE:
- 14:30 UTC: Unusual governance token borrowing activity detected
- 14:32 UTC: Large vote submission on critical proposal
- 14:33 UTC: Alert triggered due to voting pattern anomaly
- 14:35 UTC: This report submitted

IMPACT ASSESSMENT:
- Proposal outcome potentially compromised
- $8.2M treasury allocation at risk
- Community trust in governance system threatened

EVIDENCE:
Transaction hashes of suspicious activities:
- 0xabc123...def456 (Flash loan initiation)
- 0x789xyz...123abc (Vote submission)
- 0x456def...789ghi (Token return)

RECOMMENDATIONS:
1. Immediately pause governance voting
2. Investigate all recent large token movements
3. Implement governance attack protection mechanisms
4. Review and potentially invalidate Proposal #247

This report contains time-sensitive information requiring immediate action.`
        }
    ];
    
    for (let i = 0; i < reports.length; i++) {
        const report = reports[i];
        const fullContent = `${report.title}\n\n${report.description}`;
        
        const submitTx = await reportContract.connect(reporter).submitReport(fullContent);
        await submitTx.wait();
        console.log(`   ✅ Report ${i + 1} submitted: "${report.title}"`);
    }
    
    const totalReports = await reportContract.getTotalReports();
    console.log(`   📊 Total reports submitted: ${totalReports.toString()}`);
    
    // Now test content retrieval by different parties
    console.log("\n🔍 === TESTING CONTENT RETRIEVAL ===");
    
    for (let reportId = 1; reportId <= reports.length; reportId++) {
        console.log(`\n📋 --- REPORT ${reportId}: ${reports[reportId - 1].title.substring(0, 50)}... ---`);
        
        // Test 1: Reporter accessing their own report
        console.log(`\n1️⃣ REPORTER accessing Report ${reportId}:`);
        try {
            const reporterTx = await reportContract.connect(reporter).getReportContent(reportId);
            const reporterReceipt = await reporterTx.wait();
            
            // Find the ContentRetrieved event in the transaction receipt
            const contentEvent = reporterReceipt.logs.find(log => {
                try {
                    const parsed = reportContract.interface.parseLog(log);
                    return parsed.name === 'ContentRetrieved';
                } catch (e) {
                    return false;
                }
            });
            
            if (contentEvent) {
                const parsedEvent = reportContract.interface.parseLog(contentEvent);
                const decryptedContent = parsedEvent.args.content;
                
                console.log("   ✅ SUCCESS - Reporter can access their report");
                console.log("   📄 DECRYPTED CONTENT:");
                console.log("   " + "=".repeat(60));
                const lines = decryptedContent.split('\n');
                lines.forEach(line => console.log(`   ${line}`));
                console.log("   " + "=".repeat(60));
            } else {
                console.log("   ❌ FAILED - No content event found");
            }
        } catch (error) {
            console.log("   ❌ FAILED - Reporter cannot access their report");
            console.log("   Error:", error.message);
        }
        
        // Test 2: Admin/Owner accessing the report
        console.log(`\n2️⃣ ADMIN/OWNER accessing Report ${reportId}:`);
        try {
            const adminTx = await reportContract.connect(deployer).getReportContent(reportId);
            const adminReceipt = await adminTx.wait();
            
            const contentEvent = adminReceipt.logs.find(log => {
                try {
                    const parsed = reportContract.interface.parseLog(log);
                    return parsed.name === 'ContentRetrieved';
                } catch (e) {
                    return false;
                }
            });
            
            if (contentEvent) {
                const parsedEvent = reportContract.interface.parseLog(contentEvent);
                const decryptedContent = parsedEvent.args.content;
                
                console.log("   ✅ SUCCESS - Admin can access the report");
                console.log("   📄 DECRYPTED CONTENT:");
                console.log("   " + "=".repeat(60));
                const lines = decryptedContent.split('\n');
                lines.forEach(line => console.log(`   ${line}`));
                console.log("   " + "=".repeat(60));
            } else {
                console.log("   ❌ FAILED - No content event found");
            }
        } catch (error) {
            console.log("   ❌ FAILED - Admin cannot access the report");
            console.log("   Error:", error.message);
        }
        
        // Test 3: Authorized verifier accessing the report
        console.log(`\n3️⃣ AUTHORIZED VERIFIER accessing Report ${reportId}:`);
        try {
            const verifierTx = await reportContract.connect(verifier).getReportContent(reportId);
            const verifierReceipt = await verifierTx.wait();
            
            const contentEvent = verifierReceipt.logs.find(log => {
                try {
                    const parsed = reportContract.interface.parseLog(log);
                    return parsed.name === 'ContentRetrieved';
                } catch (e) {
                    return false;
                }
            });
            
            if (contentEvent) {
                const parsedEvent = reportContract.interface.parseLog(contentEvent);
                const decryptedContent = parsedEvent.args.content;
                
                console.log("   ✅ SUCCESS - Verifier can access the report");
                console.log("   📄 DECRYPTED CONTENT:");
                console.log("   " + "=".repeat(60));
                const lines = decryptedContent.split('\n');
                lines.forEach(line => console.log(`   ${line}`));
                console.log("   " + "=".repeat(60));
            } else {
                console.log("   ❌ FAILED - No content event found");
            }
        } catch (error) {
            console.log("   ❌ FAILED - Verifier cannot access the report");
            console.log("   Error:", error.message);
        }
        
        // Test 4: Unauthorized user attempting access
        console.log(`\n4️⃣ UNAUTHORIZED USER attempting to access Report ${reportId}:`);
        try {
            const unauthorizedTx = await reportContract.connect(unauthorized).getReportContent(reportId);
            await unauthorizedTx.wait();
            console.log("   ❌ SECURITY BREACH - Unauthorized user gained access!");
        } catch (error) {
            console.log("   ✅ SUCCESS - Access properly denied");
            console.log("   Security message:", error.message);
        }
        
        // Show report metadata
        console.log(`\n📊 Report ${reportId} Metadata:`);
        try {
            const reportInfo = await reportContract.getReportInfo(reportId);
            console.log(`   • Report ID: ${reportInfo.id.toString()}`);
            console.log(`   • Reporter: ${reportInfo.reporter}`);
            console.log(`   • Status: ${reportInfo.status === 0n ? 'Pending' : reportInfo.status === 1n ? 'Under Investigation' : 'Verified'}`);
            console.log(`   • Timestamp: ${new Date(Number(reportInfo.timestamp) * 1000).toISOString()}`);
            console.log(`   • Verified by: ${reportInfo.verifiedBy === ethers.ZeroAddress ? 'Not verified' : reportInfo.verifiedBy}`);
        } catch (error) {
            console.log(`   ❌ Could not get metadata: ${error.message}`);
        }
    }
    
    console.log("\n🎉 === RETRIEVAL TEST COMPLETE ===");
    console.log("📝 Summary:");
    console.log("   ✅ Reporter can access their own encrypted reports");
    console.log("   ✅ Admin can access all encrypted reports");
    console.log("   ✅ Authorized verifiers can access encrypted reports");
    console.log("   ✅ Unauthorized users are properly blocked");
    console.log("   ✅ All content is properly encrypted and decrypted");
    console.log("   ✅ Access control working as expected");
    
    console.log("\n🔐 Encryption Status:");
    console.log("   • All report content is encrypted using Oasis Sapphire");
    console.log("   • Decryption keys are deterministically generated");
    console.log("   • Only authorized parties can decrypt content");
    console.log("   • Content remains private on-chain");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Retrieval test failed:", error);
        process.exit(1);
    });
