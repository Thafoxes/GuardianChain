const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 === Systematic Debug Test ===");
    
    // Get signers
    const [deployer, reporter] = await ethers.getSigners();
    
    console.log("👤 Accounts:");
    console.log("   Deployer:", await deployer.getAddress());
    console.log("   Reporter:", await reporter.getAddress());
    
    // Deploy fresh contract
    console.log("\n📝 Deploying UserVerification...");
    const UserVerification = await ethers.getContractFactory("UserVerification");
    const contract = await UserVerification.deploy();
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    console.log("   Contract:", contractAddress);
    
    // Step 1: Check initial state
    console.log("\n🔍 Step 1: Initial State");
    const isRegBefore = await contract.isRegistered(await reporter.getAddress());
    console.log("   Reporter isRegistered:", isRegBefore);
    
    const checkBefore = await contract.connect(reporter).checkMyRegistration();
    console.log("   Reporter checkMyRegistration:", checkBefore);
    
    // Step 2: Register user
    console.log("\n📝 Step 2: Register Reporter");
    const registerTx = await contract.connect(reporter).registerUser("test@example.com", 100);
    const receipt = await registerTx.wait();
    console.log("   Registration tx:", receipt.hash);
    console.log("   Block number:", receipt.blockNumber);
    console.log("   Gas used:", receipt.gasUsed.toString());
    console.log("   Status:", receipt.status);
    
    // Check for events
    console.log("   Events emitted:");
    for (const log of receipt.logs) {
        try {
            const parsedLog = contract.interface.parseLog(log);
            console.log(`     ${parsedLog.name}:`, parsedLog.args);
        } catch (e) {
            console.log("     Unparseable log:", log);
        }
    }
    
    // Step 3: Check state after registration
    console.log("\n🔍 Step 3: After Registration");
    const isRegAfter = await contract.isRegistered(await reporter.getAddress());
    console.log("   Reporter isRegistered:", isRegAfter);
    
    const checkAfter = await contract.connect(reporter).checkMyRegistration();
    console.log("   Reporter checkMyRegistration:", checkAfter);
    
    // NEW: Debug msg.sender
    const [msgSender, msgSenderReg] = await contract.connect(reporter).debugMsgSender();
    console.log("   Reporter msg.sender in contract:", msgSender);
    console.log("   isRegistered[msg.sender]:", msgSenderReg);
    console.log("   Expected address:", await reporter.getAddress());
    console.log("   Address match:", msgSender === await reporter.getAddress());
    
    // Step 4: Test simple modifier function
    console.log("\n🔍 Step 4: Test Simple Modifier");
    try {
        const testResult = await contract.connect(reporter).testModifier();
        console.log("   ✅ testModifier passed:", testResult);
    } catch (error) {
        console.log("   ❌ testModifier failed:", error.message);
        console.log("   Error details:", error.reason || error.data);
    }
    
    // Step 5: Test getMyIdentifier
    console.log("\n🔍 Step 5: Test getMyIdentifier");
    try {
        const identifier = await contract.connect(reporter).getMyIdentifier();
        console.log("   ✅ getMyIdentifier passed:", identifier);
    } catch (error) {
        console.log("   ❌ getMyIdentifier failed:", error.message);
        console.log("   Error details:", error.reason || error.data);
        
        // Additional debugging
        console.log("\n🔧 Additional Debug:");
        console.log("   Reporter balance:", ethers.formatEther(await ethers.provider.getBalance(await reporter.getAddress())));
        console.log("   Contract code size:", (await ethers.provider.getCode(contractAddress)).length);
        
        // Try static call
        try {
            const staticResult = await contract.connect(reporter).checkMyRegistration.staticCall();
            console.log("   Static checkMyRegistration:", staticResult);
        } catch (staticError) {
            console.log("   Static call also failed:", staticError.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });
